'use strict'

const bcrypt = require('bcrypt-nodejs');

exports.validateData = (data)=>{
    let keys = Object.keys(data), msg= '';

    for(let key of keys){
        if(data[key] !== null && data[key] !== undefined && data[key] !== '') continue;
        msg += `The param ${key} is required\n`
    }return msg.trim();
}

exports.encrypt =(password)=>{
    try{
        return bcrypt.hashSync(password);
    }catch(err){
        console.log(err);
        return err;
    }
}

exports.checkPermission = async (id, sub)=>{
    try{
        if(id != sub){
            return false;
        }else{
            return true;
        }
    }catch(err){
        console.log(err);
        return err;
    }
}

exports.checkPassword = (password, hash)=>{
    try{
        return bcrypt.compareSync(password, hash)
    }catch(err){
        console.log(err);
        return err;
    }
}

exports.checkParams = async (params)=>{
    try{
        if(Object.entries(params).length === 0) return false
    return true
    }catch(err){
        console.log(err);
        return err;
    }
}

exports.checkUpdate = async (params)=>{
    try{
        if(
            params.password || 
            params.role ||
            params.user ||
            params.administrator ||
            params.hotel ||
            params.room ||
            params.status ||
            params.noRoom ||
            params.available
        ) return false;
            
        return true;
    }catch(err){
        console.log(err);
        return err;
    }
}

exports.deleteSensitiveDataAdmin = async(data)=>{
    try{
        delete data.administrator.password;
        delete data.administrator.role;
        delete data.administrator.visitedHotels;
        delete data.administrator.events;
        delete data.administrator.reservations;
        return data;
    }catch(err){
        console.log(err);
        return err;
    }
}
exports.deleteSensitiveData = async(data)=>{
    try{
        delete data.user.password;
        delete data.user.role;
        delete data.user.visitedHotels;
        delete data.user.events;
        delete data.user.reservations;
        return data;
    }catch(err){
        console.log(err);
        return err;
    }
}
