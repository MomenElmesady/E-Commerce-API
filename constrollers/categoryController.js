const handlerFactory = require("./handlerFactory")
const { Auth,
  Cart,
  CartItem,
  Category,
  Order,
  OrderItem,
  OrderState,
  Product,
  User,
  UserFavorites } = require("../models/asc2.js")

// CRUD Operations 
exports.updateCategory = handlerFactory.updateOne(Category)
exports.getAllCategories = handlerFactory.getAll(Category)
exports.createCategory = handlerFactory.createOne(Category)
exports.getCategory = handlerFactory.getOne(Category)
exports.deleteCategory = handlerFactory.deleteOne(Category)

exports.addDefaultPhoto = catchAsync(async (req, res, next) => {
  req.body.photo = req.file?.filename || "default.png";
  next();
});