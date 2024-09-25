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
  User,
  Category,
  CartItem,
  Cart} = require("../models/asc2.js")

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
  const limit = req.query.limit * 1 || 4;
  const offset = (page - 1) * limit;

  const categoryId = req.params.categoryId;
  const userId = req.user; // Assuming req.user contains the user's ID

  // Step 1: Get the total count of products matching the criteria
  const totalQuery = `
    SELECT COUNT(*) AS total
    FROM products p
    WHERE p.category_id = :categoryId
    AND p.price BETWEEN :minPrice AND :maxPrice
  `;

  const totalResult = await sequelize.query(totalQuery, {
    replacements: { categoryId, minPrice, maxPrice },
    type: sequelize.QueryTypes.SELECT
  });

  const totalProducts = totalResult[0].total; // Get total count of products
  const totalPages = Math.ceil(totalProducts / limit); // Calculate total number of pages

  // Step 2: Fetch paginated products
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

  // Get the number of products on this page
  const numberOfProductsOnPage = products.length;

  // Step 3: Return total pages, total products, and products for the current page
  res.status(200).json({
    status: "success",
    totalProducts,            // Total number of matching products
    totalPages,               // Total number of pages
    numberOfProductsOnPage,    // The number of products on this page
    currentPage: page,        // Current page number
    data: products            // The products for the current page
  });
});

exports.searchInProducts = catchAsync(async (req, res, next) => {
  const { q = "0000", categoryId } = req.query;
  const userId = req.user;

  // Create the search conditions
  const whereConditions = {
    name: {
      [Op.like]: `%${q}%`
    }
  };

  // If categoryId is provided, add it to the where condition
  if (categoryId) {
    whereConditions.category_id = categoryId;
  }

  // Query to search products and check if they are favorite for the user
  const query = `
    SELECT
      p.*,
      IF(uf.user_id IS NOT NULL, TRUE, FALSE) AS is_favorite
    FROM
      products p
    LEFT JOIN userfavorites uf
      ON uf.user_id = :userId AND uf.product_id = p.id
    WHERE
      p.name LIKE :q
    ${categoryId ? "AND p.category_id = :categoryId" : ""}
  `;

  const replacements = {
    userId: +userId,
    q: `%${q}%`
  };

  if (categoryId) {
    replacements.categoryId = +categoryId;
  }

  // Execute the query
  const products = await sequelize.query(query, {
    type: QueryTypes.SELECT,
    replacements
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

exports.getProduct = catchAsync(async (req, res, next) => {
  const userId = req.user; 

  const query = 
  `select p.*, IF(uf.user_id IS NOT NULL, TRUE, FALSE) AS is_favorite
from products p LEFT JOIN userfavorites uf ON uf.user_id = :userId AND uf.product_id = p.id 
where p.id = :productId`;
;

  const results = await sequelize.query(query, {
    type: QueryTypes.SELECT,
    replacements: { userId: +userId, productId: +req.params.id }, 
  });

  res.status(200).json({
    status: "success",
    data: results[0]
  });

});

exports.checkProductInCart = catchAsync(async (req, res, next) => {
  const userId = req.user; 
  const productId = req.params.productId;
  const cart = await Cart.findOne({where: {user_id: userId}});
  if (!cart){
    return res.status(200).json({
      status: "fail",
      message: 'cant find cart for this user'
    });
  }
  const cartItem = await CartItem.findOne({where: {cart_id: cart.id, product_id: productId}});
  let data = false;
  if (cartItem){
    data = true;
  }
  return res.status(200).json({
    status: "success",
    data
  });

});


exports.deleteProduct = handlerFactory.deleteOne(Product);
exports.getAllProducts = handlerFactory.getAll(Product);
exports.createProduct = handlerFactory.createOne(Product);
exports.updateProduct = handlerFactory.updateOne(Product);
