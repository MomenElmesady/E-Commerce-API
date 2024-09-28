const express = require("express")
const orderController = require("../constrollers/orderController")
const authController = require("../constrollers/authController")
const router = express.Router()

router.post("/create-checkout-session",orderController.createCheckOutSession)
router.get("/checkOutSession",orderController.createCheckOutSession)

router.get("/getOrdersAddressForUser",authController.protect ,orderController.getOrdersAddressForUser)

router.route("/").get(orderController.getAllOrders)
router.route("/:id").get(orderController.getOrder)
.patch(orderController.updateOrder)
.delete(orderController.deleteOrder)

router.post("/checkOut",authController.protect,orderController.checkOut)
router.get("/getOrderState/:orderId",orderController.getOrderState)
router.post("/recieveOrder/:orderId",orderController.recieveOrder)
router.get("/getUserOrders/:userId", orderController.getUserOrders)
router.delete("/deleteFromOrder/:orderId/:orderItemIds",authController.protect,orderController.deleteFromOrder)
module.exports = router