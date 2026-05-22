export const parseProductFormData= (req, res, next)=>{
	try{
		const jsonFields= [
			"manufacturer",
			"defaultAttributes",
            "variants",
			"selectedSizes",
			"existingGalleryImages",
		]

  for(const field of jsonFields){
	if(typeof req.body[field]=== "string" && req.body[field].trim() !==""){
		req.body[field]= JSON.parse(req.body[field])
	}
  }

    next();
	}catch(err){
		next(err)
	}
}