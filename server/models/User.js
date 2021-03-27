const mongoose = require('mongoose');
const {ObjectId} = mongoose.Schema.Types;

const UserSchema = new mongoose.Schema({
    name:{type:String, trim: true},
    email:{type:String, trim:true, lowercase:true},


    salt:{type:String}
},{
    timestamps:true
});

const User = mongoose.model("User", UserSchema);
module.exports = { User };