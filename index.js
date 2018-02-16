'use strict';

const express = require('express');
const http = require('http');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const UglifyJS = require('uglify-es');

const config = require('./config');
const app = express();
const port = process.env.PORT || config.server.port;
const server = http.createServer(app);

const mongo = require('./app/mongo');
const cadavre = require('./app/cadavre');
const map = require('./app/map');

const CORS = process.env.CORS || '*';
const env = process.env.ENV || 'dev';

let mainClientJS;
minifyClientJS(mainJS => {
    mainClientJS = mainJS;
});

let newPlayerMessage;

mongo.initMongo();

server.timeout = 0;
app
.use(bodyParser.json())
.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(__dirname + '/client/assets'));

if(env != 'PRODUCTION') {
    app.use(express.static(__dirname + '/client/source.dev'));
}

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', CORS);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    next();
});

app
.get('/', (req, res) => {
    if(env != 'PRODUCTION') {
        res.sendFile(__dirname + '/client/template/cadavre.dev.html');
    } else {
        res.sendFile(__dirname + '/client/template/cadavre.html');
    }
})
// cadavres
.get('/api/cadavres', (req, res) => {
    console.log('/api/cadavres : '+JSON.stringify(req.query));
    cadavre.getCadavres(req, (data) => {
        res.json({
            message:newPlayerMessage,
            cadavres:data,
        });
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
.post('/api/message', 
      mustBeAdmin(),
      (req, res) => {
    console.log('/api/message:'+JSON.stringify(req.body));
    if(req.body && req.body.message){
        newPlayerMessage = req.body.message;
        res.json({
            message: req.body.message
        });
    } else {
        res.json({
            error:'need a messsage'
        });
    }
})
// get PRODUCTION (minified, bundled) source
.get('/source/main', (req, res) => {
    res.type('js');
    res.send(mainClientJS);
})

.get('/wus', (req, res) => {
    res.json();
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

// keep awake (KEEP_AWAKE)
keepAwake();

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
        // TODO require password
        
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

// bring every file onto one
// minify
// jquery document.ready + launch()
function minifyClientJS(callback) {
    let resultFile = '';
    let redFiles = [];
    fs.readdir('./client/source.dev', (err, jsFiles) => {
        if(err || !jsFiles || jsFiles.length == 0) {
            console.log('readdir error :'+err);
            return callback();
        }
        function readJSFile(files, callback, result) {
            if(files.length == 0) {
                return callback(result);
            }
            if(!result) {
                result = '';
            }
            let currentFile = files.pop();
            fs.readFile('./client/source.dev/'+currentFile, 'utf8', (err, data) => {
                result = result.concat(data);
                readJSFile(files, callback, result);
            });
        }
        readJSFile(jsFiles, concatFiles => {
            let uglyCode = UglifyJS.minify(concatFiles);
            if(uglyCode.error) {
                console.log('uglify error:'+uglyCode.error);
            }
            return callback(`$(document).ready(()=>{${uglyCode.code} launch(); });`); 
        });
    });
}

// sorry rku.
function keepAwake() {
    if(process.env.KEEP_AWAKE) {
        const http = require('http');
        setInterval(() => {
            setTimeout(()=>{
                console.log('sending W.U.S to /wus');
                http.get('http://cadavres-api.herokuapp.com/wus');
            }, Math.floor(Math.random()*60000));
        }, 326472);
    }
}