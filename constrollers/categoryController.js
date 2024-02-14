const Category = require("../models/categoryModel")
const handlerFactory = require("./handlerFactory")

// CRUD Operations 
exports.updateCategory = handlerFactory.updateOne(Category)
exports.getAllCategories = handlerFactory.getAll(Category)
exports.createCategory = handlerFactory.createOne(Category)
exports.getCategory = handlerFactory.getOne(Category)
exports.deleteCategory = handlerFactory.deleteOne(Category)