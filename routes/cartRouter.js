const express = require("express")
const cartController = require("../constrollers/cartController")
const authController = require("../constrollers/authController")
const router = express.Router()

router.post("/deleteFromCart/:cartItemId", authController.protect, cartController.deleteFromCart)
router.get("/showCart", authController.protect, cartController.showCart)
router.get("/showPrice", authController.protect, cartController.showPrice)

module.exports = router