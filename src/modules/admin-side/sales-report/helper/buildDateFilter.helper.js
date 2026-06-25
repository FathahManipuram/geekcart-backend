export const buildDateFilter = ({ type, startDate, endDate }) => {
  const now = new Date();

  let from;
  let to;

  switch (type) {
    case "daily":
      from = new Date(now.setHours(0, 0, 0, 0));
      to = new Date(now.setHours(23, 59, 59, 999));
      break;

    case "weekly": {
      const firstDay = new Date();
      firstDay.setDate(now.getDate() - now.getDay());

      from = new Date(firstDay.setHours(0, 0, 0, 0));

      to = new Date();
      to.setHours(23, 59, 59, 999);

      break;
    }

    case "monthly":
      from = new Date(now.getFullYear(), now.getMonth(), 1);

      to = new Date();

      break;

    case "yearly":
      from = new Date(now.getFullYear(), 0, 1);

      to = new Date();

      break;

    case "custom":
      from = new Date(startDate);
      from.setHours(0, 0, 0, 0);

      to = new Date(endDate);
      to.setHours(23, 59, 59, 999);

      break;

    default:
      return {};
  }

  return {
    createdAt: {
      $gte: from,
      $lte: to,
    },
  };
};
