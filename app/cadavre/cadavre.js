'use strict';

let mongo = require('../mongo');
let cadavreSchema = require('./schema').Schema;
let utils = require('../utils');

let guids = [];

function getCadavres(req, callback) {
    let date;
    if(req.query.date) {
        date = req.query.date;
    } else {
        date = 0;
    }
    let level = req.query.level;
    mongo.find(cadavreSchema, (err, data) => {
        if(!err && data) {
            callback(data);
            return;
        }
    }, {
        level: level,
        date: {'$gte': date}
    });
}

function addCadavre(req, callback) {
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
    if(params.guid && checkGuid(params.guid)) {
        // check guid
        console.log('A:'+params.guid);
        if(!guids[params.guid]) {
            // not present
            guids[params.guid] = new Date().getTime();
        } else {
            // check date
            console.log('A:checking dates...'+(new Date().getTime() - guids[params.guid]));
            if(new Date().getTime() - guids[params.guid] > 4500) {
                // ok 
                console.log('B:'+guids[params.guid]);
                delete guids[params.guid];
            } else {
                // nok
                guids[params.guid] = new Date().getTime();
                return;
            }
        }
    } else {
        return;
    }
    //console.log('params received : '+JSON.stringify(params));
    if(params && 
       params.x && 
       params.y && 
       params.level) {
        mongo.add(cadavreSchema, () => {
            console.log('cadavre added');
            callback({message:'ok'});
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