const Order = require("../models/orderModel")
const OrderState = require("../models/orderStateModel")
const Cart = require("../models/cartModel")
const OrderItem = require("../models/orderItemModel")
const CartItem = require("../models/cartItemModel")
const User = require("../models/userModel")
const Product = require("../models/productModel")
const appError = require("../utils/appError")
const catchAsync = require("../utils/catchAsync")
const Payment = require("../models/paymentModel")

const { Op } = require('sequelize');
const sequelize = require("../sequelize")

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

exports.checkOut = catchAsync(async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const cart = await Cart.findOne({
      where: { user_id: req.user },
      include: User,
      transaction, // Pass the transaction to all queries within this transaction block
    });

    const { method } = req.body;
    if (!method) {
      throw new appError("Payment method is required", 400);
    }

    const cartItems = await CartItem.findAll({
      where: { cart_id: cart?.id },
      include: [Product],
      transaction,
    });

    if (!cart || cartItems.length === 0) {
      throw new appError("The cart is empty or invalid", 400);
    }

    const order = await createOrder(req.user, cart, transaction);
    const orderItems = await createOrderItems(order, cartItems, transaction);
    const total = await calculateTotalCheckOut(orderItems);

    // Update order total and fetch the updated order details
    await updateOrder(order.id, total, transaction);
    const updatedOrder = await Order.findByPk(order.id, { transaction });

    await deleteCartItems(cartItems, transaction);
    const orderState = await createOrderState(order.id, transaction);
    const payment = await createPayment(method, order.id, req.user, transaction);

    // If everything is successful, commit the transaction
    await transaction.commit();

    res.status(200).json({
      status: "success",
      data: { order, orderState },
    });
  } catch (error) {
    // If any error occurs, rollback the transaction
    await transaction.rollback();
    next(error);
  }
});


exports.updateOrder = catchAsync(async (req, res, next) => {
  // update each Model which need to be updated 
})

exports.deleteOrder = catchAsync(async (req, res, next) => {
  const orderId = req.params.orderId;
  const transaction = await sequelize.transaction();

  try {
    // Check if the order exists
    const existingOrder = await Order.findByPk(orderId, { transaction });
    if (!existingOrder) {
      throw new appError("Order not found", 404);
    }

    // Check if orderState, payment, and orderItems exist (optional, depending on your business logic)
    const existingOrderState = await OrderState.findOne({
      where: { order_id: orderId },
      transaction,
    });

    const existingPayment = await Payment.findOne({
      where: { order_id: orderId },
      transaction,
    });

    const existingOrderItems = await OrderItem.findAll({
      where: { order_id: orderId },
      transaction,
    });

    // Perform deletion only if all related entities exist
    if (existingOrderState || existingPayment || existingOrderItems.length > 0) {
      // delete Order
      await Order.destroy({
        where: {
          id: orderId,
        },
        transaction,
      });

      // delete orderState
      await OrderState.destroy({
        where: {
          order_id: orderId,
        },
        transaction,
      });

      // delete payment
      await Payment.destroy({
        where: {
          order_id: orderId,
        },
        transaction,
      });

      // delete orderItems
      await OrderItem.destroy({
        where: {
          order_id: orderId,
        },
        transaction,
      });

      // Commit the transaction if all deletions are successful
      await transaction.commit();

      res.status(200).json({
        status: "success",
        message: "deleted successfully",
      });
    } else {
      // Rollback the transaction if any related entity is not found
      await transaction.rollback();
      throw new appError("Order or related entities not found", 404);
    }
  } catch (error) {
    // If any error occurs, rollback the transaction
    await transaction.rollback();
    next(error);
  }
});


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

// functions 
async function createOrder(userId, cart, transaction) {
  return Order.create(
    {
      user_id: userId,
      address_id: cart.User.address_id,
      total: 0,
    },
    { transaction } // Pass the transaction parameter to the create method
  );
}

async function createOrderItems(order, cartItems, transaction) {
  const orderItems = [];

  for (const cartItem of cartItems) {
    const orderItem = await OrderItem.create(
      {
        order_id: order.id,
        product_id: cartItem.product_id,
        quantity: cartItem.quantity,
        price: cartItem.Product.price,
        total_cost: cartItem.quantity * cartItem.Product.price,
      },
      { transaction } // Pass the transaction parameter to the create method
    );
    orderItems.push(orderItem);
  }

  return orderItems;
}

async function calculateTotalCheckOut(orderItems) {
  let total = 0;

  for (const oi of orderItems) {
    total += oi.total_cost;
  }

  return total;
}

async function updateOrder(orderId, total, transaction) {
  // Update total in the order
  await Order.update({ total }, { where: { id: orderId }, transaction });
}

async function deleteCartItems(cartItems, transaction) {
  for (const cartItem of cartItems) {
    await CartItem.destroy({
      where: { id: cartItem.id },
      transaction, // Pass the transaction parameter to the destroy method
    });
  }
}

async function createOrderState(orderId, transaction) {
  return OrderState.create(
    { order_id: orderId },
    { transaction } // Pass the transaction parameter to the create method
  );
}

async function createPayment(method, orderId, userId, transaction) {
  return Payment.create(
    {
      method,
      order_id: orderId,
      user_id: userId,
    },
    { transaction } // Pass the transaction parameter to the create method
  );
}
