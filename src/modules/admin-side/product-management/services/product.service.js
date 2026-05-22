import mongoose from "mongoose"
import { HTTP_STATUS } from "../../../../common/constants/statusCode.js"
import { AppError } from "../../../../common/utils/AppError.js"
import { generateSlug } from "../../../../common/utils/slugify.js"
import { Category } from "../../category-management/models/category.model.js"
import { Product } from "../models/product.model.js"
import { Subcategory } from "../../subcategory-management/models/subcategory.model.js"
import { Variant } from "../models/variant.model.js"
import { buildQuery } from "../../../../common/utils/buildQuery.js"


//Create Product 
export const createProductService= async(data)=>{
	const session= await mongoose.startSession()
	session.startTransaction()

	try{
		const{
		name, 
		description, 
		coverImage,
		galleryImages,
		category, 
		subcategory,
		manufacturer,
		isReturnable,
		returnWindowDays,
		isFeatured,
		sleeve,
		fabric,
		isLimited,
		isActive,
		variants=[],
		} = data

		const existingCategory= await Category.findOne({
			_id: category,
			isDeleted: false,
		}).session(session)

		if(!existingCategory){
			throw new AppError("Category not found", HTTP_STATUS.NOT_FOUND)
		}
		const existingSubcategory= await Subcategory.findOne({
			_id: subcategory,
			category,
			isDeleted: false,
		}).session(session)

		if(!existingSubcategory){
			throw new AppError("Subcategory not found", HTTP_STATUS.NOT_FOUND)
		}

		const normalizedName= name.trim()
		const baseSlug= generateSlug(normalizedName)
		let slug= baseSlug
		let counter= 1

		while(await Product.exists({
			slug, isDeleted: false, 
		}).session(session)){
			slug= `${baseSlug}-${counter}`
			counter++;
		}

		const [product ]= await Product.create([
			{
				name: normalizedName,
				slug,
				description,
				coverImage,
				galleryImages,
				sleeve,
				fabric,
				isReturnable,
				returnWindowDays,
				category,
				subcategory,
				manufacturer,
				isFeatured,
				isLimited,
				isActive,
			}
		],{session})


		const variantDocs = variants.map((variant, index)=>({
			...variant,
			product: product._id,
			isDefault: index===0 ? true : !!variant.isDefault
		}))
		
		if(variantDocs.length > 0){
			await Variant.insertMany(variantDocs, { session });
		}
		

		await session.commitTransaction()

		const createdProduct= await Product.findById(product._id)
		.populate("category", "name")
		.populate("subcategory", "name")
		
		return {
			message: "Product created successfully",
			data: createdProduct,
		}
	} catch (err){
		await session.abortTransaction()
		throw err
	}finally{
		session.endSession();
	}
}


// //fetch all product
// export const getProductsService= async(query)=>{
// 	const {
// 		page= 1,
// 		limit=5,
// 		search="",
// 		cartegory="",
// 		subcategory="",
// 		status="",
// 		sort="latest",
// 	} = query;

// 	const currentPage= page
// 	const perPage= limit
// 	const skip= (currentPage- 1) * perPage

// 	const filters={
// 		isDeleted: false,
// 	}

// 	if(search?.trim()){
// 		filters.name= {
// 			$regex: search.trim(),
// 			$options: "i",
// 		}
// 	}

// 	if(category){
// 		filters.category=
// 		new mongoose.Types.ObjectId(category)
// 	}

// 	if(subcategory){
// 		filters.subcategory= new mongoose.Types.ObjectId(subcategory)
// 	}

// 	let sortOption= {
// 		createdAt: -1
// 	}

// 	switch(sort){
// 		case "oldest":
// 			sortOption={
// 				createdAt: 1
// 			}
// 			breake;
// 		case "latest":
// 			default:
// 				sortOption={
// 					createdAt: -1
// 				}
// 	}

// 	const {
// 		items: products,
// 		pagination,
// 	}= await buildQuery({model: Product,
// 		search, 
// 		searchFields:["name"],
// 		page,
// 		limit,
// 		sort: sortOption,
// 		filters,
// 		populate:[
// 			{
//           path: "category",
//           select: "name",
//         },

//         {
//           path: "subcategory",
//           select: "name",
//         },
// 		]
// 	})

// 	const formattedProduct= await Promise.all(
// 		products.map(async(product)=>{
// 			const variants = await Variant.find({
// 				product: product._id,
// 			}).lean()

// 			const totalStock= variants.reduce((total, variant)=> total + (variant.stock || 0),0)

// 			const prices =
//               variants.map(
//                 (variant) =>
//                   variant.price ||
//                   0
//               );

// 			  const lowestPrice =
//               prices.length > 0
//                 ? Math.min(
//                     ...prices
//                   )
//                 : 0;

// 				let inventoryStatus =
//               "in-stock";

//             if (
//               totalStock === 0
//             ) {
//               inventoryStatus =
//                 "out-of-stock";
//             } else if (
//               totalStock < 20
//             ) {
//               inventoryStatus =
//                 "low-stock";
//             }

// 			 if (
//               status &&
//               inventoryStatus !==
//                 status
//             ) {
//               return null;
//             }


// 			 [
//                 ...new Set(
//                   variants.map(
//                     (
//                       variant
//                     ) =>
//                       variant.size
//                   )
//                 ),
//               ];
// return {...product, totalStock, lowerPrice, inventoryStatus, sizes, variants}
// 		})
// 	)

// 	return {
//       message:
//         "Products fetched successfully",

//       data:
//         formattedProducts.filter(
//           Boolean
//         ),

//       pagination,
//     };
// }


//Get product

export const getProductsService = async () => {
 
  const products = await Product.find({
    isDeleted: false,
  }).populate("category", "name")
    .populate("subcategory", "name")
    .lean();

const formatedProducts= await Promise.all(products.map(async(product)=>{
	const variants= await Variant.find({
		product: product._id,
	}).lean()

	const stock = variants.reduce(
    (total, variant) => total + (variant.stock || 0),
    0,
  );


const price =
  variants.length > 0
    ? Math.min(...variants.map((variant) => variant.price))
    : 0;

	 let status = "in-stock";

   if (stock === 0) {
     status = "out-of-stock";
   } else if (stock < 5) {
     status = "low-stock";
   }

   return {
     ...product,

     variants,

     stock,

     price,

     status,
   };



}))
  
  return {
    message: "Products fetched successfully",

    data: formatedProducts,
  };
};


//Get prodect details
export const getProductDetailsService= async(slug)=>{
	const product = await Product.findOne({
		slug,
		isDeleted: false,
	}).populate("category", "name").populate("subcategory", "name").lean()

	const variants= await Variant.find({
		product: product._id,
	}).lean()

	return {
		message: "Product details fetched successfully",
		data: {
			...product,
			variants,
		}

	}
}

//Update product service
export const updateProductService= async(productId, data)=>{
	const existingProduct = await Product.findOne({
    _id: productId,

    isDeleted: false,
  });

  if (!existingProduct) {
    throw new AppError("Product not found", HTTP_STATUS.NOT_FOUND);
  }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,

      {
        ...data,
      },

      {
        new: true,
      },
    )
      .populate("category", "name")
      .populate("subcategory", "name");

	  return {
      message: "Product updated successfully",

      data: updatedProduct,
    };
}