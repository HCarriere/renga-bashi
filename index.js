'use strict';

const express = require('express');
const http = require('http');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');

const config = require('./config');
const app = express();
const port = process.env.PORT || config.server.port;
const server = http.createServer(app);

const mongo = require('./app/mongo');
const cadavre = require('./app/cadavre');

const CORS = process.env.CORS || '*';
mongo.initMongo();

server.timeout = 0;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/client'));
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', CORS);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    next();
});

app
.get('/', (req, res) => {
    res.sendFile(__dirname + '/client/cadavre.html');
})
// ROOMS
.get('/api/cadavres', (req, res) => {
    console.log('/api/cadavres : '+JSON.stringify(req.query));
    cadavre.getCadavres(req, (data) => {
        res.json(data);
    })
})
.get('/api/map', (req, res) => {
    console.log('/api/map : '+JSON.stringify(req.query));
    getMap(req.query.level, map => {
        if(map && map!=-1) res.json(map);
        else res.json({error: 'error getting map'});
    });
})
.post('/api/cadavres/add', (req, res) => {
    console.log('/api/cadavres/add : '+JSON.stringify(req.body));
    cadavre.addCadavre(req, (data) => {
        res.json(data);
    })
})
.post('/api/map/add', (req, res) => {
    console.log('/api/map/add : '+JSON.stringify(req.body));
    
    if(req.body && 
       req.body.password == process.env.API_PASSWORD) {
        console.log('ok');
    } else {
        return;
    }
    
    if(req.body && req.body.map && req.body.name) {
        addMap(req.body.map, req.body.name, message => {
            res.json(message);
        });
    } else {
        res.json('invalid parameters');
    }
})

.get('*', (req, res) => {
    res.status(404);
	sendJSON(res, {code:404});
})

// Error handler //////////
.use((err, req, res, next) => {
    console.log('Express error handler):' + err);
    sendJSON(res, err);
});

// application launch
server.listen(port, (err) => {
    if(err) {
        return console.log('Node launch error', err);
    }
    console.log(`API listening to *:${port})`);
});


/**
 * send a JSON to response header
 * @param  {[Object]} response
 * @param  {[Object]} json
 */
function sendJSON(response, json) {
	response.contentType('application/json');
	response.send(JSON.stringify(json, null, 4));
}

let cacheMaps = [];

function getMap(level, callback) {
    if(!level) {
        callback();
        return;
    }
    if(cacheMaps[level]) {
        callback(cacheMaps[level]);
        return;
    }
    console.log('map '+level+' not cached. Reading files...');
    fs.readFile('./maps/'+level+'.json', (err, map) => {
        if(err) {
            console.log('error reading map:'+err);
            cacheMaps[level] = -1;
        } else if(map){
            cacheMaps[level] = JSON.parse(map);
            callback(cacheMaps[level]);
            return;
        }
        callback();
    });
}

function addMap(map, name, callback) {
    fs.writeFile('./maps/'+name+'.json', JSON.stringify(map), err => {
        if(err) {
            callback(err);
        } else {
            callback(name);
        }
    });
}