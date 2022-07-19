'use strict'

const mongoose = require('mongoose');

const invoiceSchema = mongoose.Schema({
    date: Date,
    user: {type: mongoose.Schema.ObjectId, ref:'User'},
    hotel: {type: mongoose.Schema.ObjectId, ref:'Hotel'},
    room: {type: mongoose.Schema.ObjectId, ref:'Room'},
    price: String,
    subTotal: Number,
    events:[
        {
            event: {type: mongoose.Schema.ObjectId, ref:'Event'},
        }
    ],
    subTotalEvents: Number,
    total: Number
});

module.exports = mongoose.model('Invoice', invoiceSchema);