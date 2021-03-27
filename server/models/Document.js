const mongoose = require('mongoose');
const {ObjectId} = mongoose.Schema.Types;

const DocumentSchema = new mongoose.Schema({
    title:{type:String, unique:true, trim:true},
    owner:{type:ObjectId, ref:"User"},
    text:{type:String},
    body:{type:String},
    deleted:{type:Boolean, default:false},
    views:{type:Number, default:0}
},{
    timestamps:true
});


const Document = mongoose.model("Document", DocumentSchema);
module.exports = { Document };