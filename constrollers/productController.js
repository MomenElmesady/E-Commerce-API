const Category = require("../models/categoryModel")
const Product = require("../models/productModel")
const CartItem = require("../models/cartItemModel")
const { Op } = require('sequelize');
const catchAsync = require("../utils/catchAsync");
const Cart = require("../models/cartModel");

exports.createProduct = catchAsync(async (req, res, next) => {
  const product = await Product.create(req.body)
  res.status(200).json(product)
})

exports.getAllProducts = catchAsync(async (req, res, next) => {
  const products = await Product.findAll()
  res.status(200).json(products)
})

exports.getProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findByPk(req.params.productId)
  res.status(200).json(product)
})

exports.deleteProduct = catchAsync(async (req, res, next) => {
  await Product.destroy({
    where: {
      id: req.params.productId
    }
  })
  res.status(200).json({
    message: "deleted successfully"
  })
})

exports.updateProduct = catchAsync(async (req, res, next) => {
  const product = await Product.update(req.body, {
    where: {
      id: req.params.productId
    }
  })
  res.status(200).json(product)
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

exports.addToCart = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({
    where: {
      user_id: req.user
    }
  })
  const cartItem = await CartItem.create({
    quantity: req.body.quantity || 1,
    product_id: req.params.productId,
    cart_id: cart.id 
  })
  res.status(200).json({
    status: "success",
    data: cartItem
  })
})
