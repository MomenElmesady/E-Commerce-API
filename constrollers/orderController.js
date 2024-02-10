const Order = require("../models/orderModel")
const stripe = require('stripe')('sk_test_51OJxtRBGJH4aQ3XJX1eKpByaMvSAnsOmmAhKjcQmUqFE3XVFxZ9CQeqtcwazEzo26zY8Yf2qORGMtnIkLwz2Sefq00jBjanok7')
const OrderState = require("../models/orderStateModel")
const Cart = require("../models/cartModel")
const OrderItem = require("../models/orderItemModel")
const CartItem = require("../models/cartItemModel")
const User = require("../models/userModel")
const Product = require("../models/productModel")
const { Op } = require('sequelize');

const appError = require("../utils/appError")
const catchAsync = require("../utils/catchAsync")
const Payment = require("../models/paymentModel")

exports.getAllOrders = catchAsync(async (req, res, next) => {
  const orders = await Order.findAll()
  res.status(200).json({
    status: "success",
    data: orders
  })
})

exports.getOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findOne({
    where: {
      id: req.params.orderId
    },
    include: [
      {
        model: OrderState,
      },
      {
        model: OrderItem,
        include: [
          {
            model: Product
          }
        ]
      }
    ]
  })
  res.status(200).json({
    status: "success",
    data: order
  })
})

exports.updateOrder = catchAsync(async (req, res, next) => {
  // update each Model which need to be updated 
})

exports.deleteOrder = catchAsync(async (req, res, next) => {
  let orderId = req.params.orderId
  // delete Order 
  await Order.destroy({
    where: {
      id: orderId
    }
  })
  // delete orderState 
  await OrderState.destroy({
    where: {
      order_id: orderId
    }
  })
  // delete payment 
  await Payment.destroy({
    where: {
      order_id: orderId
    }
  })
  // delete orderItems 
  await OrderItem.destroy({
    where: {
      order_id: orderId
    }
  })
  res.status(200).json({
    status: "success",
    message: "deleted successfully"
  })
})


exports.getOrderState = catchAsync(async (req, res, next) => {
  const orderState = await OrderState.findOne({
    where: {
      order_id: req.params.orderId
    }
  })
  if (!orderState) {
    return next(new appError("there is no order with this id"))
  }
  res.status(200).json({
    status: "success",
    data: orderState
  })
})

exports.getUserOrders = catchAsync(async (req, res, next) => {
  const orders = await Order.findAll({
    include: [
      {
        model: User,
        attributes: ['id', 'user_name', 'email'],
        where: { id: req.params.userId },
      },
      {
        model: OrderItem,
        include: [
          {
            model: Product,
            attributes: ['id', 'name', 'price'],
          },
        ],
      },
      {
        model: OrderState,
      },
    ],
  })

  res.status(200).json({
    status: "success",
    data: orders
  })
})

exports.checkOut = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({
    where: { user_id: req.user },
    include: User,
  });
  const user = cart.User
  // const session = await stripe.checkout.sessions.create({
  //   payment_method_types: ['card'],
  //   success_url: `${req.protocol}://${req.get('host')}/my-tours/?tour=${
  //     1
  //   }&user=${user.id}&price=${1}`,
  //   cancel_url: `${req.protocol}://${req.get('host')}/tour/${1}`,
  //   customer_email: user.email,
  //   client_reference_id: cart.isSoftDeleted,
  //   line_items: [
  //     {
  //       name: `x`,
  //       description: "tour.summary",
  //       images: [`https://www.natours.dev/img/tours/`],
  //       amount: 100,
  //       currency: 'usd',
  //       quantity: 1
  //     }
  //   ]
  // });

  const { method } = req.body;
  if (!method) {
    return next(new appError("Should pass a payment method", 400));
  }


  const cartItems = await CartItem.findAll({
    where: { cart_id: cart?.id },
    include: [Product],
  });

  if (!cart || cartItems.length === 0) {
    return next(new appError("The cart is empty", 400));
  }

  const order = await createOrder(req.user, cart);
  const orderItems = await createOrderItems(order, cartItems);
  const total = await calculateTotalCheckOut(orderItems);

  // Update order total and fetch the updated order details
  await updateOrder(order.id, total);
  const updatedOrder = await Order.findByPk(order.id);

  await deleteCartItems(cartItems);
  const orderState = await createOrderState(order.id);
  const payment = await createPayment(method, order.id, req.user);

  res.status(200).json({
    status: "success",
    data: session,
  });
});

exports.recieveOrder = catchAsync(async (req, res, next) => {
  let orderId = req.params.orderId
  await OrderState.update({
    state: "recieved",
    payment: true
  },
    {
      where: {
        order_id: orderId
      }
    })
  await Payment.update({
    state: true,
  },
    {
      where: {
        order_id: orderId
      }
    })
  res.status(200).json({
    status: "success",
    message: "order recieved successfully"
  })
})

exports.deleteFromOrder = catchAsync(async (req, res, next) => {
  const orderItemIds = req.params.orderItemIds.split(",")
  const order = await Order.findByPk(req.params.orderId)
  let total = order.total
  const orderItems = await OrderItem.findAll({
    where: {
      id: {
        [Op.in]: orderItemIds
      }
    }
  })
  for (i of orderItems) {
    total -= i.total_cost
  }
  order.total = total
  await order.save()
  res.status(200).json({
    order
  })
})

async function createOrder(userId, cart) {
  return Order.create({
    user_id: userId,
    address_id: cart.User.address_id,
    total: 0,
  });
}

async function createOrderItems(order, cartItems) {
  const orderItems = [];

  for (const cartItem of cartItems) {
    const orderItem = await OrderItem.create({
      order_id: order.id,
      product_id: cartItem.product_id,
      quantity: cartItem.quantity,
      price: cartItem.Product.price,
      total_cost: cartItem.quantity * cartItem.Product.price,
    });
    orderItems.push(orderItem);
  }
  return orderItems;
}

async function calculateTotalCheckOut(orderItems) {
  let total = 0
  console.log(orderItems)
  for (const oi of orderItems) {
    total += oi.total_cost
  }
  return total
}

async function updateOrder(orderId, total) {
  // Update total in the order
  await Order.update({ total }, { where: { id: orderId } });
}



async function deleteCartItems(cartItems) {
  for (const cartItem of cartItems) {
    await CartItem.destroy({
      where: { id: cartItem.id },
    });
  }
}

async function createOrderState(orderId) {
  return OrderState.create({ order_id: orderId });
}

async function createPayment(method, orderId, userId) {
  return Payment.create({
    method,
    order_id: orderId,
    user_id: userId,
  });
}

