const catchAsync = require("../utils/catchAsync");
const handlerFactory = require("./handlerFactory");
const appError = require("../utils/appError");
const { QueryTypes } = require('sequelize');
const sequelize = require("../sequelize");


const {
  Cart,
  CartItem,
  Product,
  User } = require("../models/asc2.js")

exports.addToCart = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({
    where: {
      user_id: req.user,
    },
  });

  if (!cart) {
    return next(new appError("Cart not found for this user", 404));
  }

  let cartItem = await CartItem.findOne({
    where: {
      product_id: req.params.productId,
      cart_id: cart.id,
    },
  });

  if (cartItem) {
    cartItem.quantity += req.body.quantity || 1;
    cartItem.save();
  } else {
    cartItem = await CartItem.create({
      quantity: req.body.quantity || 1,
      product_id: req.params.productId,
      cart_id: cart.id,
    });
  }

  res.status(200).json({
    status: "success",
    data: cartItem,
  });
});

exports.deleteFromCart = catchAsync(async (req, res, next) => {
  const cartItem = await CartItem.findOne({
    where: {
      id: req.params.cartItemId,
    },
    include: {
      model: Cart,
      where: { user_id: req.user },
    },
  });

  if (!cartItem) {
    return next(new appError("Cart item not found or doesn't belong to the user", 404));
  }

  await cartItem.destroy();

  res.status(200).json({
    status: "success",
    message: "Item deleted successfully",
  });
});

exports.updateCartItem = catchAsync(async (req, res, next) => {
  const cartItem = await CartItem.findByPk(req.params.cartItemId);
  const cart = await Cart.findOne({
    where: {
      user_id: req.user,
    },
  });

  if (cart.id !== cartItem.cart_id) {
    return next(new appError("Cart item does not belong to this user", 403));
  }

  cartItem.quantity = req.body.quantity || cartItem.quantity;
  cartItem.save();

  res.status(200).json({
    status: "success",
    message: "Item updated successfully",
    data: cartItem
  });
});

exports.showCart = catchAsync(async (req, res, next) => {
  // Find the user by their primary key
  let user = await User.findByPk(req.user);

  // If user is not found, return an error
  if (!user) {
    return next(new appError("User not found", 404));
  }

  const userId = req.user;
  let cart = await Cart.findOne({
    where: {
      user_id: req.user,
    },
  });

  if (!cart) {
    return next(new appError("Cart not found for this user", 404));
  }


  // SQL query to fetch cart, cart items, and product data
  const query = `
    SELECT c.id as cart_id, c.user_id, c.createdAt as cart_createdAt, c.updatedAt as cart_updatedAt,
           ci.id as cartItem_id, ci.quantity, ci.createdAt as cartItem_createdAt, ci.updatedAt as cartItem_updatedAt,
           p.id as product_id, p.name as product_name, p.description as product_description, p.price, p.category_id,
           p.photo, p.createdAt as product_createdAt, p.updatedAt as product_updatedAt,
           IF(uf.user_id IS NOT NULL, TRUE, FALSE) AS is_favorite
    FROM Carts c
    JOIN CartItems ci ON c.id = ci.cart_id
    JOIN Products p ON p.id = ci.product_id
    LEFT JOIN UserFavorites uf ON uf.user_id = :userId AND uf.product_id = p.id 
    WHERE c.user_id = :userId
  `;

  // Execute the query and get the results
  const results = await sequelize.query(query, {
    type: QueryTypes.SELECT,
    replacements: { userId: +userId },
  });

  // If no results are found, return an error
  if (!results.length) {
    return res.status(200).json({
      status: "success",
      data: [],
    });
  }

  // Process the results to structure the response
  cart = {
    id: results[0].cart_id,
    user_id: results[0].user_id,
    createdAt: results[0].cart_createdAt,
    updatedAt: results[0].cart_updatedAt,
    CartItems: results.map(item => ({
      id: item.cartItem_id,
      quantity: item.quantity,
      cart_id: item.cart_id,
      product_id: item.product_id,
      createdAt: item.cartItem_createdAt,
      updatedAt: item.cartItem_updatedAt,
      Product: {
        id: item.product_id,
        name: item.product_name,
        description: item.product_description,
        price: item.price,
        category_id: item.category_id,
        photo: item.photo,
        createdAt: item.product_createdAt,
        updatedAt: item.product_updatedAt,
        is_favorite: item.is_favorite,
      }
    }))
  };

  // Return the structured data as a JSON response
  res.status(200).json({
    status: "success",
    data: cart,
  });
});


exports.showPrice = catchAsync(async (req, res, next) => {
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
    return next(new appError("No items in the cart or cart not found", 404));
  }

  res.status(200).json({
    status: "success",
    price: result,
  });
});

exports.getCartItem = catchAsync(async (req, res, next) => {
  const cartItem = await CartItem.findByPk(req.params.id, {
    include: [{ model: Product }],
  });

  if (!cartItem) {
    return next(new appError("Cart item not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: cartItem,
  });
});


exports.getCart = handlerFactory.getOne(Cart);
exports.getAllCarts = handlerFactory.getAll(Cart);
