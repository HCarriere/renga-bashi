'use strict';

const mongoose = require('mongoose');
let utils = require('../utils');


let guids = [];
const maxGuidToKeep = 3;
const cadavreMaxPathTick = 800;
const cadavreMaxPathNumber = 10;
let guidsCount = 0;

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

function getCadavres(req, callback) {
    let date;
    if(req.query.date) {
        date = req.query.date;
    } else {
        date = 0;
    }
    const level = req.query.level;
    if (!level) return callback(null, 400, 'missing parameters');

    CadavreModel.find(
        {
            level, 
            date: {'$gt': date},
        },
        (err, data) => {
            if (err) return callback(null, 500, err);
            // only keep the nth first path
            return callback(data.slice(0, cadavreMaxPathNumber));
        }
    ).sort({date: -1});
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
        /*mongo.add(cadavreSchema, () => {
            console.log('cadavre added');
            callback('ok');
        }, params);*/
        const obj = new CadavreModel(params);
        obj.save(err => {
            if (err) return callback(null, 500, err);
            return callback('ok');
        });
    } else {
        callback({message:'error'});
    }
}

function removeCadavres(req, callback) {
    if(!req.body.title) return callback(null, 400, 'missing parameters');
    CadavreModel.deleteMany({level: req.body.title}, (err) => {
        if (err) return callback(null, 500, err);
        return callback('ok');
    });

    /*mongo.remove(cadavreSchema, (err, result) => {
        if(err) {
            return callback(null, 500, err);
        }
        return callback(result);
    }, {level: req.body.title});*/
    
}

function checkGuid(guid) {
    return guid.length == 36;
}

module.exports = {
    getCadavres,
    addCadavre,
    removeCadavres,
};