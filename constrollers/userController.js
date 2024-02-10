const User = require("../models/userModel")
const catchAsync = require("../utils/catchAsync")

exports.createUser = catchAsync(async (req, res, next) => {
  const user = await User.create(req.body)
  res.status(200).json(user)
})

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.findAll()
  res.status(200).json(users)
})

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findOne({
    where: {
      id: req.params.userId
    }
  })
  res.status(200).json(user)
})

exports.getUsersInAddress = catchAsync(async (req, res, next) => {
  const users = await User.findAll({
    where:
    {
      address_id: req.params.addressId
    }
  })
  res.status(200).json(users)
})

