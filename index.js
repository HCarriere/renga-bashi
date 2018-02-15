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
const map = require('./app/map');

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
// cadavres
.get('/api/cadavres', (req, res) => {
    console.log('/api/cadavres : '+JSON.stringify(req.query));
    cadavre.getCadavres(req, (data) => {
        res.json(data);
    })
})
.post('/api/cadavres/add', (req, res) => {
    //console.log('/api/cadavres/add : '+JSON.stringify(req.body));
    cadavre.addCadavre(req, (data) => {
        res.json(data);
    })
})
.post('/api/cadavres/remove',
     mustBeAdmin(),
     (req, res) => {
    console.log('/api/cadavres/remove');
    cadavre.removeCadavres(req, (result, status, err) => {
        handleAPIResponse(res, result, status, err);
    });
})
// maps
.get('/api/map', (req, res) => {
    console.log('/api/map : '+JSON.stringify(req.query));
    map.getMap(req, (result, status, err) => {
        handleAPIResponse(res, result, status, err);
    });
})
.post('/api/map/add', 
      mustBeAdmin(), 
      (req, res) => {
    console.log('/api/map/add');
    map.addMap(req, (result, status, err) => {
        handleAPIResponse(res, result, status, err);
    });
})

.get('*', (req, res) => {
    res.status(404);
})

// Error handler //////////
.use((err, req, res, next) => {
    console.log('Express error handler):' + err);
    res.json(err);
});

// application launch
server.listen(port, (err) => {
    if(err) {
        return console.log('Node launch error', err);
    }
    console.log(`API listening to *:${port})`);
});

function handleAPIResponse(res, result, status, err) {
    if(status) {
        res.status(status);
    }
    if(err) {
        console.log(err);
        res.json(err);
    } else {
        res.json(result);
    }
}

// middleware
function mustBeAdmin() {
    return function (req, res, next) {
        if(!req.body) {
            res.status(400);
            res.json('invalid parameters');
            return;
        }
        
        if(req.body.password == process.env.API_PASSWORD) {
            // auth
            delete req.body.password;
            return next();
        }
        res.status(403);
        res.json('invalid credentials');
        // not auth
    }
}
