import mongoose from 'mongoose'

const userSchema= new mongoose.Schema({
	fullName: {type: String, trim: true, required: true},
	email: {type: String, required:true, unique: true, lowercase: true, index: true},
	password:{type: String, required: true, required: function(){ return !this.googleId}},
	role:{type: String, enum:[
		"user", "admin"
	], default:"user"},
	phoneNumber: {type: String},
	avatar: {type: String},
	isBlocked: {type: Boolean, default: false},
	isVerified:{type: Boolean, default: false},
	gender: {type: String, enum:[
		"male", "female"
	]},
dateOfBirth: {type:Date},
googleId: {type: String},
lastLoginAt: {type: Date,},
},
{timestamps: true})

export default mongoose.model("User", userSchema)