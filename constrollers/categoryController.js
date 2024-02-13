const Category = require("../models/categoryModel")
const catchAsync = require("../utils/catchAsync")
const handlerFactory = require("./handlerFactory")

exports.updateCategory = handlerFactory.updateOne(Category)


exports.getAllCategories = handlerFactory.getAll(Category)

exports.createCategory = handlerFactory.createOne(Category)
exports.getCategory = handlerFactory.getOne(Category)

exports.deleteCategory = handlerFactory.deleteOne(Category)