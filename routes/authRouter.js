const express = require("express")
const authController = require("../constrollers/authController")
const router = express.Router()
router.post("/signUp", authController.signUp)
router.post("/verify/:token", authController.verify)
router.post("/sendVerification", authController.sendVerificationToken)
router.post("/login", authController.login)
router.post("/forgotPassword", authController.forgotPassword)
router.patch("/resetPassword/:token", authController.resetPassword)
router.get("/refreshToken", authController.refreshToken)

router.post("/logOut",authController.protect,authController.logout)

module.exports = router
