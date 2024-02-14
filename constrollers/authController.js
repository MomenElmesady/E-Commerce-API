const User = require("../models/userModel")
const Auth = require("../models/authModel")
const catchAsync = require("../utils/catchAsync")
const sendEmail = require("../utils/sendEmail")
const crypto = require("crypto")
const appError = require("../utils/appError")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const { promisify } = require("util")

const createToken = async (id) => {
  return await jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN })
}

const createAndSendToken = async (user, auth, statusCode, res) => {
  const refreshToken = await createToken(auth.user_id)
  auth.refreshToken = refreshToken
  auth.save()
  res.cookie("refreshToken", refreshToken, { httpOnly: true, maxAge: 900000 })
  const accessToken = await createToken(auth.user_id)
  res.status(statusCode).json({ user, accessToken })
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
    await sendEmail({ email: user.email, subject: `verify your email (for 10 minutes)`, token: verificationToken })
    res.status(200).json({
      status: "success",
      message: "token send to email"
    })
  } catch (err) {
    auth.verificationToken = null
    await auth.save()
    res.status(400).json({
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
    return next(new appError("token dont match the correct token", 404))
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
    res.status(400).json({
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
    return next(new appError("there is no user with this email"))
  }
  if (user.user_role == "manager"){
    const accessToken = await createToken(user.id)
    res.status(200).json({ user, accessToken })
  }
  if (!password) {
    return (next(new appError("should pass password", 400)))
  }

  const auth = user.Auth
  const isPasswordMatch = await bcrypt.compare(password, auth.password)
  if (!isPasswordMatch) {
    return next(new appError("Wrong password", 400))
  }
  createAndSendToken(user, auth, 200, res)
})

exports.logout = catchAsync(async (req, res, next) => {
  let refreshToken = res.cookies?.refreshToken
  if (!refreshToken) {
    return next(new appError("there is no refreshToken in cookie", 404))
  }
  const user = await User.findOne({
    where:
    {
      email: req.body.email
    },
    include: Auth
  })
  const auth = user.Auth
  if (!auth.refreshToken) {
    return next(new appError("the user dont have refresh token", 400))
  }
  if (refreshToken != auth.refreshToken) {
    return next(new appError("Invalid Token", 400))
  }
  auth.refreshToken = ""
  await auth.save()

  res.cookie("refreshToken", false, {
    expired: new Date(Date.now() + 5 * 1000),
    httpOnly: true
  })
  res.status(200).json({
    status: "success"
  })
})

exports.refreshToken = catchAsync(async (req, res, next) => {
  let refreshToken = res.cookies?.refreshToken
  if (!refreshToken) {
    return next(new appError("there is no refreshToken in cookie", 404))
  }
  const auth = await Quth.findOne({
    where: {
      refreshToken
    }
  })
  if (!auth) {
    return next(new appError("there is no user with this token", 400))
  }
  try {
    // The purpose of this verification is to ensure that the refresh token is valid and has not been tampered with.     
    await promisify(jwt.verify)(auth?.refreshToken, process.env.JWT_SECRET)
  } catch (err) {
    return next(new appError("invalid token", 400))
  }
  const accessToken = await createToken(auth.id)
  res.status(200).json({ accessToken })
})


exports.protect = catchAsync(async (req, res, next) => {
  let token = req.headers?.authorization
  if (!token || !token.startsWith("Bearer")) {
    return next(new appError("There is no token in bearer auth!", 400))
  }
  token = token.split(" ")[1]

  if (token === "false") {
    token = false
  }

  try {
    var decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
  } catch (err) {
    return next(new appError("cant verify token", 400))
  }
  const user = await User.findOne({
    where: {
      id: decoded.id
    },
    include: Auth
  })
  if (user.user_role == "manager"){
    req.user = decoded.id
    return next()
  }
  const auth = user.Auth

  if (!auth) {
    return next(new appError("Cant find this user", 400))
  }

  if (!auth.refreshToken) {
    return next(new appError("The user dont logged in", 400))
  }

  req.user = decoded.id
  next()

})


exports.forgrtPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({
    where: {
      email: req.body?.email
    },
    include: Auth
  })
  if (!user) {
    return next(new appError("cant find user", 400))
  }
  const auth = user.Auth

  const passwordResetToken = crypto.randomBytes(32).toString('hex');
  auth.passwordResetToken = crypto
    .createHash('sha256')
    .update(passwordResetToken)
    .digest('hex')
  await auth.save()
  try {
    await sendEmail({ email: user.email, subject: `verify your email (for 10 minutes)`, token: passwordResetToken })
    res.status(200).json({
      status: "success",
      message: "token send to email"
    })
  } catch (err) {
    auth.verificationToken = null
    await auth.save()
    res.status(400).json({
      status: "fail",
      message: "cant send token",
      err: err.message
    })
  }
})

exports.resetPassword = catchAsync(async (req, res, next) => {
  let token = req.params?.token
  if (!token) {
    return next(new appError("there is no token send", 400))
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
  const auth = user.Auth
  if (token != auth.passwordResetToken) {
    auth.passwordResetToken = null
    auth.save()
    return next(new appError("token doesnt match user token!", 400))
  }
  auth.passwordResetToken = null
  auth.password = await bcrypt.hash(req.body.password, 12)
  auth.save()

  createAndSendToken(user, auth, 200, res)
})


exports.test = catchAsync(async (req, res) => {
  const user = await User.findOne({
    where: {
      email: "momen3@gmail.com"
    }, include: Auth
  })
  res.json(user.auth)
})

exports.allowedTo = (...roles) => {
  return async (req, res, next) => {
    const user = await User.findByPk(req.user)
    if (roles.includes(user.user_role))
      next()
    else
      return next(new appError("This route dont allowed for this user!", 400))
  }
}