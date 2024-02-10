const express = require("express")
const addressRouter = require("./routes/addressRouter")
const userRouter = require("./routes/userRouter")
const cookieParser = require('cookie-parser');
const authRouter = require("./routes/authRouter")
const categoryRouter = require("./routes/categoryRouter")
const productRouter = require("./routes/productRouter")
const cartRouter = require("./routes/cartRouter")
const orderRouter = require("./routes/orderRouter")
const dotenv = require("dotenv")
dotenv.config({ path: "./.env" })
const app = express()

app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/address",addressRouter)
app.use("/api/v1/user",userRouter)
app.use("/api/v1/auth",authRouter)
app.use("/api/v1/category",categoryRouter)
app.use("/api/v1/product",productRouter)
app.use("/api/v1/cart",cartRouter)
app.use("/api/v1/order",orderRouter)

app.use((err,req,res,next)=>{
  res.status(err.statusCode || 500).json({
    status: err.statusText || "error",
    message: err.message
})
})
app.listen(1020,()=>{
  console.log("app Running")
})

