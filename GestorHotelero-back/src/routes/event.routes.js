'use strict'

const express = require('express');
const api = express.Router();
const mdAuth = require('../services/authenticated');
const eventController = require('../controllers/event.controller');

//FUNCIONES PARA ADMINHOTEL

api.post('/createEvent', [mdAuth.ensureAuth, mdAuth.isAdminH], eventController.createEvent);
api.delete('/deleteEvent/:idE', [mdAuth.ensureAuth, mdAuth.isAdminH], eventController.deleteEvent);
api.put('/updateEvent/:idE', [mdAuth.ensureAuth, mdAuth.isAdminH], eventController.updateEvent);
api.get('/getEvent/:idE', [mdAuth.ensureAuth, mdAuth.isAdminH], eventController.getEvent);

//FUNCIONES PARA CLIENTE

api.get('/getEvents/:idH', mdAuth.ensureAuth, eventController.getEvents);
api.get('/getEventsApproved',mdAuth.ensureAuth, eventController.getEventsApproved);
api.get('/getEventsFinished', mdAuth.ensureAuth, eventController.getEventsFinished);

module.exports = api;