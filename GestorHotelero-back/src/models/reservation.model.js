'use strict'

const mongoose = require('mongoose');

const reservationSchema = mongoose.Schema({
    user: {type: mongoose.Schema.ObjectId, ref:'User'},
    startDate: Date,
    finishDate: Date,
    status: String,
    hotel: {type: mongoose.Schema.ObjectId, ref:'Hotel'},
    room: {type: mongoose.Schema.ObjectId, ref:'Room'}
});

module.exports = mongoose.model('Reservation', reservationSchema);