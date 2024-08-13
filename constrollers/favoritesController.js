const catchAsync = require("../utils/catchAsync");
const appError = require("../utils/appError");

const {
  Product,
  User,
  UserFavorites} = require("../models/asc2.js")

exports.getUserFavorites = catchAsync(async (req, res, next) => {
  const products = await Product.findAll({
    include: [
      {
        model: User,
        where: { id: req.user },
        attributes: [],
        through: {
          UserFavorites,
          attributes: [] // Exclude details from the through table (UserFavorites)
        }
      }
    ]
  });
  res.status(200).json({
    status: "success",
    data: {
      products
    }
  })
})

exports.addProductToFavorites = catchAsync(async (req, res, next) => {
  const  product_id  = req.params.productId
  const user_id = req.user
  let userFavorites = await UserFavorites.findOne({ 
    where: { user_id: user_id, product_id: product_id }
  })
  console.log(userFavorites)
  if (userFavorites) {
    return next(new appError("product already in favorites", 400))
  }
  userFavorites = await UserFavorites.create({ user_id, product_id })
  res.status(201).json({
    status: "success",
    data: {
      userFavorites
    }
  })
})

exports.deleteFromFavorites = catchAsync(async (req, res, next) => {
  const  product_id  = req.params.productId
  const user_id = req.user
  let userFavorites = await UserFavorites.findOne({ 
    where: { user_id: user_id, product_id: product_id }
  })
  if (!userFavorites) {
    return next(new appError("product not in favorites", 400))
  }
  await userFavorites.destroy()
  res.status(200).json({
    status: "success",
    data: null
  })
})