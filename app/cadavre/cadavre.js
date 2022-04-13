'use strict';

const mongoose = require('mongoose');
const utils = require('../utils');
const maps = require('../map/map');
const crypto = require('crypto');
const socketio = require("socket.io");


let guids = [];
const maxGuidToKeep = 3;
const cadavreMaxPathTick = 800;
const cadavreCooldown = 1200;
let guidsCount = 0;

const cadavresHash = [];

// socket
let io;
/**
 * Pool of cadavres to be sent to client
 * - key : mapTitle
 * - value: cadavres[]
 */
let cadavresPool = new Map();
const loopFrequency = 500; // ms
let intervalLoopId;

const cadavreSchema = mongoose.Schema({
    x: Number,
    y: Number,
    date: Date,
    path: [[String]],
    level: String,
    rot: Number,
    color: String,
});
const CadavreModel = mongoose.model('Cadavre', cadavreSchema);

function getCadavres(level, callback) {
    if (!level) return callback(null, 400, 'missing parameters');

    CadavreModel.find(
        {
            level,
        },
        (err, data) => {
            if (err) return callback(null, 500, err);
            return callback(data);
        }
    ).sort({date: -1});
}

/**
 * Compare cadavres hash and localhash. 
 * If hash are identical, returns true.
 * If hash are different, returns cadavres.
 * @param {*} level 
 * @param {*} localhash 
 * @param {*} callback 
 */
function getCadavresHash(level, localhash, callback) {
    if (cadavresHash[level]) {
        if (cadavresHash[level] == localhash) {
            return callback(true);
        }
    }

    CadavreModel.find(
        {
            level,
        },
        (err, data) => {
            if (err) return callback(null, 500, err);

            const chain = data.map(c => c.x+'!'+c.y).sort().join('-');
            const hash = crypto.createHash('md5').update(chain).digest('hex');
            cadavresHash[level] = hash;
            
            if (hash == localhash) {
                return callback(true);
            }
            return callback(data);
        }
    ).sort({date: -1});
}


function addCadavre(req, callback, admin = false) {
    let params = utils.getParamsFromRequest(req, {
        x:null,
        y:null,
        path:null,
        level:null,
        rot:null,
        color:null,
        guid: null,
        date: new Date(),
    });
    if(!params.x || !params.y || !params.level || !params.color) {
        return callback(null, 400, 'missing parameters');
    }
    if (!admin) {
        // check is allowed by map (only check cached map for now)
        if (maps.cachedMaps[params.level] && maps.cachedMaps[params.level].map.options) {
            if (maps.cachedMaps[params.level].map.options.disablePersistentCadavres) {
                return callback(null, 400, 'not allowed by map');
            }
        }
        if (guidsCount > maxGuidToKeep) {
            // reset guids
            guids = [];
            guidsCount = 0;
        }
        if (!params.guid || !checkGuid(params.guid))  {
            return callback(null, 400, 'invalid guid');
        }
        if(!guids[params.guid]) {
            // not present
            guids[params.guid] = new Date().getTime();
            guidsCount++;
        } else {
            // check date
            if(new Date().getTime() - guids[params.guid] > cadavreCooldown) {
                // ok 
                delete guids[params.guid];
            } else {
                // ko
                guids[params.guid] = new Date().getTime();
                return callback(null, 400, 'cadavre cooldown');
            }
        }
    }
    
    //check path
    if(params.path && (params.path.length > cadavreMaxPathTick || params.path.length == 0)) {
        params.path = null;
    }
    
    const obj = new CadavreModel(params);
    obj.save(err => {
        if (err) return callback(null, 500, err);
        // pool cadavre (ws)
        if (!cadavresPool.has(params.level)) cadavresPool.set(params.level, []);
        cadavresPool.get(params.level).push(obj);

        return callback(obj);
    });
}

/**
 * Remove all cadavres from map
 * @param {*} title 
 * @param {*} callback 
 * @returns 
 */
function removeCadavres(title, callback) {
    if(!title) return callback(null, 400, 'missing parameters');
    CadavreModel.deleteMany({level: title}, (err) => {
        if (err) return callback(null, 500, err);
        return callback('ok');
    });
}

/**
 * Remove some cadavres
 * @param {*} title map
 * @param {*} ids list of ids
 * @param {*} callback 
 */
function removeSomeCadavres(title, ids, callback) {
    if (!title || !ids) return callback(null, 400, 'missing parameters');
    const cleanIds = ids.filter(o => o.length > 20);

    CadavreModel.deleteMany({
        level: title, 
        _id: {$in: cleanIds}}, err => {
        if (err) return callback(null, 500, err);
        return callback('ok');  
    })
}

function checkGuid(guid) {
    return guid.length == 36;
}


function createWebSocketServer(server) {
    io = socketio(server, {});

    io.on('connection', socket => {
        console.log('client connected to ws');

        socket.join('START');

        socket.on('changeroom', (titles) => {
            socket.leave(titles.old);
            socket.join(titles.new);
        });
    });

    console.log('webSocket initialized');

    intervalLoopId = createLoop();
}

function createLoop() {
    return setInterval(() => {
        if (cadavresPool.size > 0) {
            console.log('pool has cadavres');
            [...cadavresPool.keys()].forEach(title => {
                sendCadavresToRoom(title, cadavresPool.get(title));
            });
            cadavresPool = new Map();
        }
    }, loopFrequency);
}


function sendCadavresToRoom(title, cadavres) {
    if (!cadavres || cadavres.length == 0) {
        return;
    }
    console.log('sending to toom ' + title + ' '+cadavres.length+' cadavres');
    io.to(title).emit('cadavres', cadavres);
}




module.exports = {
    getCadavres,
    addCadavre,
    removeCadavres,
    removeSomeCadavres,
    createWebSocketServer,
    getCadavresHash,
};