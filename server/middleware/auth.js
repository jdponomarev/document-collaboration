const jwt = require("jsonwebtoken");
const {User} = require("../models/User");

const checkAuthenticationHeaders = async (req,res, next)=>{
    if(!req.headers.jwt){
        return next();
    }

    let jwtData = null;
    try{
        jwtData = jwt.verify(
            req.headers.jwt,
            process.env.JWT_KEY
        );
    }catch(e){
        if(process.env.ENV=="dev"){

        }else{
            return next();
        }
    }

    //Just for testing
    let user = null;
    if(process.env.ENV=="dev" && process.env.TEST_JWT_KEY == req.headers.jwt){
        user = await User.findOne();
    }else{
        user = await User.findOne({_id: jwtData._id});
    }
    
    
    if(!user){
        return next();
    }
    req.user = user;
    return next();

}
const checkSocketAuthentication = async (socket, next) => {
    if(!socket.request.headers){
        return next();
    }
    let jwtData = null;
    try{
        jwtData = jwt.verify(
            socket.request.headers.jwt,
            process.env.JWT_KEY
        );
    }catch(e){
        if(process.env.ENV=="dev"){

        }else{
            return next();
        }
    }
    //Just for testing
    let user = null;
    if(process.env.ENV=="dev" && !socket.request.headers.jwt){
        user = await User.findOne();
    }else{
        user = await User.findOne({_id: jwtData._id});
    }

    if(user){
        socket.user = user;
    }
    return next();
}
const requiresAuth = async (req,res, next)=>{
    if(!req.user){
        res.status(401).json({status:"error", code:"NOT_AUTHORIZED"})
    }
    return next();
};
module.exports = {checkAuthenticationHeaders, requiresAuth, checkSocketAuthentication}