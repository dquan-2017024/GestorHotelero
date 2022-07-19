'use strict'

const moment = require('moment');
const Event = require('../models/event.model');
const User = require('../models/user.model');
const Hotel = require('../models/hotel.model');
const { validateData, deleteSensitiveData, checkPermission, checkParams, checkUpdate } = require('../utils/validate');

//FUNCIONES PARA ADMINHOTEL

exports.createEvent = async (req,res)=>{
    try{
        let params = req.body;
        let data ={
            user: params.user,
            name: params.name,
            type: params.type,
            startDate: params.startDate,
            finishDate: params.finishDate,
            status: 'APPROVED',
            services: params.services,
            prices: params.prices,
            cost: params.cost
        }

        let msg = validateData(data);
        if(msg) return res.status(400).send(msg);
        let userExist = await User.findOne({_id: data.user});
        if(!userExist) return res.status(400).send({message: 'User not found'});
        let hotel = await Hotel.findOne({administrator: req.user.sub});
        if(!hotel) return res.status(400).send({message: 'Has not been assigned a hotel'});
        data.hotel = hotel._id;

        let nameExist = await Event.findOne({name: data.name});
        if(nameExist) return res.status(400).send({message: `Event ${data.name} already exist`});
        data.startDate = new Date('2022/'+ params.startDate);
        data.finishDate = new Date('2022/'+ params.finishDate);
        let dateStart = moment(data.startDate).unix();
        let dateFinish = moment(data.finishDate).unix();
        if(dateStart >= dateFinish || dateStart < moment().unix()) return res.status(400).send({message: 'Equal dates or invalid start date'});

        let events = await Event.find({hotel: data.hotel});
        for(let event of events){
            let finishReservation = moment(event.finishDate).unix();
            let startReservation = moment(event.startDate).unix();
            if(
                startReservation == dateStart ||
                finishReservation == dateFinish
            ){
                return res.status(400).send({message: 'These event dates are already reserved'});
            }else if(startReservation > dateStart && startReservation < dateFinish){
                return res.status(400).send({message: 'These event dates are already reserved'});
            }else if(startReservation < dateStart && finishReservation > dateStart){
                return res.status(400).send({message: 'These event dates are already reserved'});
            }else if(finishReservation > dateFinish && startReservation < dateFinish){
                return res.status(400).send({message: 'These event dates are already reserved'});
            }else if(finishReservation < dateFinish && finishReservation > dateStart){
                return res.status(400).send({message: 'These event dates are already reserved'});
            }
        }
        data.services = data.services.replace(/\s+/g, '');
        data.prices = data.prices.replace(/\s+/g, '');
        data.extras=[];
        if(data.services.includes(',')){
            data.services = data.services.split(',');
            data.prices = data.prices.split(',');
            for (let i=0; i<data.services.length;i++){
                let service = {
                    service: data.services[i],
                    price:data.prices[i]
                };
                
                if(cost){
                    var cost = cost+Number(data.prices[i]);
                }else{
                    var cost = Number(data.prices[i]);
                }
                data.extras.push(service);
            }
        }else{
            data.extras=[{service: data.services, price: data.prices}];
        }

        if(data.cost < cost)return res.status(400).send({message: 'The cost cannot be less than the total of services'});
        delete data.services;
        delete data.prices;

        let event = new Event(data);
        await event.save();
        return res.send({message: 'Event created successfully'});
    }catch(err){
        console.log(err);
        return res.status(500).send({message: 'Error creating event'})
    }
};

exports.deleteEvent = async(req,res)=>{
    try{
        let eventId = req.params.idE;

        let eventExist = Event.findOne({_id: eventId});
        if(!eventExist) return res.status(400).send({message: 'Event not found'});
        let hotel = Hotel.findOne({administrator: req.user.sub});
        if(hotel._id != eventExist.hotel) return res.status(403).send({message: 'Not are the administrator of this hotel'});
        await Event.findOneAndDelete({_id: eventId});

        return res.send({event: eventExist.name, message: 'Event Deleted'});
    }catch(err){
        console.log(err);
        return res.status(500).send({message: 'Error deleting event'})
    }
};

