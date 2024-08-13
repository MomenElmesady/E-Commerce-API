const catchAsync = require("../utils/catchAsync");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const appError = require("../utils/appError");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { promisify } = require("util");
const sequelize = require("../sequelize")
const { Auth,
  User,
  Cart
} = require("../models/asc2.js")


const createToken = async (id, expiresIn) => {
  return await jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn });
};

const createAndSendToken = async (user, auth, statusCode, res) => {
  const refreshToken = await createToken(auth.user_id, '30d');
  res.cookie("refreshToken", refreshToken, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 });
  auth.refreshToken = refreshToken;
  auth.save();

  const accessToken = await createToken(auth.user_id, '30d');
  let userResponse = {
    id: user.id,
    user_name: user.user_name,
    email: user.email,
    user_role: user.user_role,
    phone_number: user.phone_number,
    address_id: user.address_id,
  };

  res.status(statusCode).json({
    status: "success",
    data: {
      user: userResponse,
      accessToken,
    },
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  var { user_name, email, password, address_id, phone_number } = req.body;
  let user_role = req.body.user_role || "user";

  const transaction = await sequelize.transaction();
  try {
    var user = await User.create({ user_name, email, user_role, address_id, phone_number }, { transaction });
    await Cart.create({
      user_id: user.id
    }, { transaction })

    var verificationToken = crypto.randomBytes(32).toString('hex');
    var auth = await Auth.create({
      user_id: user.id,
      password,
      verificationToken: crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex'),
    }, {
      transaction
    });
    await transaction.commit();
  }
  catch (err) {
    await transaction.rollback();
    return next(new appError(err.message, 400));
  }

  try {
    const verificationLink = `localhost:1020/api/v1/auths/verify?token=${verificationToken}&email=${email}`;
    const text = `Click the following link to verify your email: ${verificationLink}`;
    // await sendEmail({ email: user.email, subject: `Verify your email (for 10 minutes)`, text });
    res.status(200).json({
      status: "success",
      link: verificationLink,
    });
  } catch (err) {
    auth.verificationToken = null;
    await auth.save();
    res.status(500).json({
      status: "fail",
      message: "Unable to send verification token",
      err: err.message,
    });
  }
});

exports.verify = catchAsync(async (req, res, next) => {
  // Extract the token from the request parameters
  const { token, email } = req.query;

  // Find the user by email and include the Auth model
  const user = await User.findOne({
    where: { email },
    include: Auth,
  });

  // If user is not found, return an error
  if (!user) {
    return next(new appError("User not found", 404));
  }

  const auth = user.Auth;

  // If auth is not found, return an error
  if (!auth) {
    return next(new appError("Authentication details not found", 404));
  }

  // Hash the token
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Check if the token matches the stored verification token
  if (hashedToken !== auth.verificationToken) {
    return next(new appError("Token does not match the correct token", 401));
  }

  // Update the verification status
  auth.isVerified = true;
  auth.verificationToken = null;

  // Save the auth model
  await auth.save();

  // Create and send the token
  createAndSendToken(user, auth, 200, res);
});

exports.sendVerificationToken = catchAsync(async (req, res, next) => {
  const user = await User.findOne({
    where: {
      email: req.body?.email,
    },
    include: Auth,
  });

  if (!user) {
    return next(new appError("Cannot find user with this email", 404));
  }

  const auth = user.Auth;
  if (auth.isVerified) {
    return next(new appError("User is already verified", 403))
  }
  const verificationToken = crypto.randomBytes(32).toString('hex');
  auth.verificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  await auth.save();

  try {
    const verificationLink = `localhost:1020/api/v1/auths/verify?token=${verificationToken}&email=${req.body?.email}`;
    const text = `Click the following link to verify your email: ${verificationLink}`;
    // await sendEmail({ email: user.email, subject: `Verify your email (for 10 minutes)`, text });
    res.status(200).json({
      status: "success",
      link: verificationLink
    });
  } catch (err) {
    auth.verificationToken = null;
    await auth.save();
    res.status(500).json({
      status: "fail",
      message: "Unable to send verification token",
      err: err.message,
    });
  }
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new appError("Must provide email and password", 400));
  }

  const user = await User.findOne({
    where: {
      email,
    },
    include: Auth,
  });

  if (!user) {
    return next(new appError("Incorrect Email or Password", 404));
  }

  const auth = user.Auth;
  if (!auth.isVerified) {
    return next(new appError("Verify the email", 403))
  }
  const isPasswordMatch = await bcrypt.compare(password, auth.password);

  if (!isPasswordMatch) {
    return next(new appError("Incorrect Email or Password", 401));
  }

  createAndSendToken(user, auth, 200, res);
});

