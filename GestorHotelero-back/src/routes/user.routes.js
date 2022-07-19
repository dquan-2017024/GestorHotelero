'use strict'

const express = require('express');
const api = express.Router();
const userController = require('../controllers/user.controller');
const mdAuth = require('../services/authenticated');

//RUTAS PÚBLICAS
api.post('/register', userController.register);
api.post('/login', userController.login);

//RUTAS PARA CLIENTE
api.get('/getUser/:idU', mdAuth.ensureAuth, userController.getUser);
api.put('/update/:idU', mdAuth.ensureAuth, userController.update);
api.delete('/delete/:idU', mdAuth.ensureAuth, userController.delete);
api.get('/toInvoice/:idR', mdAuth.ensureAuth, userController.toInvoice);

//RUTAS PARA ADMINISTRADOR DE LA APLICACIÓN

api.get('/getUsers', [mdAuth.ensureAuth, mdAuth.isAdmin], userController.getUsers);

//FUNCIONES PARA ADMINISTRADOR DEL HOTEL

api.post('/searchGuest', [mdAuth.ensureAuth, mdAuth.isAdminH], userController.searchGuest);
api.get('/getGuests', [mdAuth.ensureAuth, mdAuth.isAdminH], userController.getGuests);

module.exports = api;
