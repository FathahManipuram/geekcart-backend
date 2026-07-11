export const parseProductFormData = (req, res, next) => {
  try {
    const jsonFields = ["manufacturer", "variants", "variantGroups"];

    for (const field of jsonFields) {
      if (
        typeof req.body[field] === "string" &&
        req.body[field].trim() !== ""
      ) {
        req.body[field] = JSON.parse(req.body[field]);
      }
    }

    const booleanFields = [
      "isActive",
      "isFeatured",
      "isLimited",
      "isReturnable",
    ];

    for (const field of booleanFields) {
      if (req.body[field] !== undefined) {
        req.body[field] = req.body[field] === "true";
      }
    }

    const numberFields = ["returnWindowDays"];

    for (const field of numberFields) {
      if (req.body[field] !== undefined) {
        req.body[field] = Number(req.body[field]);
      }
    }

    next();
  } catch (err) {
    next(err);
  }
};
