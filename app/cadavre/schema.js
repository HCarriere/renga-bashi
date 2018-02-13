'use strict';

let mongoose = require('mongoose');
const conf = require('../../config')

// rooms

module.exports.Schema = {
    schema:mongoose.Schema({
        x: Number,
        y: Number,
        date: Date,
        path: mongoose.Schema.Types.Mixed,
        level: String,
        rot: Number,
        color: String,
    }),
    collection : conf.database.collections.cadavre,
};
