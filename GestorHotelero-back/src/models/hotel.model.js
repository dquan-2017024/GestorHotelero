'use strict'

const mongoose = require('mongoose');

const hotelSchema = mongoose.Schema({
    name: String,
    address: String,
    description: String,
    administrator: {type: mongoose.Schema.ObjectId, ref:'User'}
});

module.exports = mongoose.model('Hotel', hotelSchema);