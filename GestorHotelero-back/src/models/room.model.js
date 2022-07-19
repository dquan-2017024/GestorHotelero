'use strict'

const mongoose = require('mongoose');

const roomSchema = mongoose.Schema({
    noRoom: String,
    description: String,
    services:[
        {
            service: String
        }
    ],
    type: String,
    available: Boolean,
    price: Number,
    hotel: {type: mongoose.Schema.ObjectId, ref:'Hotel'}
});

module.exports = mongoose.model('Room', roomSchema);