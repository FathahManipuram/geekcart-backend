export const buildQuery= ({
	model,
	search="",
	searchFields=[],
	page=1,
    limit=10,
	sort= {createdAt: -1},
	filters={},
	populate="",
	select="",
})=>{
	const query= {...filters}
	if(search && search.trim() && searchFields.length > 0){
		query.$or= searchFields.map((field)=> ({
			[field]: {
				$regex: search.trim(),
				$options: "i",
			}
		}))
	}

	const currentPage= Number(page) || 1
	const perPage= Number(limit) || 10

	const skip= (currentPage- 1) * perPage

	const totalItems= await model.countDocuments(query)
	const totalPages= Math.ceil(totalItems/perPage)

	let mongoQuery = model
	.find(query)
	.sort(sort)
	.skip(skip)
	.limit(perPage)

	if(select){
		mongoQuery= mongoQuery.select(select)
	}

	if(populate){
		mongoQuery.populate(populate)
	}

	const items= await mongoQuery;

	return {
		items,
		pagination:{
			currentPage,
			perPage,
			totalItems,
			totalPages,
			hasNextPage: currentPage < totalPages,
			hasPrevPage: currentPage > 1,
		}
	}


}