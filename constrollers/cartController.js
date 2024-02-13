const CartItem = require("../models/cartItemModel")
const Cart = require("../models/cartModel")
const Product = require("../models/productModel")
const catchAsync = require("../utils/catchAsync")
const sequelize = require("sequelize")
const handlerFactory = require("./handlerFactory")

exports.deleteFromCart = catchAsync(async (req, res, next) => {
  await CartItem.destroy({
    where: {
      id: req.params.id
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
    },
    include: {
      model: CartItem,
      include: Product
    }
  })
  // const cartItems = await CartItem.findAll({
  //   where: {
  //     cart_id: cart.id
  //   },
  //   include: Product
  // })

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
  res.status(200).json({
    status: "success",
    price: result
  })
})

exports.getCart = handlerFactory.getOne(Cart)
exports.getAllCarts = handlerFactory.getAll(Cart)
