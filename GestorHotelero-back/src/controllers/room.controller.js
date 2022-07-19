'use strict'

const Room = require('../models/room.model');
const Hotel = require('../models/hotel.model');
const { validateData, checkParams, checkUpdate } = require('../utils/validate');

//FUNCIONES PARA ADMINISTRADOR DE LA APLICACIÓN

exports.addRoom = async(req,res)=>{
    try{
        let params = req.body;
        let data = {
            noRoom: params.noRoom,
            description: params.description,
            services: params.services,
            type: params.type,
            available: true,
            price: params.price,
            hotel: params.hotel
        }

        let msg = validateData(data);
        if(msg) return res.status(400).send(msg);
        let hotelExist = await Hotel.findOne({_id: data.hotel});
        if(!hotelExist) return res.status(400).send({message: 'Hotel not found'});
        let noRoomExist = await Room.findOne({noRoom: data.noRoom, hotel: data.hotel});
        if(noRoomExist) return res.status(400).send({message: `Room with number ${data.noRoom} already exist`});
        data.services = data.services.replace(/\s+/g, '');
        if(data.services.includes(',')){
            let services=[];
            data.services = data.services.split(',');
            for(let service of data.services){
                services.push({service:service});
            }
            data.services = services;
        }else{
            data.services = [{service:data.services}];
        }
        
        let room = new Room(data);
        await room.save();
        return res.send({message: 'Room created successfully'});
    }catch(err){
        console.log(err);
        return res.status(500).send({err, message: 'Error creating room'}) ;
    }
};

exports.updateRoom = async(req,res)=>{
    try{
        let roomId = req.params.idRo;
        let params = req.body;

        let roomExist = await Room.findOne({_id: roomId});
        if(!roomExist) return res.status(400).send({message: 'Room not found'});
        let emptyParams = await checkParams(params);
        if(emptyParams === false) return res.status(400).send({message: 'Empty params'});
        let validateUpdate = await checkUpdate(params);
        if(validateUpdate === false) return res.status(400).send({message: 'Cannot update this information'});
        
        if(params.services){
            params.services = params.services.replace(/\s+/g, '');
            if(params.services.includes(',')){
                let services=[];
                params.services = params.services.split(',');
                for(let service of params.services){
                    services.push({service:service});
                }
                params.services = services;
            }else{
                params.services = [{service:params.services}];
            }
        }

        console.log(params);
        let roomUpdated = await Room.findOneAndUpdate({_id: roomId},params,{new:true})
        .lean()
        .populate('hotel');

        return res.send({room: roomUpdated, message: 'Room updated'});
    }catch(err){
        console.log(err);
        return res.status(500).send({err, message: 'Error updating room'});
    }
}

exports.deleteRoom = async(req,res)=>{
    try{
        let roomId = req.params.idRo;

        let roomExist = await Room.findOne({_id: roomId});
        if(!roomExist) return res.status(400).send({message: 'Room not found'});
        await Room.findOneAndDelete({_id: roomId});

        return res.send({room: roomExist.noRoom, message: 'Room deleted successfully'});
    }catch(err){
        console.log(err);
        return res.status(500).send({err, message: 'Error creating room'}) ;
    }
};

exports.getRoom = async(req,res)=>{
    try{
        let roomId = req.params.idRo;

        let roomExist = await Room.findOne({_id: roomId})
        .lean()
        .populate('hotel');
        if(!roomExist) return res.status(400).send({message: 'Room not found'});

        return res.send({room: roomExist});
    }catch(err){
        console.log(err);
        return res.status(500).send({err, message: 'Error getting rooms'}) ;
    }
}

//FUNCIONES PARA CLIENTE

exports.getRooms = async(req,res)=>{
    try{
        let hotelId = req.params.idH;
        let hotelExist = await Hotel.findOne({_id: hotelId});
        if(!hotelExist) return res.status(400).send({message: 'Hotel not found'});
        let rooms = await Room.find({hotel: hotelId})
        .lean()
        .populate('hotel');

        return res.send({rooms});
    }catch(err){
        console.log(err);
        return res.status(500).send({err, message: 'Error getting rooms'}) ;
    }
};

//FUNCIONES PARA ADMINISTRADOR DEL HOTEL

exports.availableRooms = async(req,res)=>{
    try{
        let hotelExist = await Hotel.findOne({administrator: req.user.sub});
        if(!hotelExist) return res.status(400).send({message: 'Has not been assigned a hotel'});
        let rooms = await Room.find({hotel: hotelExist._id, available: true})
        .lean()
        .populate('hotel');

        return res.send({availableRooms: rooms});
    }catch(err){
        console.log(err);
        return res.status(500).send({err, message: 'Error getting available rooms'}) ;
    }
}