import { Address } from "../models/address.model"

//Get Address
export const getAddress= async (userId)=>{
	const addresses= (await Address.find({userId})).toSorted({createdAt: -1})
	return {
		message: "Addresses fetched", data: addresses
	}
}


