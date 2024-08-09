const { Op } = require('sequelize');
const catchAsync = require("../utils/catchAsync");
const handlerFactory = require("./handlerFactory");
const sequelize = require("../sequelize");
const appError = require("../utils/appError");

const { Auth,
  Cart,
  CartItem,
  Category,
  Order,
  OrderItem,
  OrderState,
  Product,
  User,
  UserFavorites } = require("../models/asc2.js")

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

  const products = await Product.findAll({
    where: {
      category_id: req.params.categoryId,
      price: {
        [Op.between]: [minPrice, maxPrice]
      }
    },
    order: [[sortedBy, typeSort]],
    include: Category,
    limit,
    offset
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

exports.deleteProduct = handlerFactory.deleteOne(Product);
exports.getAllProducts = handlerFactory.getAll(Product);
exports.getProduct = handlerFactory.getOne(Product);
exports.createProduct = handlerFactory.createOne(Product);
exports.updateProduct = handlerFactory.updateOne(Product);
