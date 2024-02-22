const express = require("express")
const router = express.Router()
const userController = require("../constrollers/userController")
const authController = require("../constrollers/authController")

router.get("/me",authController.protect,userController.getMe,userController.getUser)
router.patch("/updateMe",authController.protect,userController.updateMe)
router.patch("/updatePassword",authController.protect,userController.updatePassword)

router.route("/").get(userController.getAllUsers)

router.route("/:id").get(userController.getUser)
.delete(userController.deleteUser).patch(userController.updateUser)

router.get("/usersIn/:addressId",userController.getUsersInAddress)
module.exports = router

