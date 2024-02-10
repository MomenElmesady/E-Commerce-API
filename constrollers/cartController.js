const CartItem = require("../models/cartItemModel")
const Cart = require("../models/cartModel")
const Product = require("../models/productModel")
const catchAsync = require("../utils/catchAsync")
const sequelize = require("sequelize")

exports.deleteFromCart = catchAsync(async (req, res, next) => {
  await CartItem.destroy({
    where: {
      id: req.params.cartItemId
    }
  })
  res.status(200).json({
    status: "success",
    message: "deleted successfully"
  })
})

exports.showCart = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({
    where: {
      user_id: req.user
    }
  })
  const cartItems = await CartItem.findAll({
    where: {
      cart_id: cart.id
    },
    include: Product
  })

  res.status(200).json({
    status: "success",
    data: cartItems
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
  res.status(200).json({
    status: "success",
    price: result
  })
})

// dont do this
// exports.showPrice = (async (req, res, next) => {
//   const cart = await Cart.findOne({
//     where: {
//       user_id: req.user
//     }
//   })
//   const cartItems = await CartItem.findAll({
//     where: {
//       cart_id: cart.id
//     },
//     include: Product

//   })
//   // shlould use sum in sequelize grouping
//   let x = 0
//   for (i = 0; i < cartItems.length; i++) {
//     x += (cartItems[i].quantity * cartItems[i].Product.price)
//   }
//   res.status(200).json({
//     status: "success",
//     price: x
//   })
// })