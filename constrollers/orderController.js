const appError = require("../utils/appError")
const catchAsync = require("../utils/catchAsync")
const handlerFactory = require("./handlerFactory")
// const {
//   Cart,
//   CartItem,
//   Order,
//   OrderItem,
//   OrderState,
//   Product,
//   User,
//   Payment, 
//   Address} = require("../models/asc2.js")

const Cart = require("../models/cartModel");
const CartItem = require("../models/cartItemModel");
const Product = require("../models/productModel");
const User = require("../models/userModel");
const Order = require("../models/orderModel");
const OrderItem = require("../models/orderItemModel");
const OrderState = require("../models/orderStateModel");
const Payment = require("../models/paymentModel");
const Address = require("../models/addressModel");


const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY)


const { Op } = require('sequelize');
const sequelize = require("../sequelize")


exports.getOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findOne({
    where: {
      id: req.params.id
    },
    include: [
      {
        model: OrderState,
        attributes: ["id", "state", "payment"]
      },
      {
        model: OrderItem,
        attributes: ["id", "quantity", "price", "total_cost"],
        include: [
          {
            model: Product,
            attributes: ["id", "name", "description", "price", "category_id", "photo"]
          }
        ]
      }
    ]
  })
  if (!order) {
    return next(new appError("No order found with this ID", 404));
  }
  res.status(200).json({
    status: "success",
    data: order
  })
})

exports.createCheckOutSession = catchAsync(async (req, res, next) => {
  const lineItems = []
  const products = await Product.findAll()
  for (i of products) {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: i.name,
          description: i.description,
        },
        unit_amount: i.price,
      },
      quantity: 1
    })
  }
  let session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: lineItems,
    success_url: `https://www.google.com/`,
    cancel_url: `https://www.google.com/`
  })
  res.status(200).json({
    session
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
      return next(new appError("The cart is empty or invalid", 404));
    }

    const order = await createOrder(req.user, cart, transaction, req.body.addressInDetails, req.body.addressId);
    const orderItems = await createOrderItems(order, cartItems, transaction);
    const total = await calculateTotalCheckOut(orderItems);
    order.total = total;
    order.save({ transaction });
    // Update order total and fetch the updated order details
    const orderState = await createOrderState(order.id, transaction);

    await Order.findByPk(order.id, { transaction });
    await deleteCartItems(cartItems, transaction);
    await createPayment(method, order.id, req.user, transaction);

    // If everything is successful, commit the transaction
    await transaction.commit();

    res.status(200).json({
      status: "success",
      data: { order, orderState },
    });
  } catch (err) {
    // If any error occurs, rollback the transaction
    await transaction.rollback();
    next(new appError(err.message, 400));
  }
});


exports.updateOrder = catchAsync(async (req, res, next) => {
  // update each Model which need to be updated 
})

exports.deleteOrder = catchAsync(async (req, res, next) => {
  const orderId = req.params.id;
  const transaction = await sequelize.transaction();

  try {
    // Check if the order exists
    const existingOrder = await Order.findOne({
      id: orderId,
      user_id: req.user
    },
      { transaction });
    if (!existingOrder) {
      throw new appError("Order not found or dont belong to this user", 404);
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
  const orderId = req.params.orderId
  const order = await Order.findByPk(orderId)
  if (!order) {
    return next(new appError("There is no order with this id", 404))
  }
  const orderState = await OrderState.findOne({
    where: {
      order_id: orderId
    }
  })
  if (!orderState) {
    return next(new appError("There is no order state for this order"))
  }
  res.status(200).json({
    status: "success",
    data: orderState
  })
})
exports.getUserOrders = catchAsync(async (req, res, next) => {
  const orders = await Order.findAll({
    where: {
      user_id: req.params.userId
    },
    include: [
      {
        model : Address,
      },
      {
        model: OrderItem,
        include: [
          {
            model: Product, 
          },
        ],
      },
      {
        model: OrderState,
      },
    ],
  });

  res.status(200).json({
    status: "success",
    data: orders
  });
});

exports.recieveOrder = catchAsync(async (req, res, next) => {
  const orderId = req.params.orderId;

  // check if order doesn't exist
  const order = await Order.findByPk(orderId);
  if (!order) {
    return next(new appError("There is no order with this id", 404));
  }

  // find and update order state
  const orderState = await OrderState.findOne({
    where: {
      order_id: orderId,
    },
  });
  if (!orderState) {
    return next(new appError("There is no state for this order", 404));
  }
  if (orderState.state === "recieved") {
    return next(new appError("The order is already received", 400));
  }

  const transaction = await sequelize.transaction();

  try {
    // Use update within the transaction directly
    await OrderState.update(
      {
        state: "recieved",
        payment: true,
      },
      {
        where: {
          order_id: orderId,
        },
        transaction,
      }
    );

    await Payment.update(
      {
        state: true,
      },
      {
        where: {
          order_id: orderId,
        },
        transaction,
      }
    );

    // Commit the transaction if everything is successful
    await transaction.commit();

    res.status(200).json({
      status: "success",
      message: "Order received successfully",
    });
  } catch (err) {
    // If any error occurs, rollback the transaction
    await transaction.rollback();
    next(err);
  }
});


exports.deleteFromOrder = catchAsync(async (req, res, next) => {
  const orderId = req.params.orderId;
  const orderItemIds = req.params.orderItemIds.split(",");
  const order = await Order.findOne({
    where: {
      id: orderId,
      user_id: req.user
    },
    include: {
      model: OrderState,
    },
  });

  if (!order) {
    return next(new appError("There is no order with this id or dont belong to this user ", 404));
  }

  if (order.OrderState.state === "recieved") {
    return next(new appError("Order is received, can't delete from it", 400));
  }

  const transaction = await sequelize.transaction();

  try {
    let total = order.total;

    const orderItems = await OrderItem.findAll({
      where: {
        id: {
          [Op.in]: orderItemIds,
        },
        order_id: orderId,
      },
      transaction, // Pass the transaction to ensure atomicity
    });

    if (orderItems.length === 0) {
      return next(new appError("There is no order items related to this order", 404));
    }

    for (const orderItem of orderItems) {
      total -= orderItem.total_cost;
      await orderItem.destroy({ transaction });
    }
    if (total == 0) {
      await order.destroy({ transaction })
    }
    else {
      order.total = total;
      await order.save({ transaction });
    }

    // Commit the transaction if everything is successful
    await transaction.commit();

    res.status(200).json({
      status: "success",
      message: "OrderItem delete successfully"
    });
  } catch (error) {
    // If any error occurs, rollback the transaction
    await transaction.rollback();
    next(error);
  }
});

exports.getOrdersAddressForUser = catchAsync(async (req, res, next) => {
  const userId = req.user;
  const user = await User.findByPk(userId);
  if (!user) {
    return next(new appError("There is no user with this id", 404));
  }
  const addresses = await Order.findAll({
    where: {
      user_id: userId
    },
    attributes: ['addressInDetails'],
    include: {
      model: Address,
    }
  })
  res.status(200).json({
    status: "success",
    data: addresses
  })
})


exports.getAllOrders = handlerFactory.getAll(Order)

// functions 
async function createOrder(userId, cart, transaction, addressInDetails, addressId) {
  return Order.create(
    {
      user_id: userId,
      address_id: addressId || cart.User.address_id,
      total: 0,
      addressInDetails
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

