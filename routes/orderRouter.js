const express = require("express")
const orderController = require("../constrollers/orderController")
const authController = require("../constrollers/authController")
const router = express.Router()

router.route("/").get(orderController.getAllOrders)
router.route("/:orderId").get(orderController.getOrder)
.patch(orderController.updateOrder)
.delete(orderController.deleteOrder)

router.post("/checkOut",authController.protect,orderController.checkOut)
router.get("/getOrderState/:orderId",orderController.getOrderState)
router.post("/recieveOrder/:orderId",orderController.recieveOrder)
router.get("/getUserOrders/:userId", orderController.getUserOrders)
router.delete("/deleteFromOrder/:orderId/:orderItemIds",orderController.deleteFromOrder)

router.get("/getProductsForUser/:userId",orderController.getProductsForUser)
module.exports = router