'use strict'

const mongoose = require('mongoose');

const eventSchema = mongoose.Schema({
    user: {type: mongoose.Schema.ObjectId, ref:'User'},
    name: String,
    type: String,
    startDate: Date,
    finishDate: Date,
    status: String,
    extras: [
        {
            service: String,
            price: Number
        }
    ],
    cost: Number,
    hotel: {type: mongoose.Schema.ObjectId, ref:'Hotel'}
});

module.exports = mongoose.model('Event', eventSchema);