const express = require("express")
const router = express.Router()
const productController = require("../constrollers/productController")
const authController = require("../constrollers/authController")
router.route("/").get(productController.getAllProducts)
.post(productController.createProduct)

router.get("/search",productController.searchInProducts)

router.route("/:productId").get(productController.getProduct)
.patch(productController.updateProduct)
.delete(productController.deleteProduct)


router.get("/category/:categoryId",productController.getProductsOfCategory)

router.post("/addToCart/:productId",authController.protect,productController.addToCart)
module.exports = router