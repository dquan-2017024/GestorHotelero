'use strict'

const jwt = require('../services/jwt');
const moment = require('moment');
const User = require('../models/user.model');
const Hotel = require('../models/hotel.model');
const Reservation = require('../models/reservation.model');
const Invoice = require('../models/invoice.model');
const Event = require('../models/event.model');
const { validateData, encrypt, checkPassword, checkUpdate, checkPermission, checkParams, deleteSensitiveData } = require('../utils/validate');


exports.createAdmin = async(req,res)=>{
    try{
        let data ={
            name: 'Daniel Pérez',
            username: 'SuperAdmin',
            email: 'daniel@gmail.com',
            password: await encrypt('123456'),
            role: 'ADMIN'
        }

        let adminExist = await User.findOne({username: data.username});
        if(adminExist){}else{
            let user = new User(data);
            await user.save();
        }
    }catch(err){
        console.log(err);
        return res.status(500).send({err, message: 'Error creating admin'}) ;
    }
};

//FUNCIONES PÚBLICAS

exports.register = async(req,res)=>{
    try{
        let params = req.body;
        let data = {
            name: params.name,
            username: params.username,
            email: params.email,
            password: params.password,
            role: 'CLIENT'
        };

        let msg = validateData(data);
        if(msg) return res.status(400).send(msg);
        let userExist = await User.findOne({username: params.username});
        if(userExist) return res.status(400).send({message: `Username ${params.username} already exist`});
        data.surname = params.surname;
        data.password = await encrypt(params.password);

        let user = new User(data);
        await user.save();
        return res.send({message: 'User created successfully'});
    }catch(err){
        console.log(err);
        return res.status(500).send({err, message: 'Error saving user'}) ;
    }
}

exports.login = async(req,res)=>{
    try{
        let params = req.body;
        let data = {
            username: params.username,
            password: params.password
        };
        
        let msg = validateData(data);
        if(msg) return res.status(400).send(msg);
        let userExist = await User.findOne({username: params.username})
        .lean()
        .populate('hotel');

        if(userExist && await checkPassword(params.password, userExist.password)){
            let token = await jwt.createToken(userExist);
            delete userExist.password;

            let invoices = await Invoice.find({user: userExist._id});

            return res.send({token, user:userExist, invoices, message: 'Login successfully'});
        }else return res.status(401).send({message: 'Invalid credentials'});
    }catch(err){
        console.log(err);
        return res.status(500).send({err, message: 'Error logging in'});
    }
};

//FUNCIONES PARA CLIENTE

exports.getUser = async(req,res)=>{
    try{
        let userId = req.params.idU;
        let user = await User.findOne({_id: userId})
        .lean()
        .populate('hotel');

        return res.send(user);
    }catch(err){
        console.log(err);
        return res.status(500).send({message: 'Error getting users'});
    }
};

exports.update = async(req, res)=>{
    try{
        let userId = req.params.idU;
        let params = req.body;

        let userExist = await User.findOne({_id: userId});
        if(!userExist) return res.status(400).send({message: 'User not found'});
        let emptyParams = await checkParams(params);
        if(emptyParams === false) return res.status(400).send({message: 'Empty params'});
        let validateUpdate = await checkUpdate(params);
        if(validateUpdate === false) return res.status(400).send({message: 'Cannot update this information'});
        let permission = await checkPermission(userId, req.user.sub);
        if(permission === false) return res.status(401).send({message: 'You dont have permission to update this user'});
        let usernameExist = await User.findOne({username: params.username});
        if(usernameExist && userExist.username != params.username) return res.status(400).send({message: `Username ${params.username} already in use`});

        let userUpdated = await User.findOneAndUpdate({_id: userId}, params, {new: true})
        .lean()
        .populate('hotel');
        delete userUpdated.password;
        delete userUpdated.role;

        return res.send({user:userUpdated, message: 'User updated'});
    }catch(err){
        console.log(err);
        return res.status(500).send({err, message: 'Error updating user'});
    }
}

