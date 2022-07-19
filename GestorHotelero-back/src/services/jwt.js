'use strict'

const jwt = require('jwt-simple');
const moment = require('moment');
const secretKey = 'Grupo4'

exports.createToken = async(user)=>{
    try{
        let payload = {
            sub: user._id,
            username: user.username,
            password: user.password,
            name: user.name,
            surname: user.surname,
            phone: user.phone,
            email: user.email,
            role: user.role,
            iat: moment().unix(),
            exp: moment().add(24, 'hour').unix()
        }
        return jwt.encode(payload, secretKey);
    }catch(err){
        console.log(err);
        return err;
    }
}