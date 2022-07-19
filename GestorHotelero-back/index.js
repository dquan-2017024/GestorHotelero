'use strict'

const mongoConfigs = require('./configs/mongoConfigs');
const app = require('./configs/app');
const userController = require('./src/controllers/user.controller');

mongoConfigs.init();
app.initServer();
userController.createAdmin();