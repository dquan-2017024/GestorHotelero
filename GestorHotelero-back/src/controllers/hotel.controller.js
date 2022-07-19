'use strict'

const Hotel = require('../models/hotel.model');
const Reservation = require('../models/reservation.model');
const Room = require('../models/room.model');
const User = require('../models/user.model');
const Event = require('../models/reservation.model');
const { validateData, deleteSensitiveDataAdmin, checkParams, checkUpdate } = require('../utils/validate');

//FUNCIONES PARA ADMINISTRADOR DE LA APLICACIÓN

exports.createHotel = async (req,res)=>{
    try{
        let params = req.body;
        let data={
            name: params.name,
            address: params.address,
            description: params.description,
            administrator: params.administrator
        }

        let msg =  validateData(data);
        if(msg) return res.status(400).send(msg);
        let userExist = await User.findOne({_id: data.administrator});
        if(userExist.role != 'ADMINHOTEL') return res.status(400).send({message: 'The user is not a hotel administrator'})
        let nameExist = await Hotel.findOne({name: data.name});
        if(nameExist) return res.status(400).send({message: `Hotel ${data.name} already exist`});
        let addressExist = await Hotel.findOne({address: data.address});
        if(addressExist) return res.status(400).send({message: `Hotel whit address: ${data.address} already exist`});
        let adminExist = await Hotel.findOne({administrator: data.administrator}).lean().populate('administrator');
        if(adminExist) return res.status(400).send({message: `Hotel whit administrator: ${adminExist.administrator.name} already exist`});

        let hotel = new Hotel(data);
        await hotel.save();
        return res.send({message: 'Hotel created successfully'});
    }catch(err){
        console.log(err);
        return res.status(500).send({err, message: 'Error creating hotel'}) ;
    }
};

exports.mostPopular = async(req,res)=>{
    try{
        let hotels = await Hotel.find()
        .lean()
        .populate('administrator');
        let sorts = [];
        for(let hotel of hotels){
            let reservations = await Reservation.find({status:'FINISHED', hotel: hotel._id});
            sorts.push({hotel, reservations:reservations.length});
        }

        sorts.sort((a,b)=>{
            return b.reservations - a.reservations
        });
        for(let sort of sorts){
            delete sort.reservations
        }

        return res.send({hotels:sorts});
    }catch(err){
        console.log(err);
        return res.status(500).send({err, message: 'Error getting hotels'});
    }
};

exports.updateHotel = async(req,res)=>{
    try{
        let hotelId = req.params.idH;
        let params = req.body;
    
        let hotelExist = await Hotel.findOne({_id: hotelId});
        if(!hotelExist) return res.status(400).send({message: 'Hotel not found'});
        let emptyParams = await checkParams(params);
        if(emptyParams === false) return res.status(400).send({message: 'Empty params'});
        let validateUpdate = await checkUpdate(params);
        if(validateUpdate === false) return res.status(400).send({message: 'Cannot update this information'});
        let nameExist = await Hotel.findOne({name: params.name});
        if(nameExist && params.name != hotelExist.name) return res.status(400).send({message: `Hotel ${data.name} already exist`});
        let addressExist = await Hotel.findOne({address: params.address});
        if(addressExist && params.address != hotelExist.address) return res.status(400).send({message: `Hotel whit address: ${data.address} already exist`});

        let hotelUpdated = await Hotel.findOneAndUpdate({_id: hotelId},params,{new:true});

        return res.send({hotel: hotelUpdated, message: 'Hotel updated'});
    }catch(err){
        console.log(err);
        return res.status(500).send({err, message: 'Error updating hotel'}) ;
    }
};

exports.deleteHotel = async(req,res)=>{
    try{
        let hotelId = req.params.idH;

        let hotelExist = await Hotel.findOne({_id: hotelId});
        if(!hotelExist) return res.status(400).send({message: 'Hotel not found'});

        await Room.deleteMany({hotel: hotelId});
        await Reservation.deleteMany({hotel: hotelId});
        await Hotel.findOneAndDelete({_id: hotelId});
        await Event.deleteMany({hotel: hotelId});

        return res.send({hotel: hotelExist.name, message: 'Hotel deleted successfully'});
    }catch(err){
        console.log(err);
        return res.status(500).send({err, message: 'Error deleting hotel'}) ;
    }
}

//FUNCIONES PARA CLIENTE

exports.getHotel = async(req,res)=>{
    try{
        let hotelId = req.params.idH;

        let hotel = await Hotel.findOne({_id: hotelId})
        .lean()
        .populate('administrator');
        if(!hotel) return res.status(400).send({message: 'Hotel not found'});
        deleteSensitiveDataAdmin(hotel);
        
        return res.send({hotel});
    }catch(err){
        console.log(err);
        return res.status(500).send({err, message: 'Error getting hotels'}) ;
    }
}


//FUNCIONES PÚBLICAS

exports.getHotels = async(req,res)=>{
    try{
        let hotels = await Hotel.find()
        .lean()
        .populate('administrator');

        for(let hotel of hotels){
            await deleteSensitiveDataAdmin(hotel);
        };

        return res.send({hotels});
    }catch(err){
        console.log(err);
        return res.status(500).send({err, message: 'Error getting hotels'}) ;
    }
}

exports.searchHotelByName = async(req,res)=>{
    try{
        let params = req.body;
        let data = {name: params.name};
        
        let msg = validateData(data);
        if(msg) return res.status(400).send(msg);
        let hotels = await Hotel.find({name: {$regex: data.name, $options: 'i'}})
        .lean()
        .populate('administrator');

        for(let hotel of hotels){
            await deleteSensitiveDataAdmin(hotel);
        };

        return res.send({hotels});
    }catch(err){
        console.log(err);
        return res.status(500).send({err, message: 'Error searching hotels'});
    }
};

exports.searchHotelByAddress = async(req,res)=>{
    try{
        let params = req.body;
        let data = {address: params.address};
        
        let msg = validateData(data);
        if(msg) return res.status(400).send(msg);
        let hotels = await Hotel.find({address: {$regex: data.address, $options: 'i'}})
        .lean()
        .populate('administrator');

        for(let hotel of hotels){
            await deleteSensitiveDataAdmin(hotel);
        };

        return res.send({hotels});
    }catch(err){
        console.log(err);
        return res.status(500).send({err, message: 'Error searching hotels'});
    }
};