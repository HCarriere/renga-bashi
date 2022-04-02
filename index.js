'use strict';

const express = require('express');
const http = require('http');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const UglifyJS = require('uglify-es');
const exphbs = require('express-handlebars');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

const config = require('./config');
const app = express();
const server = http.createServer(app);

const cadavre = require('./app/cadavre/cadavre');
const map = require('./app/map/map');

const port = process.env.PORT || config.server.port;
const CORS = process.env.CORS || '*';
const env = process.env.ENV || 'dev';
const DB_URI = process.env.DB_URI || 'mongodb://localhost/rengabashi'
const KEEP_AWAKE_URL = process.env.KEEP_AWAKE_URL;
const COOKIE_SECURE_KEY = process.env.COOKIE_SECURE_KEY || 'COOKIE_SECURE_KEY';
const API_PASSWORD = process.env.API_PASSWORD || '25xrwVZOHOY6l0CwJdE93svifcFQwFmDASQGQZpqT8Q=';
const COOKIE_SECRET = process.env.COOKIE_SECRET || 'cookieSecret!'

let handlebars = exphbs.create({
    defaultLayout: 'main',
    extname: '.hbs',
    layoutsDir: path.join(__dirname,'client/layouts'),
});

//handlebars configuration
app
.engine('.hbs', handlebars.engine)
.set('view engine', '.hbs')
.set('views', path.join(__dirname, 'client/template'));

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
app
.use(bodyParser.json())
.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(__dirname + '/client/assets'));
app.use('/', express.static(__dirname + '/front/dist'));

if(env != 'PRODUCTION') {
    app.use(express.static(__dirname + '/client/source.dev'));
}

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', CORS);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    next();
});

app.use(cookieParser(COOKIE_SECRET));

app
/*.get('/', (req, res) => {
    if(process.env.REDIRECT) {
        res.redirect(process.env.REDIRECT);
    }
    let parameters = {};
    if(env != 'PRODUCTION') {
        parameters = {
            scripts: [
                '/network.js',
                '/graphic.js',
                '/physic.js',
                '/controls.js',
                '/cadavre.js',
            ],
            titlePrefix:'DEV -',
            dev: true,
        };
    } else {
        parameters = {
            scripts: [
                '/source/main',
            ],
            titlePrefix:'Bêta -'
        };
    }
    res.render('game',parameters);
})*/
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
.get('/api/maps', (req, res) => {
    map.getAllMaps((result, status, err) => {
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

.get('/editor', mustBeAdmin(), (req, res) => {
    res.render('editor');
})

.get('/login', (req, res) => {
    res.render('login');
})
.post('/auth', (req, res) => {
    if (!req.body.password) return res.status(403);

    const hash = crypto.createHash('sha256').update(req.body.password).digest('base64');
    console.log(hash)
    if (hash == API_PASSWORD) {
        // set auth cookie
        console.log('access granted');
        res.cookie('token', COOKIE_SECURE_KEY,{signed: true, httpOnly: true, maxAge: 155520000000});
        return res.redirect('/editor');
    }
    return res.redirect('/login');
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
        // check body
        if (req.body && req.body.password) {
            const hash = crypto.createHash('sha256').update(req.body.password).digest('base64');
            if (hash == API_PASSWORD) {
                delete req.body.password;
                return next();
            }
        }

        // check cookie
        if (req.signedCookies && req.signedCookies['token']) {
            //const hash = crypto.createHash('sha256').update(req.signedCookies['token']).digest('base64');
            if (req.signedCookies['token'] == COOKIE_SECURE_KEY) {
                return next();
            }
        }

        res.status(403);
        res.redirect('/login')
        return;
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


// sorry rku.
function keepAwake() {
    if(KEEP_AWAKE_URL) {
        const http = require('http');
        setInterval(() => {
            setTimeout(()=>{
                console.log('sending W.U.S to /wus');
                http.get(KEEP_AWAKE_URL);
            }, Math.floor(Math.random()*60000));
        }, 326472);
    }
}