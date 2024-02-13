const Category = require("../models/categoryModel")
const Product = require("../models/productModel")
const CartItem = require("../models/cartItemModel")
const OrderItem = require("../models/orderItemModel")
const Order = require("../models/orderModel")
const User = require("../models/userModel")
const { Op } = require('sequelize');
const catchAsync = require("../utils/catchAsync");
const Cart = require("../models/cartModel");
const handlerFactory = require("./handlerFactory")
const sequelize = require("../sequelize")


exports.getProductsForUser = catchAsync(async (req, res, next) => {
  const result = await OrderItem.findAll({
    attributes: [
      [sequelize.literal('user_id'), 'user_id'],
      [sequelize.literal('product_id'), 'product_id'],
      [sequelize.literal('user_name'), 'user_name'],
      [sequelize.literal('name'), 'product_name'],
      [sequelize.fn('COUNT', sequelize.literal('Product.id')), 'numberOfBuying'],
    ],
    include: [
      {
        model: Order,
        attributes: [],
        where: { user_id: 62 },
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
    // where: { '$Order.User.id$': 62 }, // Apply the condition to the main query
    group: ['user_id', 'product_id'],
    raw: true,
  });
  res.status(200).json({
    status: "success",
    data: result
  })
})

exports.addDefaultPhoto = catchAsync(async(req,res,next)=>{
  req.body.photo = req.file?.filename || "default.png"
  next()
})


exports.getProductsOfCategory = catchAsync(async (req, res, next) => {
  let mn = req.query.minPrice || 0
  let mx = req.query.maxPrice || 10 ** 6
  let sortedBy = req.query.sort || "createdAt"
  let typeSort = req.query?.sortOrder === "DESC" ? "DESC" : "ASC"
  const products = await Product.findAll({
    where: {
      category_id: req.params.categoryId,
      price: {
        [Op.between]: [mn, mx]
      }
    },
    order: [[sortedBy, typeSort]],
    include: Category
  })
  res.status(200).json({
    status: "success",
    data: products
  })
})

exports.searchInProducts = catchAsync(async (req, res, next) => {
  let q = req.query.q || "000000" // this 00000 to make the search block empty -> just joke 
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