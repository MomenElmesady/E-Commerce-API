const express = require("express")
const dotenv = require("dotenv")
dotenv.config({ path: "./.env" })
const path = require("path")
const cookieParser = require('cookie-parser');
const errorController = require("./constrollers/errorController.js")
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
const reviewRouter = require("./routes/reviewRouter")

const app = express();

app.use(cors())
// Apply rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

app.use('/', limiter);
app.use(helmet());
app.use(hpp());
app.use(xss());

app.use(express.json());
app.use('/api/v1/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(cookieParser());

app.use("/api/v1/address",addressRouter)
app.use("/api/v1/user",userRouter)
app.use("/api/v1/auth",authRouter)
app.use("/api/v1/category",categoryRouter)
app.use("/api/v1/product",productRouter)
app.use("/api/v1/cart",cartRouter)
app.use("/api/v1/order",orderRouter)
app.use("/api/v1/review",reviewRouter)

app.all("*",(req,res,next)=>{
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
})

app.use(errorController)

app.listen(1020,()=>{
  console.log("app Running on port 1020")
})

