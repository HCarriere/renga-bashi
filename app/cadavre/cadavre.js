'use strict';

let mongo = require('../mongo');
let cadavreSchema = require('./schema').Schema;
let utils = require('../utils');

let guids = [];
const maxGuidToKeep = 3;
const cadavreMaxPathTick = 800;
const cadavreMaxPathNumber = 10;
let guidsCount = 0;

function getCadavres(req, callback) {
    let date;
    if(req.query.date) {
        date = req.query.date;
    } else {
        date = 0;
    }
    let level = req.query.level;
    // schema,callback, jsonRequest, limit, sort, offset
    mongo.findWithOptions(cadavreSchema, (err, data) => {
        if(!err && data) {
            // only keep the nth first path
            
            for(let i=0; i<data.length; i++) {
                if(i>cadavreMaxPathNumber) {
                    data[i].path = [];
                }
            }
            
            callback(data);
            return;
        }
    }, {
        level: level,
        date: {'$gt': date}
    },0,{date:-1}, 0);
}

function addCadavre(req, callback) {
    console.log('guids:'+guidsCount);
    if(guidsCount > maxGuidToKeep) {
        guids = [];
        guidsCount = 0;
        console.log('guid cleaned');
    }
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
    if(!params.x || !params.y || !params.level || !params.rot || !params.color) {
        // not valid
        callback({message:'error'});
        return;
    }
    if(params.guid && checkGuid(params.guid)) {
        // check guid
        if(!guids[params.guid]) {
            // not present
            guids[params.guid] = new Date().getTime();
            guidsCount++;
        } else {
            // check date
            if(new Date().getTime() - guids[params.guid] > 2300) {
                // ok 
                delete guids[params.guid];
            } else {
                // nok
                console.log('unauthorized guid : '+params.guid);
                guids[params.guid] = new Date().getTime();
                return;
            }
        }
    } else {
        return;
    }
    //check path
    if(params.path && (params.path.length > cadavreMaxPathTick || params.path.length == 0)) {
        params.path = null;
    } else {
        // transform path
        /*let newPath = [];
        for(let i=0; i<cadavreMaxPathTick; i++) {
            if(params.path[i]) {
                newPath.push(params.path[i]);
            }else {
                newPath.push(['0']);
            }
        }
        params.path = newPath;
        console.log('new path:'+JSON.stringify(params.path));*/
    }
    //console.log('params received : '+JSON.stringify(params));
    if(params && 
       params.x && 
       params.y && 
       params.level) {
        mongo.add(cadavreSchema, () => {
            console.log('cadavre added');
            callback('ok');
        }, params);
    } else {
        callback({message:'error'});
    }
}


function removeCadavres(req, callback) {
    if(req.body.title) {
        mongo.remove(cadavreSchema, (err, result) => {
            if(err) {
                return callback(null, 500, err);
            }
            return callback(result);
        }, {level: req.body.title});
    } 
}

function checkGuid(guid) {
    return guid.length == 36;
}

module.exports = {
    getCadavres,
    addCadavre,
    removeCadavres,
};