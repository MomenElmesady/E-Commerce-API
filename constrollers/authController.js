const User = require("../models/userModel")
const Auth = require("../models/authModel")
const catchAsync = require("../utils/catchAsync")
const sendEmail = require("../utils/sendEmail")
const crypto = require("crypto")
const appError = require("../utils/appError")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const { promisify } = require("util")

const createToken = async (id, expiresIn) => {
  return await jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn })
}

const createAndSendToken = async (user, auth, statusCode, res) => {
  const refreshToken = await createToken(auth.user_id, '30d')

  res.cookie("refreshToken", refreshToken, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 })
  const accessToken = await createToken(auth.user_id, '5m')
  let userResponse = {
    id: user.id,
    user_name: user.user_name,
    email: user.email,
    user_role: user.user_role,
    phone_number: user.phone_number,
    address_id: user.address_id
  }
  res.status(statusCode).json({
    status: "success",
    data: {
      user: userResponse,
      accessToken
    }
  })
}

exports.signUp = catchAsync(async (req, res, next) => {
  const { user_name, email, password, address_id, phone_number } = req.body
  let role = req.role || "user"
  const user = await User.create({ user_name, email, role, address_id, phone_number })
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const auth = await Auth.create({
    user_id: user.id,
    password,
    verificationToken: crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex')
  })
  try {
    const verificationLink = `localhost:1020/api/v1/auths/verify//${verificationToken}`;
    const text = `Click the following link to verify your email: ${verificationLink}`;

    await sendEmail({ email: user.email, subject: `verify your email (for 10 minutes)`, token: text })
    res.status(200).json({
      status: "success",
      message: "token send to email"
    })
  } catch (err) {
    auth.verificationToken = null
    await auth.save()
    res.status(500).json({
      status: "fail",
      message: "cant send token",
      err: err.message
    })
  }
})

exports.verify = catchAsync(async (req, res, next) => {
  let token = req.params.token
  const user = await User.findOne({
    where: {
      email: req.body?.email
    },
    include: Auth
  })

  const auth = user.Auth

  token = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex')
  if (token != auth.verificationToken) {
    return next(new appError("token dont match the correct token", 401))
  }
  auth.isVerified = true
  auth.verificationToken = null
  auth.save()
  createAndSendToken(user, auth, 200, res)
})

exports.sendVerificationToken = catchAsync(async (req, res, next) => {
  const user = await User.findOne({
    where: {
      email: req.body?.email
    },
    include: Auth
  })
  if (!user) {
    return next(new appError("Cant find this email", 404))
  }
  const auth = user.Auth
  const verificationToken = crypto.randomBytes(32).toString('hex');
  auth.verificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex')
  await auth.save()
  try {
    await sendEmail({ email: user.email, subject: `verify your email (for 10 minutes)`, token: verificationToken })
    res.status(200).json({
      status: "success",
      message: "token send to email"
    })
  } catch (err) {
    auth.verificationToken = null
    await auth.save()
    res.status(500).json({
      status: "fail",
      message: "cant send token",
      err: err.message
    })
  }
})

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body

  if (!email) {
    return (next(new appError("should pass email", 400)))
  }
  const user = await User.findOne({
    where: {
      email
    },
    include: Auth
  })
  if (!user) {
    return next(new appError("There is no user with this email", 404))
  }
  if (user.user_role == "manager") {
    const accessToken = await createToken(user.id)
    let userResponse = {
      id: user.id,
      user_name: user.user_name,
      email: user.email,
      user_role: user.user_role,
      phone_number: user.phone_number,
      address_id: user.address_id
    }
    return res.status(200).json({
      status: "success",
      data: {
        user: userResponse,
        accessToken
      }
    })
  }
  if (!password) {
    return (next(new appError("should pass password", 400)))
  }

  const auth = user.Auth
  const isPasswordMatch = await bcrypt.compare(password, auth.password)
  if (!isPasswordMatch) {
    return next(new appError("Wrong password", 401))
  }
  createAndSendToken(user, auth, 200, res)
})

