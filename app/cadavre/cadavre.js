'use strict';

let mongo = require('../mongo');
let cadavreSchema = require('./schema').Schema;
let utils = require('../utils');

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
        date: new Date(),
    });
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

module.exports = {
    getCadavres,
    addCadavre,
};