exports.logout = catchAsync(async (req, res, next) => {
  let refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return next(new appError("No refreshToken found in cookie", 400));
  }

  const user = await User.findOne({
    where: {
      id: req.user,
    },
    include: Auth,
  });

  let auth = user.Auth;
  if (refreshToken !== auth.refreshToken) {
    return next(new appError("Incorrect refreshToken", 403));
  }
  auth.refreshToken = null
  auth.save()
  res.clearCookie('refreshToken');

  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
});

exports.refreshToken = catchAsync(async (req, res, next) => {
  let refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return next(new appError("No refreshToken found in cookie", 400));
  }

  let auth = await Auth.findOne({
    where: {
      refreshToken,
    },
  });

  if (!auth) {
    return next(new appError("No user found with this token", 404));
  }

  try {
    // Verify that the refresh token is valid and has not been tampered with.
    await promisify(jwt.verify)(auth?.refreshToken, process.env.JWT_SECRET);
  } catch (err) {
    return next(new appError("Invalid token", 401));
  }

  const accessToken = await createToken(auth.user_id, "5m");
  res.status(200).json({ accessToken });
});

exports.protect = catchAsync(async (req, res, next) => {
  let token = req.headers?.authorization;
  if (!token || !token.startsWith("Bearer")) {
    return next(new appError("No token in Bearer auth!", 401));
  }

  token = token.split(" ")[1];
  // if (!req.cookies.refreshToken) {
  //   return next(new appError("No refreshToken in cookie!", 401));
  // }
  // more security-> may compare it with the stored in db
  if (!req.cookies.refreshToken) {
    return next(new appError("No refreshToken found in cookie", 400))
  }

  try {
    var decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  } catch (err) {
    return next(new appError("Unable to verify token", 401));
  }

  const user = await User.findOne({
    where: {
      id: decoded.id,
    },
    include: Auth,
  });

  if (!user) {
    return next(new appError("No user found with this id", 404));
  }

  const auth = user.Auth;

  // For development testing
  if (!auth) {
    return next(new appError("Cannot find auth for this user", 404));
  }

  req.user = decoded.id;
  next();
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({
    where: {
      email: req.body?.email,
    },
    include: Auth,
  });

  if (!user) {
    return next(new appError("Cannot find user", 404));
  }

  const auth = user.Auth;

  const passwordResetToken = crypto.randomBytes(32).toString('hex');
  auth.passwordResetToken = crypto
    .createHash('sha256')
    .update(passwordResetToken)
    .digest('hex');

  await auth.save();

  try {
    const verificationLink = `localhost:1020/api/v1/auths//resetPassword/${passwordResetToken}`; // change to reset password link
    const text = `Click the following link to verify your email: ${verificationLink}`;
    await sendEmail({ email: user.email, subject: `Verify your email (for 10 minutes)`, text });
    res.status(200).json({
      status: "success",
      message: "Token sent to email",
    });
  } catch (err) {
    auth.verificationToken = null;
    await auth.save();
    res.status(500).json({
      status: "fail",
      message: "Unable to send token",
      err: err.message,
    });
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  let token = req.params?.token;

  if (!token) {
    return next(new appError("No token sent", 400));
  }

  token = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    where: {
      email: req.body.email,
    },
    include: Auth,
  });

  if (!user) {
    return next(new appError("No user found with this email", 404));
  }

  const auth = user.Auth;

  if (token !== auth.passwordResetToken) {
    auth.passwordResetToken = null;
    auth.save();
    return next(new appError("Token does not match user token", 401));
  }

  auth.passwordResetToken = null;
  auth.password = await bcrypt.hash(req.body.password, 12);
  auth.save();

  createAndSendToken(user, auth, 200, res);
});

exports.allowedTo = (...roles) => {
  return async (req, res, next) => {
    const user = await User.findByPk(req.user);

    if (roles.includes(user.user_role)) {
      next();
    } else {
      return next(new appError("This route is not allowed for this user", 403));
    }
  };
};

