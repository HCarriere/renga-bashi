'use strict';

const mongoose = require('mongoose');
const utils = require('../utils');
const maps = require('../map/map');


let guids = [];
const maxGuidToKeep = 3;
const cadavreMaxPathTick = 800;
const cadavreCooldown = 2000;
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
    const level = req.query.title;

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
        return callback('ok');
    });
}

function removeCadavres(title, callback) {
    if(!title) return callback(null, 400, 'missing parameters');
    CadavreModel.deleteMany({level: title}, (err) => {
        if (err) return callback(null, 500, err);
        return callback('ok');
    });
}

function checkGuid(guid) {
    return guid.length == 36;
}

module.exports = {
    getCadavres,
    addCadavre,
    removeCadavres,
};