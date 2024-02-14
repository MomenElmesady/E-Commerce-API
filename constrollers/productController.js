const Category = require("../models/categoryModel")
const Product = require("../models/productModel")
const OrderItem = require("../models/orderItemModel")
const Order = require("../models/orderModel")
const User = require("../models/userModel")
const { Op } = require('sequelize');
const catchAsync = require("../utils/catchAsync");
const handlerFactory = require("./handlerFactory")
const sequelize = require("../sequelize")

// for AI analyses 
exports.getProductsForUser = catchAsync(async (req, res, next) => {
  const productData = await OrderItem.findAll({
    attributes: [
      [sequelize.literal('user_id'), 'user_id'],
      // [sequelize.literal('product_id'), 'product_id'],
      [sequelize.literal('user_name'), 'user_name'],
      [sequelize.literal('name'), 'product_name'],
      [sequelize.fn('COUNT', sequelize.literal('Product.id')), 'numberOfBuying'],
    ],
    include: [
      {
        model: Order,
        attributes: [],
        where: { user_id: req.user },
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
  })
})

exports.addDefaultPhoto = catchAsync(async (req, res, next) => {
  req.body.photo = req.file?.filename || "default.png"
  next()
})

exports.getProductsOfCategory = catchAsync(async (req, res, next) => {
  let minPrice = req.query.minPrice || 0
  let maxPrice = req.query.maxPrice || 10 ** 6
  let sortedBy = req.query.sort || "createdAt"
  let typeSort = req.query.sortOrder === "DESC" ? "DESC" : "ASC"
  const page = req.query.page * 1 || 1
  const limit = req.query.limit * 1 || 10
  const offset = (page - 1) * limit

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
  })
  res.status(200).json({
    status: "success",
    data: products
  })
})

exports.searchInProducts = catchAsync(async (req, res, next) => {
  const { q = "000000" } = req.query;
  const products = await Product.findAll({
    where: {
      name: {
        [Op.like]: `%${q}%`
      }
    }
  })
  res.status(200).json({
    status: "success",
    data: products
  })
})

exports.deleteProduct = handlerFactory.deleteOne(Product)
exports.getAllProducts = handlerFactory.getAll(Product)
exports.getProduct = handlerFactory.getOne(Product)
exports.createProduct = handlerFactory.createOne(Product)
exports.updateProduct = handlerFactory.updateOne(Product)