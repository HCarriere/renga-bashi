'use strict';

const express = require('express');
const http = require("http");
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);

const cadavre = require('./app/cadavre/cadavre');
const map = require('./app/map/map');

const port = process.env.PORT || '3001';
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

server.timeout = 0;

app.use(express.static(__dirname + '/front/dist'));

app
.use(bodyParser.json({limit: '100mb', extended: true})) // to support JSON-encoded bodies
.use(bodyParser.urlencoded({limit: '100mb', extended: true})) // to support URL-encoded bodies

cadavre.createWebSocketServer(server);

app
/**
 * cadavres
 */
// get all cadavres from a map
.get('/api/cadavres', (req, res) => {
    cadavre.getCadavres(req.query.title, (result, status, err) => {
        res.set('Cache-Control', 'no-store');
        handleAPIResponse(res, result, status, err);
    });
})
.get('/api/cadavreshash', (req, res) => {
    cadavre.getCadavresHash(req.query.title, req.query.localhash, (result, status, err) => {
        res.set('Cache-Control', 'no-store');
        handleAPIResponse(res, result, status, err);
    });
})
// add a cadavre to map
.post('/api/cadavres/add', (req, res) => {
    cadavre.addCadavre(req, (result, status, err) => {
        handleAPIResponse(res, result, status, err);
    });
})
// add a cadavre to map (no CD)
.post('/api/cadavres/adminadd', mustBeAdmin, (req, res) => {
    cadavre.addCadavre(req, (result, status, err) => {
        handleAPIResponse(res, result, status, err);
    }, true);
})
// remove all from map
.post('/api/cadavres/remove', mustBeAdmin, (req, res) => {
    cadavre.removeCadavres(req.body.title, (result, status, err) => {
        handleAPIResponse(res, result, status, err);
    });
})
// remove some from map
.post('/api/cadavres/removesome', mustBeAdmin, (req, res) => {
    cadavre.removeSomeCadavres(req.body.title, req.body.ids, (result, status, err) => {
        handleAPIResponse(res, result, status, err);
    });
})

/**
 * maps
 */
.get('/api/map/:title', (req, res) => {
    map.getMap(req, (result, status, err) => {
        res.set('Cache-Control', 'no-store');
        handleAPIResponse(res, result, status, err);
    });
})
.get('/api/nextmap', (req, res) => {
    map.getNextMap(req, (result, status, err) => {
        res.set('Cache-Control', 'no-store');
        handleAPIResponse(res, result, status, err);
    });
})
.get('/api/maps', mustBeAdmin, (req, res) => {
    map.getAllMaps((result, status, err) => {
        res.set('Cache-Control', 'no-store');
        handleAPIResponse(res, result, status, err);
    });
})
.post('/api/map', mustBeAdmin, (req, res) => {
    map.addMap(req, (result, status, err) => {
        handleAPIResponse(res, result, status, err);
    });
})
.delete('/api/map/:title', mustBeAdmin, (req, res) => {
    map.deleteMap(req, (result, status, err) => {
        // delete cadavres from this map
        cadavre.removeCadavres(req.params.title, () => {});
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
    console.log(`API listening to port ${port}`);
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

