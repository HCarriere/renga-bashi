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
        {upsert: true})
    .then(doc => {
        return callback(doc, 200);
    })
    .catch(err => {
        return callback(null, 500, err);
    });
}


// callback(result, status, err)
function getMap(req, callback) {
    let title;
    
    if(req.params.title) {
        title = req.params.title;
    } else {
        title = process.env.START_LEVEL || '0';
    }
    
    
    _getMap(title, (map, error, msg) => {
        if (error) return callback(null, error, msg);
        return callback(map.map);
    });
}

/**
 * Get next map data 
 * @param {*} req req.params.from, req.params.endAlias
 * @param {*} callback {map: MapData, title:string, alias: string}
 */
function getNextMap(req, callback) {
    const title = req.query.title;
    const endAlias = req.query.endAlias;
    let toTitle;
    let toAlias;
    if (!title || !endAlias) return callback(null, 400, 'missing arguments');

    // get current map to get links
    _getMap(title, (map, error, msg) => {
        if (error) return callback(null, error, msg);
        if (!map.links || map.links.length == 0) return callback(null, 400, 'map links missing');
        const link = map.links.find(l => l.endAlias == endAlias);
        if (link) {
            toTitle = link.destinationMap;
            toAlias = link.destinationAlias;
        }
        if (!toTitle || !toAlias) return callback(null, 400, 'map leeds nowhere');
        // get new map
        _getMap(toTitle, (m, error, msg) => {
            if (error) return callback(null, error, msg);
            return callback({map: m.map, title: m.title, alias: toAlias});
        });
    });
}

function _getMap(title, callback) {
    // check if cached
    if(cachedMaps[title]) {
        return callback(cachedMaps[title]);
    }
    MapModel.findOne({title})
    .then(data => {
        if (!data) return callback(null, 500);
        cachedMaps[title] = data;
        return callback(data);
    })
    .catch(err => {
        return callback(null, 500, err);
    });
}


function getAllMaps(callback) {
    MapModel.find({})
    .then(maps => {
        return callback(maps);
    })
    .catch(err => {
        return callback(null, 500, err);
    });
}


function deleteMap(req, callback) {
    if (!req.params.title) return callback(null, 400, 'missing parameters');

    MapModel.deleteOne({title: req.params.title})
    .then(err => { 
        return callback('ok');
    })
    .catch(err => {
        return callback(null, 500, err);
    });
}


module.exports = {
    addMap,
    getMap,
    getAllMaps,
    deleteMap,
    getNextMap,
    cachedMaps,
}