'use strict';

let mongoose = require('mongoose');

let cachedMaps = [];

const mapSchema = mongoose.Schema({
    title: String,
    map: mongoose.Schema.Types.Mixed,
    links: mongoose.Schema.Types.Mixed,
});

const MapModel = mongoose.model('Map', mapSchema);

// callback(result, status, err)
function addMap(req, callback) {
    // update cache
    const title = req.body.title;
    const map = req.body.map;
    const links = req.body.links;
    if (!title || !map || !links) return callback(null, 400, 'missing arguments');

    cachedMaps[title] = req.body;

    MapModel.findOneAndUpdate(
        {title: req.body.title},
        {title, map, links},
        {upsert: true},
        (err, doc) => {
            if (err) return callback(null, 500, err);
            return callback(doc, 200);
        }
    );
}


// callback(result, status, err)
function getMap(req, callback) {
    let title;
    
    if(req.params.title) {
        title = req.params.title;
    } else {
        title = process.env.START_LEVEL || '0';
    }
    
    // check if cached
    if(cachedMaps[title]) {
        return callback(cachedMaps[title]);
    }
    
    // if not cached, query it
    console.log('requested map:'+title);
    MapModel.findOne({title}, (err, data) => {
        if (err) return callback(null, 500, err);
        if (!data) return callback(null, 404, 'not found');
        cachedMaps[title] = data;
        return callback(data);
    });
}


function getAllMaps(callback) {
    MapModel.find({}, (err, maps) => {
        if (err) return callback(null, 500, err);
        return callback(maps);
    });
}


function deleteMap(req, callback) {
    if (!req.params.title) return callback(null, 400, 'missing parameters');

    MapModel.deleteOne({title: req.params.title}, (err) => {
        if (err) return callback(null, 500, err);
        return callback('ok');
    });
}


module.exports = {
    addMap,
    getMap,
    getAllMaps,
    deleteMap,
}