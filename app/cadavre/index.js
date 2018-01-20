'use strict';

let cadavre = require('./cadavre');
let schema = require('./schema').Schema;

module.exports = {
    getCadavres: cadavre.getCadavres,
    addCadavre: cadavre.addCadavre,
};