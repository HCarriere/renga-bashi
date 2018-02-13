'use strict';

let mongoose = require('mongoose');
const conf = require('../../config')
let mongo = require('../mongo');
let utils = require('../utils');

let cachedMaps = [];

const mapSchema = {
    schema:mongoose.Schema({
        title: String,
        map: mongoose.Schema.Types.Mixed,
    }),
    collection : conf.database.collections.map,
};


// callback(result, status, err)
function addMap(req, callback) {
    // update cache
    cachedMaps[req.body.title] = req.body;
    mongo.update(mapSchema, (err, result) => {
        if(err) {
            return callback(null, 500, err);
        }
        return callback(result);
    },
    {
        title: req.body.title
    },//condition
    {
        title: req.body.title,
        map: req.body.map,
    },//update
    {
        upsert: true,
        setDefaultOnInsert: true,
    });//option
    
}


// callback(result, status, err)
function getMap(req, callback) {
    if(!req.query) {
        return callback(null, 400, 'invalid parameters');
    }
    let title;
    
    if(req.query.level=='START') {
        title = process.env.START_LEVEL || '0';
    } else {
        title = req.query.level;
    }
    // check if cached
    if(cachedMaps[title]) {
        return callback(cachedMaps[title]);
    }
    
    // if not cached, query it
    console.log('requested map:'+title);
    mongo.findOne(
        mapSchema, 
        (err, data)=>{
            if(err) {
                return callback(null, 500, err);
            }
            // cache it
            cachedMaps[title] = data;
            return callback(data);
        }, 
        {title: title}
    );
}


module.exports = {
    addMap,
    getMap,
}