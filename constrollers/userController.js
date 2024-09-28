const bcrypt = require("bcrypt");
const appError = require("../utils/appError");
const sendEmail = require("../utils/sendEmail");
const catchAsync = require("../utils/catchAsync");
const handlerFactory = require("./handlerFactory");

const { Auth,
  User,
} = require("../models/asc2.js")


exports.getUsersInAddress = catchAsync(async (req, res, next) => {
  const addressId = req.params.addressId;
  const address = await Address.findByPk(addressId);

  if (!address) {
    return next(new appError("No address found with this ID", 404));
  }

  const users = await User.findAll({
    where: {
      address_id: addressId,
    },
  });

  res.status(200).json({
    status: "success",
    data: users,
  });
});

exports.getMe = catchAsync(async (req, res, next) => {
  req.params.id = req.user;
  next();
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  let user = await User.findByPk(req.user, { include: Auth });
  const auth = user.Auth;

  const isPasswordMatch = await bcrypt.compare(req.body.currentPassword, auth.password);

  if (!isPasswordMatch) {
    return next(new appError("Incorrect password", 401));
  }

  auth.password = await bcrypt.hash(req.body.newPassword, 10);
  await auth.save();

  res.status(200).json({
    status: "success",
    message: "Password updated successfully",
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  const { user, body } = req;

  if (body.password) {
    return next(new appError("Cannot update password from here", 400));
  }

  const updatedFields = ['user_name', 'email', 'address_id', 'phone_number'];

  const updatedObject = updatedFields.reduce((obj, field) => {
    if (body[field]) {
      obj[field] = body[field];
    }
    return obj;
  }, {});

  const [rowsUpdated] = await User.update(updatedObject, {
    where: { id: user },
  });

  if (rowsUpdated === 0) {
    return next(new appError("No user found with this ID", 404));
  }

  res.status(200).json({
    status: "success",
    message: 'Profile updated successfully',
  });
});

exports.updateUser = handlerFactory.updateOne(User);
exports.getUser = handlerFactory.getOne(User);
exports.deleteUser = handlerFactory.deleteOne(User);
exports.getAllUsers = handlerFactory.getAll(User);
