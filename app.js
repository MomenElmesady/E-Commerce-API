const express = require("express")
const dotenv = require("dotenv")
dotenv.config({ path: "./.env" })
const path = require("path")
const cookieParser = require('cookie-parser');
const errorController = require("./constrollers/errorController.js")
const swaggerUi = require("swagger-ui-express")
const swaggerDocument = require("./swagger.json")
const sequelize = require('./sequelize');

const { Auth,
  Cart,
  CartItem,
  Category,
  Order,
  OrderItem,
  OrderState,
  Product,
  User,
  UserFavorites,
  Address,
  ProductReview, Payment } = require("./models/asc2.js")

// sequelize.sync({ force: false }).then(() => {
//   console.log("Database & tables created!");
// }).catch(error => {
//   console.error('Unable to create tables, shutting down...', error);
// });

// security 
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const hpp = require('hpp');
const xss = require('xss-clean');
const cors = require("cors")
// routers
const addressRouter = require("./routes/addressRouter")
const userRouter = require("./routes/userRouter")
const authRouter = require("./routes/authRouter")
const categoryRouter = require("./routes/categoryRouter")
const productRouter = require("./routes/productRouter")
const cartRouter = require("./routes/cartRouter")
const orderRouter = require("./routes/orderRouter")
const reviewRouter = require("./routes/reviewRouter");
const favoriteRouter = require("./routes/userFavoritesRouter.js");
const appError = require("./utils/appError.js");

const app = express();
app.set('trust proxy', 1);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument))

app.use(cors())
// Apply rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

app.use('/', limiter);
app.use(helmet());
app.use(hpp());
app.use(xss());

app.use(express.json());
app.use('/api/v1/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(cookieParser());

app.use("/api/v1/addresses", addressRouter)
app.use("/api/v1/users", userRouter)
app.use("/api/v1/auths", authRouter)
app.use("/api/v1/categories", categoryRouter)
app.use("/api/v1/products", productRouter)
app.use("/api/v1/carts", cartRouter)
app.use("/api/v1/orders", orderRouter)
app.use("/api/v1/reviews", reviewRouter)
app.use("/api/v1/favorites", favoriteRouter)


app.all("*", (req, res, next) => {
  next(new appError(`Can't find ${req.originalUrl} on this server!`, 404));
})

app.use(errorController)

// sequelize.sync({alter: true})
// .then(() => {
//   console.log('Database & tables created!');
// });

app.listen(1020, () => {
  console.log("app Running on port 1020")
})

