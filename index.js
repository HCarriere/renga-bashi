'use strict';

const express = require('express');
const http = require('http');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const UglifyJS = require('uglify-es');
const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const config = require('./config');
const app = express();
const server = http.createServer(app);

const cadavre = require('./app/cadavre/cadavre');
const map = require('./app/map/map');

const port = process.env.PORT || config.server.port;
const DB_URI = process.env.DB_URI || 'mongodb://localhost/rengabashi'
const API_PASSWORD = process.env.API_PASSWORD || '25xrwVZOHOY6l0CwJdE93svifcFQwFmDASQGQZpqT8Q=';
const JWT_SECRET = process.env.JWT_SECRET || 'jwtSecret!'


mongoose.connect(DB_URI, { useMongoClient: true });
mongoose.connection.on('error', (err) => {
    console.log('mongoose default connection error: '+err);
});
mongoose.connection.on('connected', () => {
    console.log('mongoose connected');
});
mongoose.connection.on('disconnected', () => {
    console.log('mongoose disconnected');
});
process.on('SIGINT', function() {  
    mongoose.connection.close(function () { 
        console.log('Mongoose default connection disconnected through app termination'); 
        process.exit(0); 
    }); 
}); 

let mainClientJS = '';
minifyClientJS(mainJS => {
    mainClientJS = mainJS;
});

let newPlayerMessage;

server.timeout = 0;

app.use(express.static(__dirname + '/front/dist'));

app
.use(bodyParser.json({limit: '100mb', extended: true})) // to support JSON-encoded bodies
.use(bodyParser.urlencoded({limit: '100mb', extended: true})) // to support URL-encoded bodies

app
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
     mustBeAdmin,
     (req, res) => {
    console.log('/api/cadavres/remove');
    cadavre.removeCadavres(req, (result, status, err) => {
        handleAPIResponse(res, result, status, err);
    });
})
// maps
.get('/api/map/:title', (req, res) => {
    console.log('getting map '+ req.query.title)
    map.getMap(req, (result, status, err) => {
        handleAPIResponse(res, result, status, err);
    });
})
.get('/api/maps', mustBeAdmin, (req, res) => {
    console.log('get all maps');
    map.getAllMaps((result, status, err) => {
        res.set('Cache-Control', 'no-store');
        handleAPIResponse(res, result, status, err);
    });
})
.post('/api/map', mustBeAdmin, (req, res) => {
    console.log('save map');
    map.addMap(req, (result, status, err) => {
        handleAPIResponse(res, result, status, err);
    });
})
.delete('/api/map:title', mustBeAdmin, (req, res) => {
    console.log('delete map');
    map.deleteMap(req, (result, status, err) => {
        handleAPIResponse(res, result, status, err);
    });
})
.get('/api/map/titleexists/:title', mustBeAdmin, (req, res) => {
    map.getMap(req, (result, status, err) => {
        if (result) {
            handleAPIResponse(res, true, 200);
        } else {
            handleAPIResponse(res, false, 200);
        }
    });
})

// auth
.post('/api/auth', (req, res) => {
    const { password } = req.body;
    const hash = crypto.createHash('sha256').update(password).digest('base64');
    if (hash == API_PASSWORD) {
        const accessToken = jwt.sign({ login: 'admin' }, JWT_SECRET, {expiresIn: '10d'});
        res.json({
            accessToken,
        });
    } else {
        res.sendStatus(401);
    }
})

.get('*', (req, res) => {
    res.sendFile(__dirname + '/front/dist/index.html');
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


// middlewares

function mustBeAdmin(req, res, next) {
    const authHeader = req.headers.authorization;
    let token;
    if(authHeader) {
        token = authHeader.split(' ')[1];
    } else {
        // fallback to url
        token = req.query.authorization;
    }

    if (token) {
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }

            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
}

// bring every file onto one
// minify
// jquery document.ready + launch()
function minifyClientJS(callback) {
    let resultFile = '';
    let redFiles = [];
    console.log('minifying client code...');
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
            let topCode = `$(document).ready(()=>{${concatFiles} launch(); });`; 
            let uglyCode = UglifyJS.minify(topCode, {
                mangle: {
                    toplevel: true,
                },
                nameCache: {}
            });
            if(uglyCode.error) {
                console.log('uglify error:'+uglyCode.error);
            }
            return callback(uglyCode.code);
        });
    });
}