exports.delete = async(req, res)=>{
    try{
        let userId = req.params.idU;
        
        let userExist = await User.findOne({_id: userId});
        if(!userExist) return res.status(400).send({message: 'User not found'});
        if(userExist.role == 'ADMIN' || userExist.role == 'ADMINHOTEL') return res.status(400).send({message: 'Cannot delete admin account'});
        let permission = await checkPermission(userId, req.user.sub);
        if(permission === false) return res.status(401).send({message: 'You dont have permission to update this user'});

        let userDeleted = await User.findOneAndDelete({_id: userId}).lean();
        return res.send({username: userDeleted.username, message: 'Account deleted'});
    }catch(err){
        console.log(err);
        return res.status(500).send({message: 'Error removing account'});
    }
}

exports.toInvoice = async(req,res)=>{
    try{
        let reservationId = req.params.idR;
        let reservation = await Reservation.findOne({_id: reservationId}).populate('room');

        let permission = checkPermission(Reservation.user, req.user.sub);
        if(permission == false) return res.status(401).send({message: "You are not the owner of this invoice"});
        let events = await Event.find({user: req.user.sub, finishDate: {$gte : reservation.startDate, $lte : moment()}}).lean();
        let days = moment(reservation.finishDate).diff(moment(reservation.startDate), 'days');

        if(events.length != 0){
            let totalEvents = events.map(event=> event.cost).reduce((prev, curr)=> prev + curr,0);
            let eventTotal= [];
            for(let event of events){
                eventTotal.push({event: event._id});
            }

            let data = {
                date: moment(),
                user: req.user.sub,
                hotel: reservation.hotel,
                room: reservation.room._id,
                price: 'x' + days + ' ' + reservation.room.price,
                subTotal: days * reservation.room.price,
                events: eventTotal,
                subTotalEvents: totalEvents
            }
            data.total = data.subTotal + data.subTotalEvents;

            let invoice = new Invoice(data);
            await invoice.save();

            let invoiceCreated = await Invoice.findOne({_id: invoice._id}).lean()
            .populate('user')
            .populate('hotel')
            .populate('room');
            
            delete invoiceCreated.user.password;
            delete invoiceCreated.user.role;

            return res.send({ invoiceCreated });
        }else{
            let data = {
                date: moment(),
                user: req.user.sub,
                hotel: reservation.hotel,
                room: reservation.room,
                price: 'x' + days + ' ' + reservation.room.price,
                subTotal: days * reservation.room.price,
            }
            data.total = data.subTotal;
            
            let invoice = new Invoice(data);
            await invoice.save();

            let invoiceCreated = await Invoice.findOne({_id: invoice._id}).lean()
            .populate('user')
            .populate('hotel')
            .populate('room');
            
            delete invoiceCreated.user.password;
            delete invoiceCreated.user.role;

            return res.send({ invoiceCreated });
        }
    }catch(err){
        console.log(err);
        return res.status(500).send({err, message: 'Error logging in'});
    }
};

//FUNCIONES PARA ADMINISTRADOR DEL HOTEL

exports.searchGuest = async(req,res)=>{
    try{
        let params = req.body;
        let data = {name: params.name};
        let msg = validateData(data);
        if(msg) return res.status(400).send(msg);

        let hotel = await Hotel.findOne({administrator: req.user.sub});
        if(!hotel) return res.send({message: 'Has not been assigned a hotel'});
        let users = await User.find({hotel: hotel._id, name: {$regex: data.name, $options: 'i'}})
        .lean()
        .populate('user')
        .populate('hotel')
        .populate('room');

        return res.send({users});
    }catch(err){
        console.log(err);
        return res.status(500).send({message: 'Error searching guest'})
    }
};

exports.getGuests = async(req,res)=>{
    try{
        let hotel = await Hotel.findOne({administrator: req.user.sub});
        if(!hotel) return res.send({message: 'Has not been assigned a hotel'});
        let reservations = await Reservation.find({hotel: hotel._id, status: 'ACTIVE'})
        .lean()
        .populate('user')
        .populate('hotel')
        .populate('room');

        let users =[];
        for(let reservation of reservations){
            await deleteSensitiveData(reservation);
            users.push(reservation.user)
        }
        
        return res.send({users});
    }catch(err){
        console.log(err);
        return res.status(500).send({message: 'Error searching guest'})
    }
};

//FUNCIONES PARA ADMINISTRADOR DE LA APLICACIÓN

exports.getUsers = async(req,res)=>{
    try{

        let users = await User.find()
        .lean()
        .populate('hotel');

        return res.send(users);
    }catch(err){
        console.log(err);
        return res.status(500).send({message: 'Error getting users'});
    }
};