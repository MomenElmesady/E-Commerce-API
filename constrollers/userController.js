const Address = require("../models/addressModel")
const User = require("../models/userModel")
const appError = require("../utils/appError")
const catchAsync = require("../utils/catchAsync")
const handlerFactory = require("./handlerFactory")

exports.getUsersInAddress = catchAsync(async (req, res, next) => {
  const addressId = req.params.addressId
  const address = await Address.findByPk(addressId)
  if (!address){
    return next(new appError("There is no address with this id",404))
  }
  const users = await User.findAll({
    where:
    {
      address_id: addressId
    }
  })
  res.status(200).json(users)
})

exports.updateUser = handlerFactory.updateOne(User)
exports.createUser = handlerFactory.createOne(User)
exports.getUser = handlerFactory.getOne(User)
exports.deleteUser = handlerFactory.deleteOne(User)
exports.getAllUsers = handlerFactory.getAll(User)
