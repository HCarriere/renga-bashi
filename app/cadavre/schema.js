'use strict';

let mongoose = require('mongoose');
const conf = require('../../config')

// rooms

module.exports.Schema = {
    schema:mongoose.Schema({
        x: Number,
        y: Number,
        date: Date,
        path: String,
        level: String,
        rot: Number,
        color: String,
    }),
    collection : conf.database.collections.cadavre,
};
