const Category = require("../models/categoryModel")
const catchAsync = require("../utils/catchAsync")

exports.createCategory = catchAsync(async (req, res, next) => {
  const category = await Category.create(req.body)
  res.status(200).json(category)
})

exports.getAllCategories = catchAsync(async (req, res, next) => {
  const categories = await Category.findAll()
  res.status(200).json(categories)
})

exports.getCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findByPk(req.params.categoryId)
  res.status(200).json(category)
})

exports.deleteCategory = catchAsync(async (req, res, next) => {
  await Category.destroy({
    where: {
      id: req.params.categoryId
    }
  })
  res.status(200).json({
    message: "deleted successfully"
  })
})

exports.updateCategory = catchAsync(async (req, res, next) => {
  const category = await Category.update(req.body, {
    where: {
      id: req.params.categoryId
    }
  })
  res.status(200).json(category)
})