exports.logout = catchAsync(async (req, res, next) => {
  let refreshToken = req.cookies?.refreshToken
  if (!refreshToken) {
    return next(new appError("There is no refreshToken in cookie", 400))
  }
  const user = await User.findOne({
    where:
    {
      email: req.body.email
    },
    include: Auth
  })
  if (!user) {
    return next(new appError("Cant find user with this email", 404))
  }
  res.clearCookie('refreshToken');

  res.status(200).json({
    status: "success",
    message: "LoggedOut successfully"
  })
})

exports.refreshToken = catchAsync(async (req, res, next) => {
  let refreshToken = req.cookies.refreshToken
  if (!refreshToken) {
    return next(new appError("There is no refreshToken in cookie", 400))
  }
  let auth = await Auth.findOne({
    where: {
      refreshToken
    }
  })
  if (!auth) {
    return next(new appError("There is no user with this token", 404))
  }
  try {
    // The purpose of this verification is to ensure that the refresh token is valid and has not been tampered with.     
    await promisify(jwt.verify)(auth?.refreshToken, process.env.JWT_SECRET)
  } catch (err) {
    return next(new appError("invalid token", 401))
  }
  const accessToken = await createToken(auth.user_id, "5m")
  res.status(200).json({ accessToken })
})


exports.protect = catchAsync(async (req, res, next) => {
  let token = req.headers?.authorization
  if (!token || !token.startsWith("Bearer")) {
    return next(new appError("There is no token in bearer auth!", 401))
  }
  token = token.split(" ")[1]
  // for more security 
  if (!req.cookies.refreshToken){
    return next(new appError("There is no refreshToken in cookie!",401))
  }
  try {
    var decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
  } catch (err) {
    return next(new appError("Cant verify token", 401))
  }
  const user = await User.findOne({
    where: {
      id: decoded.id
    },
    include: Auth
  })
  if (!user) {
    return next(new appError("There is no user with this id", 404))
  }
  if (user.user_role == "manager") {
    req.user = decoded.id
    return next()
  }
  const auth = user.Auth
  // for development testing 
  if (!auth) {
    return next(new appError("Cant find auth for this user", 404))
  }

  req.user = decoded.id
  next()
})


exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({
    where: {
      email: req.body?.email
    },
    include: Auth
  })
  if (!user) {
    return next(new appError("cant find user", 404))
  }
  const auth = user.Auth

  const passwordResetToken = crypto.randomBytes(32).toString('hex');
  auth.passwordResetToken = crypto
    .createHash('sha256')
    .update(passwordResetToken)
    .digest('hex')
  await auth.save()
  try {
    const verificationLink = `localhost:1020/api/v1/auths/verify//${passwordResetToken}`;
    const text = `Click the following link to verify your email: ${verificationLink}`;

    await sendEmail({ email: user.email, subject: `verify your email (for 10 minutes)`, token: text })
    res.status(200).json({
      status: "success",
      message: "token send to email"
    })
    res.status(200).json({
      status: "success",
      message: "token send to email"
    })
  } catch (err) {
    auth.verificationToken = null
    await auth.save()
    res.status(500).json({
      status: "fail",
      message: "cant send token",
      err: err.message
    })
  }
})

exports.resetPassword = catchAsync(async (req, res, next) => {
  let token = req.params?.token
  if (!token) {
    return next(new appError("There is no token send", 400))
  }
  token = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex')
  const user = await User.findOne({
    where: {
      email: req.body.email
    },
    include: Auth
  })
  if (!user) {
    return next(new appError("There is no user with this email", 404))
  }
  const auth = user.Auth
  if (token != auth.passwordResetToken) {
    auth.passwordResetToken = null
    auth.save()
    return next(new appError("token doesnt match user token!", 401))
  }
  auth.passwordResetToken = null
  auth.password = await bcrypt.hash(req.body.password, 12)
  auth.save()

  createAndSendToken(user, auth, 200, res)
})


exports.allowedTo = (...roles) => {
  return async (req, res, next) => {
    const user = await User.findByPk(req.user)
    if (roles.includes(user.user_role))
      next()
    else
      return next(new appError("This route dont allowed for this user!", 403))
  }
}