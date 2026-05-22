import mongoose from "mongoose"

const categorySchema=  new mongoose.Schema({
	name: {
		type: String,
		required: true,
		trim: true,
		// unique: true,
		maxlength: 100,
	},

	slug: {
		type: String,
		required: true,
		// unique: true,
		lowercase: true,
		trim: true,
	},
	isActive: {
		type: Boolean,
		default: true,
	},
	isDeleted: {
		type: Boolean,
		default: false,
	},
	deletedAt: {
		type: Date,
		default: null,
	}
},
{timestamps: true}
)

categorySchema.index(
	{
		name: 1,
		isDeleted: 1
	},
	{
		unique: true
	}

)

export const Category= mongoose.model("Category", categorySchema)