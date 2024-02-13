const User = require("../models/userModel")
const catchAsync = require("../utils/catchAsync")
const handlerFactory = require("./handlerFactory")

exports.getUsersInAddress = catchAsync(async (req, res, next) => {
  const users = await User.findAll({
    where:
    {
      address_id: req.params.addressId
    }
  })
  res.status(200).json(users)
})

exports.createUser = handlerFactory.createOne(User)
exports.getUser = handlerFactory.getOne(User)
exports.deleteUser = handlerFactory.deleteOne(User)
exports.getAllUsers = handlerFactory.getAll(User)
