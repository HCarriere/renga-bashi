'use strict';

const mongoose = require('mongoose');
const WebSocket = require('ws');
const utils = require('../utils');
const maps = require('../map/map');
const crypto = require('crypto');

let guids = [];
const maxGuidToKeep = 3;
const cadavreMaxPathTick = 800;
const cadavreCooldown = 1200;
let guidsCount = 0;

const cadavresHash = [];

let wss;
const wsClients = new Map();

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
        // send info to wsClients
        [...wsClients.keys()].forEach((client) => {
            client.send(wsObject('cadavre', obj));
        });
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

/**
 * Create the websocket connection
 * https://github.com/websockets/ws
 * @param {number} port 
 */
function createWebSocketServer(port) {
    wss = new WebSocket.Server({port});
    console.log('WebSocket server created on port ' + port)

    wss.on('connection', (ws, req) => {
        onClientConnect(ws, req);

        ws.on('close', () => {
            onClientDisconnect(ws)
        });
    });

    
}

function onClientConnect(ws, req) {
    // const ip = req.socket.remoteAddress;
    wsClients.set(ws, utils.uuidv4());

    console.log('new client (existing clients : ' + wsClients.size+ ')');
}

function onClientDisconnect(ws) {
    wsClients.delete(ws);

    console.log('removing client (existing clients : ' + wsClients.size+ ')');
}


function wsObject(key, obj) {
    return JSON.stringify({key, obj});
}


module.exports = {
    getCadavres,
    addCadavre,
    removeCadavres,
    removeSomeCadavres,
    createWebSocketServer,
    getCadavresHash,
};