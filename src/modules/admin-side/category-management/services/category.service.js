import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { AppError } from "../../../../common/utils/AppError.js";
import { buildQuery } from "../../../../common/utils/buildQuery.js";
import { generateSlug } from "../../../../common/utils/slugify.js";
import { Product } from "../../product-management/models/product.model.js";
import { Subcategory } from "../../subcategory-management/models/subcategory.model.js";
import { Category } from "../models/category.model.js";

//fatch categories
export const fetchCategoriesService = async ({
  page = 1,
  limit = 5,
  search = "",
  status = "",
}) => {
  const filters = {
    isDeleted: false,
  };

  if (status === "active") {
    filters.isActive = true;
  }

  if (status === "inactive") {
    filters.isActive = false;
  }

  const result = await buildQuery({
    model: Category,
    search,
    searchFields: ["name"],
    limit,
    page,
    sort: { createdAt: -1 },
    filters,
  });

  const activeCategories = await Category.countDocuments({
    isDeleted: false,
    isActive: true,
  });

  const totalSubcategories = await Subcategory.countDocuments({
    isDeleted: false,
  });

  const categoryWithCount = await Promise.all(
    result.items.map(async (category) => {
      const subcategoryCount = await Subcategory.countDocuments({
        category: category._id,
        isDeleted: false,
      });

      const productCount = await Product.countDocuments({
        category: category._id,
        isDeleted: false,
      });

      return {
        ...(category.toObject?.() || category),
        subcategoryCount,
        productCount,
      };
    }),
  );

  return {
    message: "Categories fetched successfully",
    data: {
      // categories: result.items,
      categories: categoryWithCount,
      pagination: result.pagination,
      activeCategories,
      totalSubcategories,
    },
  };
};

//Create categries
export const createCategoryService = async (data) => {
  const { name } = data;

  const normalizedName = name.trim();
  const slug = generateSlug(normalizedName);
  const existingCategory = await Category.findOne({
    name: {
      $regex: `^${normalizedName}$`,
      $options: "i",
    },
    isDeleted: false,
  });

  if (existingCategory) {
    throw new AppError("Category already exists", HTTP_STATUS.CONFLICT);
  }

  const category = await Category.create({
    name: normalizedName,
    slug,
  });

  return {
    message: "Category created successfully",
    data: category,
  };
};

//Update categories
export const updateCategoryService = async (categoryId, data) => {
  const { name, isActive } = data;

  const category = await Category.findById(categoryId);

  if (!category) {
    throw new AppError("Category not found", HTTP_STATUS.NOT_FOUND);
  }

  if (name && name.trim() !== category.name) {
    const normalizedName = name.trim();
    const slug = generateSlug(normalizedName);

    const existingCategory = await Category.findOne({
      _id: { $ne: categoryId },
      $or: [
        {
          name: {
            $regex: `^${normalizedName}$`,
            $options: "i",
          },
        },
        { slug },
      ],
    });
    if (existingCategory) {
      throw new AppError("Category already exists", HTTP_STATUS.CONFLICT);
    }

    category.name = normalizedName;
    category.slug = slug;
  }
  if (typeof isActive === "boolean") {
    category.isActive = isActive;
  }
  await category.save();

  return {
    message: "Category updated successfully",
    data: category,
  };
};

//Soft delete
export const deleteCategoryService = async (categoryId) => {
  const category = await Category.findById(categoryId);

  if (!category || category.isDeleted) {
    throw new AppError("Category not found", HTTP_STATUS.NOT_FOUND);
  }

  await Category.updateOne(
    { _id: categoryId },
    {
      isDeleted: true,
      deletedAt: new Date(),
    },
  );
  return {
    message: "category deleted successfully",
  };
};
