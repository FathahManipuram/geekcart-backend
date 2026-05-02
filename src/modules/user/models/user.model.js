import mongoose from 'mongoose'

const userSchema= new mongoose.Schema({
	fullName: {type: String, trim: true, required: true},
	email: {type: String, required:true, unique: true, lowercase: true, index: true},
	password:{type: String, required: true, required: function(){ return !this.googleId}, select: false},
	role:{type: String, enum:[
		"user", "admin"
	], default:"user"},
	phoneNumber: {type: String},
	avatar: {type: String , default: function(){
		return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=random`
		}
		},
	isBlocked: {type: Boolean, default: false},
	isVerified:{type: Boolean, default: false},
	gender: {type: String, enum:[
		"male", "female"
	], default: null},
dateOfBirth: {type:Date},
googleId: {type: String},
lastLoginAt: {type: Date,},
},
{timestamps: true})

export default mongoose.model("User", userSchema)