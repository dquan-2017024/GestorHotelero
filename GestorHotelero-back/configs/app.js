'use strict'

const userRoutes = require('../src/routes/user.routes');
const hotelRoutes = require('../src/routes/hotel.routes');
const roomRoutes = require('../src/routes/room.routes');
const reservationRoutes = require('../src/routes/reservation.routes');
const eventRoutes = require('../src/routes/event.routes');

const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = 5000 || process.env;

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(helmet());
app.use(cors());
app.use('/user', userRoutes);
app.use('/hotel', hotelRoutes);
app.use('/room', roomRoutes);
app.use('/reservation', reservationRoutes);
app.use('/event', eventRoutes);

exports.initServer = ()=> app.listen(port, ()=>{
    console.log(`Listening on port ${port}`);
});