const catchAsync = require("../utils/catchAsync");
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client('473650472727-mhmsu3u8lcqd74v79gobgbb3sovj2u29.apps.googleusercontent.com');
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const appError = require("../utils/appError");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { promisify } = require("util");
const sequelize = require("../sequelize")
const {
  Cart
} = require("../models/asc2.js")
// const { User, Auth } = require("../models/asc2.js");
const Auth = require("../models/authModel");
const User = require("../models/userModel");
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
    const verificationLink = `https://e-commerce-api-jwe4.onrender.com/api/v1/auths/verify?token=${verificationToken}&email=${email}`;

    // Define the HTML content for the email
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 5px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #4CAF50;">Welcome to Our E-Commerce Platform!</h2>
            <p>Hi,</p>
            <p>Thank you for registering with us. Please click the button below to verify your email address. This verification link is valid for 10 minutes.</p>
            
            <a href="${verificationLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">
              Verify Email
            </a>
            
            <p>If the button above doesn't work, copy and paste the following link into your browser:</p>
            <p><a href="${verificationLink}" style="color: #4CAF50;">${verificationLink}</a></p>
            
            <hr style="border: 1px solid #f0f0f0; margin-top: 20px;">
            <p style="font-size: 12px; color: #888;">If you did not create an account, please ignore this email.</p>
            <p style="font-size: 12px; color: #888;">&copy; 2024 E-Commerce Platform. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    // Send the email
    await sendEmail({
      email: user.email,
      subject: 'Verify your email (for 10 minutes)',
      html: htmlContent,  // Use the HTML content here
    });

    res.status(200).json({
      status: "success",
      message: 'Verification email sent successfully.',
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
  // Extract the token and email from the query parameters
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

  // Create the HTML response
  const htmlResponse = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verified</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  background-color: #f4f4f4;
                  text-align: center;
                  padding: 50px;
              }
              h1 {
                  color: #4CAF50;
              }
              p {
                  color: #555;
              }
              .button {
                  display: inline-block;
                  padding: 10px 20px;
                  margin-top: 20px;
                  background-color: #4CAF50;
                  color: white;
                  text-decoration: none;
                  border-radius: 5px;
              }
          </style>
      </head>
      <body>
          <h1>Email Verified Successfully!</h1>
          <p>Thank you for verifying your email. You can now return to the app.</p>
      </body>
      </html>
  `;

  // Send the HTML response
  res.status(200).send(htmlResponse);
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
  const auth = Auth.findOne({
    where: {
      user_id: user.id,
    }});
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
    const verificationLink = `https://e-commerce-api-jwe4.onrender.com/api/v1/auths/verify?token=${verificationToken}&email=${user.email}`;

    // Define the HTML content for the email
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 5px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #4CAF50;">Welcome to Our E-Commerce Platform!</h2>
            <p>Hi,</p>
            <p>Thank you for registering with us. Please click the button below to verify your email address. This verification link is valid for 10 minutes.</p>
            
            <a href="${verificationLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">
              Verify Email
            </a>
            
            <p>If the button above doesn't work, copy and paste the following link into your browser:</p>
            <p><a href="${verificationLink}" style="color: #4CAF50;">${verificationLink}</a></p>
            
            <hr style="border: 1px solid #f0f0f0; margin-top: 20px;">
            <p style="font-size: 12px; color: #888;">If you did not create an account, please ignore this email.</p>
            <p style="font-size: 12px; color: #888;">&copy; 2024 E-Commerce Platform. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    // Send the email
    await sendEmail({
      email: user.email,
      subject: 'Verify your email (for 10 minutes)',
      html: htmlContent,  // Use the HTML content here
    });

    res.status(200).json({
      status: "success",
      message: 'Verification email sent successfully.',
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
exports.optionalAuth = catchAsync(async (req, res, next) => {
  let token = req.headers?.authorization;

  if (token && token.startsWith("Bearer")) {
    token = token.split(" ")[1];

    try {
      var decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

      const user = await User.findOne({
        where: { id: decoded.id },
        include: Auth,
      });

      if (user && user.Auth) {
        req.user = decoded.id; // Set the user in the request if authenticated
      }
    } catch (err) {
      // Token is invalid or can't be verified, ignore and continue as unauthenticated
    }
  }

  next(); // Always proceed, even if user is not authenticated
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
    const verificationLink = `https://e-commerce-api-jwe4.onrender.com/api/v1/auths//resetPassword/${passwordResetToken}`; // change to reset password link
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

exports.isVerified = catchAsync(async (req, res, next) => {
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

  if (!auth) {
    return next(new appError("No auth found for this user", 404));
  }

  if (!auth.isVerified) {
    return next(new appError("User is not verified", 403));
  }

  res.status(200).json({
    status: "success",
    message: "User is verified",
  });
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



exports.googleSignin = async (req, res, next) => {
  const { token } = req.body;

  try {
    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: '473650472727-mhmsu3u8lcqd74v79gobgbb3sovj2u29.apps.googleusercontent.com',
    });

    const googleUser = ticket.getPayload();

    // Find or create user in your database
    let user = await findOrCreateUser(googleUser);
    createAndSendToken(user, null, 200, res)

  }
  catch (err) {
    res.send("error in OAuth2")
  }
}

async function findOrCreateUser(googleUser) {
  const { email, name } = googleUser;

  // Find user in your database
  let user = await User.findOne({ where: { email } });

  // If no user exists, create a new one
  if (!user) {
    user = await User.create({ email, name });
  }

  return user;
}