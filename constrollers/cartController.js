const CartItem = require("../models/cartItemModel")
const Cart = require("../models/cartModel")
const Product = require("../models/productModel")
const catchAsync = require("../utils/catchAsync")
const sequelize = require("sequelize")
const handlerFactory = require("./handlerFactory")
const appError = require("../utils/appError")


exports.addToCart = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({
    where: {
      user_id: req.user
    }
  })
  if (!cart) {
    return next(new appError("User cart not found", 404))
  }
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

exports.deleteFromCart = catchAsync(async (req, res, next) => {
  const cartItem = await CartItem.findOne({
    where: {
      id: req.params.cartItemId
    },
    include: {
      model: Cart,
      where: { user_id: req.user }
    }
  })
  if (!cartItem) {
    return next(new appError("Cart item not found or doesn't belong to the user", 404))
  }
  await cartItem.destroy()
  res.status(200).json({
    status: "success",
    message: "deleted successfully",
  })
})

exports.showCart = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({
    where: {
      user_id: req.user
    },
    include: {
      model: CartItem,
      include: Product
    }
  })
  if (!cart) {
    return next(new appError("There is no cart for this user!!!", 404))
  }
  res.status(200).json({
    status: "success",
    data: cart
  })
})

exports.showPrice = (async (req, res, next) => {
  const result = await CartItem.findOne({
    attributes: [
      [
        sequelize.literal('SUM(Product.price * CartItem.quantity)'),
        'total_price',
      ],
    ],
    include: [
      {
        model: Cart,
        attributes: [],
        where: { user_id: req.user },
      },
      {
        model: Product,
        attributes: [],
      },
    ],
    group: ['Cart.id'],
    raw: true,
  });
  if (!result || !result.total_price) {
    // Handle the case where there are no items in the cart
    return next(new appError("No items in the cart or cart not found", 404))
  }
  res.status(200).json({
    status: "success",
    price: result
  })
})

exports.getCart = handlerFactory.getOne(Cart)
exports.getAllCarts = handlerFactory.getAll(Cart)
