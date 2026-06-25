import { Variant } from "../../product-management/models/variant.model.js"

export const getDataSample= async()=>{
	const variants= await Variant.find()
	.populate({
		path: "product", 
		select: "name category subcategory",
		match: {isActive: true}
		})
	


	return{
		message: "Sample data fetched",
		data: variants
	}
}