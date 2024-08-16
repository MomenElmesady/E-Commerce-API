const { Op, INTEGER } = require('sequelize');
const catchAsync = require("../utils/catchAsync.js");
const handlerFactory = require("./handlerFactory");
const sequelize = require("../sequelize");
const appError = require("../utils/appError");
const { Sequelize, QueryTypes } = require('sequelize');


const {
  Order,
  OrderItem,
  Product,
  User} = require("../models/asc2.js")

// for AI analyses
exports.getProductsForUser = catchAsync(async (req, res, next) => {
  const userId = req.params.userId;
  const user = await User.findByPk(userId);

  if (!user) {
    return next(new appError("No user found with this ID", 404));
  }

  const productData = await OrderItem.findAll({
    attributes: [
      [sequelize.literal('user_id'), 'user_id'],
      [sequelize.literal('user_name'), 'user_name'],
      [sequelize.literal('name'), 'product_name'],
      [sequelize.fn('COUNT', sequelize.literal('Product.id')), 'numberOfBuying'],
    ],
    include: [
      {
        model: Order,
        attributes: [],
        where: { user_id: userId },
        include: [
          {
            model: User,
            attributes: [],
          },
        ],
      },
      {
        model: Product,
        attributes: [],
      },
    ],
    group: ['user_id', 'product_id'],
    raw: true,
  });

  res.status(200).json({
    status: "success",
    data: productData
  });
});

exports.addDefaultPhoto = catchAsync(async (req, res, next) => {
  req.body.photo = req.file?.filename || "default.png";
  next();
});

exports.getProductsOfCategory = catchAsync(async (req, res, next) => {
  const minPrice = req.query.minPrice || 0;
  const maxPrice = req.query.maxPrice || 10 ** 6;
  const sortedBy = req.query.sort || "createdAt";
  const typeSort = req.query.sortOrder === "DESC" ? "DESC" : "ASC";
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 10;
  const offset = (page - 1) * limit;

  const categoryId = req.params.categoryId;
  const userId = req.user; // Assuming req.user contains the user's ID

  // Raw SQL query
  const query = `
    SELECT 
        p.*,
        c.name as category_name,
        c.photo as category_photo,
        IF(uf.user_id IS NOT NULL, TRUE, FALSE) AS is_favorite
    FROM 
        products p
    LEFT JOIN 
        userfavorites uf 
        ON p.id = uf.product_id AND uf.user_id = :userId
    JOIN 
        categories c 
        ON c.id = p.category_id
    WHERE 
        p.category_id = :categoryId
    AND 
        p.price BETWEEN :minPrice AND :maxPrice
    ORDER BY 
        ${sortedBy} ${typeSort}
    LIMIT 
        :limit
    OFFSET 
        :offset;
  `;

  const products = await sequelize.query(query, {
    replacements: {
      userId,
      categoryId,
      minPrice,
      maxPrice,
      limit,
      offset
    },
    type: sequelize.QueryTypes.SELECT
  });

  res.status(200).json({
    status: "success",
    data: products
  });
});


exports.searchInProducts = catchAsync(async (req, res, next) => {
  const { q = "0000" } = req.query;
  const products = await Product.findAll({
    where: {
      name: {
        [Op.like]: `%${q}%`
      }
    }
  });

  res.status(200).json({
    status: "success",
    data: products
  });
});

exports.getHomePageProducts = catchAsync(async (req, res, next) => {
  const userId = req.user; 

  const query = 
  `WITH RankedProducts AS (
  SELECT
      p.*,
      c.name AS category_name,
      c.photo as category_photo,
      ROW_NUMBER() OVER (PARTITION BY p.category_id) AS rn,
      IF(uf.user_id IS NOT NULL, TRUE, FALSE) AS is_favorite
  FROM
      categories c
  JOIN
      products p ON p.category_id = c.id
  LEFT JOIN userfavorites uf ON uf.user_id = :userId AND uf.product_id = p.id
  )
  SELECT *
  FROM RankedProducts
  WHERE rn <= 5`;
;

  const results = await sequelize.query(query, {
    type: QueryTypes.SELECT,
    replacements: { userId: +userId }, 
  });

  // Grouping results by category
  const groupedResults = results.reduce((acc, product) => {
    const { category_name, category_id, category_photo, ...productData } = product;

    let category = acc.find(cat => cat.category_id === category_id);
    if (!category) {
      category = {
        category_name,
        category_id,
        category_photo,
        products: []
      };
      acc.push(category);
    }

    category.products.push(productData);
    return acc;
  }, []);

  res.status(200).json({
    status: "success",
    data: groupedResults
  });
});


exports.deleteProduct = handlerFactory.deleteOne(Product);
exports.getAllProducts = handlerFactory.getAll(Product);
exports.getProduct = handlerFactory.getOne(Product);
exports.createProduct = handlerFactory.createOne(Product);
exports.updateProduct = handlerFactory.updateOne(Product);