exports.updateEvent = async(req,res)=>{
    try{
        let eventId = req.params.idE;
        let params = req.body;

        let eventExist = Event.findOne({_id: eventId});
        if(!eventExist) return res.status(400).send({message: 'Event not found'});
        let hotel = Hotel.findOne({administrator: req.user.sub});
        if(hotel._id != eventExist.hotel) return res.status(403).send({message: 'Not are the administrator of this hotel'});
        let emptyParams = await checkParams(params);
        if(emptyParams === false) return res.status(400).send({message: 'Empty params'});
        let validateUpdate = await checkUpdate(params);
        if(validateUpdate === false) return res.status(400).send({message: 'Cannot update this information'});
        
        if(moment(eventExist.finishDate).unix() <= moment().unix()){
            await Event.findOneAndUpdate({_id: eventId},{status: 'FINISHED'});
        }else if(moment(eventExist.startDate).unix() <= moment().unix() && 
            moment().unix() < moment(eventExist.finishDate).unix()){
                await Event.findOneAndUpdate({_id: eventId},{status: 'ACTIVE'});
        }

        if(params.services && params.prices){
            params.services = params.services.replace(/\s+/g, '');
            params.prices = params.prices.replace(/\s+/g, '');
            params.extras=[];
            if(params.services.includes(',')){
                params.services = params.services.split(',');
                params.prices = params.prices.split(',');
                for (let i=0; i<params.services.length;i++){
                    let service = {
                        service: params.services[i],
                        price:params.prices[i]
                    };
                    
                    if(cost){
                        var cost = cost+Number(params.prices[i]);
                    }else{
                        var cost = Number(params.prices[i]);
                    }
                    params.extras.push(service);
                }
            }else{
                params.extras=[{service: params.services, price: params.prices}];
            }
        }

        if(params.cost != eventExist.cost && params.cost < cost)return res.status(400).send({message: 'The cost cannot be less than the total of services'});
        delete params.services;
        delete params.prices;

        let eventUpdated = await Event.findOneAndUpdate({_id: eventId},params,{new: true})
        .lean()
        .populate('user')
        .populate('hotel');

        await deleteSensitiveData(eventUpdated);

        return res.send({event: eventUpdated, message: 'Event updated'})

    }catch(err){
        console.log(err);
        return res.status(500).send({message: 'Error updating event'});
    }
};

exports.getEvent = async(req,res)=>{
    try{
        let eventId = req.params.idE;
        let event = await Event.findOne({_id: eventId})
        .lean()
        .populate('user')
        .populate('hotel');
        if(!event) return res.status(400).send({message: 'Event not found'});
        
        if(moment(event.finishDate).unix() <= moment().unix()){
            await Event.findOneAndUpdate({_id: event._id},{status: 'FINISHED'});
        }else if(moment(event.startDate).unix() <= moment().unix() && 
            moment().unix() < moment(event.finishDate).unix()){
                await Event.findOneAndUpdate({_id: event._id},{status: 'ACTIVE'});
        }
        await deleteSensitiveData(event);

        return res.send({event});

    }catch(err){
        console.log(err);
        return res.status(500).send({message: 'Error getting events'})
    }
};

//FUNCIONES PARA CLIENTE

exports.getEvents = async(req,res)=>{
    try{
        let hotelId = req.params.idH;
        let hotelExist = await Hotel.findOne({_id: hotelId});
        if(!hotelExist) return res.status(400).send({message: 'Hotel not found'});
        let events = await Event.find({hotel: hotelId})
        .lean()
        .populate('user')
        .populate('hotel');

        for(let event of events){
            if(moment(event.finishDate).unix() <= moment().unix()){
                await Event.findOneAndUpdate({_id: event._id},{status: 'FINISHED'});
            }else if(moment(event.startDate).unix() <= moment().unix() && 
                moment().unix() < moment(event.finishDate).unix()){
                    await Event.findOneAndUpdate({_id: event._id},{status: 'ACTIVE'});
            }
            await deleteSensitiveData(event);
        }

        return res.send({events});

    }catch(err){
        console.log(err);
        return res.status(500).send({message: 'Error getting events'})
    }
};

exports.getEventsApproved = async(req,res)=>{
    try{
        let verification = await Event.find({user: req.user.sub});
        for(let event of verification){
            if(moment(event.finishDate).unix <= moment().unix()){
                await Event.findOneAndUpdate({_id: event._id},{status: 'FINISHED'});
            }else if(moment(event.startDate).unix() <= moment().unix() && 
            moment().unix() < moment(event.finishDate).unix()){
                await Event.findOneAndUpdate({_id: event._id},{status: 'ACTIVE'});
            }
        };
        let events = await Event.find({user: req.user.sub, status: 'APPROVED'})
        .lean()
        .populate('user')
        .populate('hotel');

        for(let event of events){
            await deleteSensitiveData(event);
        }

        return res.send({events});

    }catch(err){
        console.log(err);
        return res.status(500).send({message: 'Error getting events'})
    }
};

exports.getEventsFinished = async(req,res)=>{
    try{
        let verification = await Event.find({user: req.user.sub});
        for(let event of verification){
            if(moment(event.finishDate).unix() <= moment().unix()){
                await Event.findOneAndUpdate({_id: event._id},{status: 'FINISHED'});
            }else if(moment(event.startDate).unix() <= moment().unix() && 
            moment().unix() < moment(event.finishDate).unix()){
                await Event.findOneAndUpdate({_id: event._id},{status: 'ACTIVE'});
            }
        };
        let events = await Event.find({$or:[
            {user: req.user.sub, status: 'FINISHED'},
            {user: req.user.sub, status: 'CANCELED'}
        ]})
        .lean()
        .populate('user')
        .populate('hotel');

        for(let event of events){
            await deleteSensitiveData(event);
        }

        return res.send({events});

    }catch(err){
        console.log(err);
        return res.status(500).send({message: 'Error getting events'})
    }
};