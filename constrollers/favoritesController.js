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

exports.addOrDeleteProductToFavorites = catchAsync(async (req, res, next) => {
  const  product_id  = req.params.productId
  const user_id = req.user
  let userFavorites = await UserFavorites.findOne({ 
    where: { user_id: user_id, product_id: product_id }
  })
  if (userFavorites) {
    await userFavorites.destroy()
    return res.status(200).json({
      status: "success",
      message: "product removed from favorites",
      data: null
    })
  }
  userFavorites = await UserFavorites.create({ user_id, product_id })
  res.status(201).json({
    status: "success",
    data: {
      userFavorites
    }
  })
})
