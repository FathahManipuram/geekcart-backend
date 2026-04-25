import bycrypt from 'bcryptjs'


export const generateOtp=()=>{
	return Math.floor(100000+ Math.random()*900000).toString()
}


export const hashOtp= async(otp)=>{
	return await bycrypt.hash(otp, 8)
}

export const compareOtp = async(otp, hash)=>{
	return await bycrypt.compare(otp, hash)
}