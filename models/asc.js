const User = require('./userModel');
const Address = require('./addressModel');
const Cart = require('./cartModel');
const CartItem = require('./cartItemModel');
const Product = require('./productModel');
const Category = require('./categoryModel');
const ProductReview = require('./productReviewModel');
const OrderItem = require('./orderItemModel');
const Order = require('./orderModel');
const OrderState = require('./orderStateModel');
const Payment = require('./paymentModel');
const Auth = require('./authModel');

const sequelize = require('../sequelize');

Address.hasMany(User, { foreignKey: "address_id" })
User.belongsTo(Address, { foreignKey: "address_id" })

User.hasOne(Cart, { foreignKey: "user_id" })
Cart.belongsTo(User, { foreignKey: "user_id" })

User.hasMany(Order, { foreignKey: "user_id" })
Order.belongsTo(User, { foreignKey: "user_id" })

User.hasMany(Payment, { foreignKey: "user_id" })
Payment.belongsTo(User, { foreignKey: "user_id" })

User.hasMany(ProductReview, { foreignKey: "user_id" })
ProductReview.belongsTo(User, { foreignKey: "user_id" })

Cart.hasMany(CartItem, { foreignKey: "cart_id" })
CartItem.belongsTo(Cart, { foreignKey: "cart_id" })

Product.hasMany(CartItem, { foreignKey: "product_id" })
CartItem.belongsTo(Product, { foreignKey: "product_id" })

Category.hasMany(Product, { foreignKey: "category_id" })
Product.belongsTo(Category, { foreignKey: "category_id" })

Product.hasMany(ProductReview, { foreignKey: "product_id" })
ProductReview.belongsTo(Product, { foreignKey: "product_id" })

Address.hasMany(Order, { foreignKey: "address_id" })
Order.belongsTo(Address, { foreignKey: "address_id" })

Order.hasOne(OrderState, { foreignKey: "order_id" })
OrderState.belongsTo(Order, { foreignKey: "order_id" })

Order.hasOne(Payment, { foreignKey: "order_id" })
Payment.belongsTo(Order, { foreignKey: "order_id" })

Product.hasMany(OrderItem, { foreignKey: "product_id" })
OrderItem.belongsTo(Product, { foreignKey: "product_id" })


Order.hasMany(OrderItem,{foreignKey: "order_id"})
OrderItem.belongsTo(Order,{foreignKey: "order_id"})




sequelize.sync({ alter: true }).then(() => {
  console.log('Table created!');
}).catch(err => {
  console.error('Error creating table:', err);
});
