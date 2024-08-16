const Auth = require("../models/authModel");
const Cart = require("./cartModel")
const CartItem = require("./cartItemModel")
const Category = require("./categoryModel")
const Order = require("./orderModel")
const OrderItem = require("./orderItemModel")
const OrderState = require("./orderStateModel")
const Product = require("./productModel")
const User = require("./userModel")
const UserFavorites = require("./userFavorites")
const Address = require("./addressModel")
const Review = require("./productReviewModel")
const Payment = require("./paymentModel")
const ProductReview = require("./productReviewModel")



Product.hasMany(CartItem, { foreignKey: "product_id" })
CartItem.belongsTo(Product, { foreignKey: "product_id" })

Cart.hasMany(CartItem, { foreignKey: "cart_id" })
CartItem.belongsTo(Cart, { foreignKey: "cart_id" })

Product.hasMany(OrderItem, { foreignKey: "product_id" })
OrderItem.belongsTo(Product, { foreignKey: "product_id" })

User.hasMany(Order, { foreignKey: "user_id" })
Order.belongsTo(User, { foreignKey: "user_id" })

Order.hasMany(OrderItem,{foreignKey: "order_id"})
OrderItem.belongsTo(Order,{foreignKey: "order_id"})


Order.hasOne(OrderState, { foreignKey: "order_id" })
OrderState.belongsTo(Order, { foreignKey: "order_id" })


Category.hasMany(Product, { foreignKey: "category_id" })
Product.belongsTo(Category, { foreignKey: "category_id" })

User.hasOne(Cart, { foreignKey: "user_id" })
Cart.belongsTo(User, { foreignKey: "user_id" })

User.hasOne(Auth, { foreignKey: "user_id" })
Auth.belongsTo(User, { foreignKey: "user_id" })

User.belongsToMany(Product, { through: 'UserFavorites', foreignKey: 'user_id' });
Product.belongsToMany(User, { through: 'UserFavorites', foreignKey: 'product_id' });

User.hasMany(Payment, { foreignKey: "user_id" })
Payment.belongsTo(User, { foreignKey: "user_id" })

Order.hasOne(Payment, { foreignKey: "order_id" })
Payment.belongsTo(Order, { foreignKey: "order_id" })

Address.hasMany(User, { foreignKey: "address_id" })
User.belongsTo(Address, { foreignKey: "address_id" })

Order.belongsTo(Address, { foreignKey: "address_id" })
Address.hasMany(Order, { foreignKey: "address_id" })

ProductReview.belongsTo(Product, { foreignKey: 'product_id' });
Product.hasMany(ProductReview, { foreignKey: 'product_id' });

ProductReview.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(ProductReview, { foreignKey: 'user_id' });


module.exports = {
    Auth,
    Cart,
    CartItem,
    Category,
    Order,
    OrderItem,
    OrderState,
    Product,
    User,
    Address,
    Review,
    Payment,
    ProductReview,
    UserFavorites
}