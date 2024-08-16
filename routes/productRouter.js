const express = require("express")
const multer = require("multer")
const productController = require("../constrollers/productController")
const authController = require("../constrollers/authController")
const appError = require("../utils/appError")
const reviewRouter = require("./reviewRouter")

const router = express.Router()

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads")
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1]
    const fileName = `${Date.now()}-p.${ext}`
    cb(null, fileName)
  }
})

const fileFilter = (req, file, cb) => {
  const type = file.mimetype.split("/")[0]
  if (type === "image")
    return cb(null, true)
  else
    return cb(new appError("file must be an image", 400), false)
}
const upload = multer({ storage, fileFilter })

// redirect to review Router / merge routes /
router.get("/homePage",authController.protect, productController.getHomePageProducts)

router.use("/:productId/review", reviewRouter)

// test
// router.post("/upload",upload.single("photo"))
router.get("/search", productController.searchInProducts)
router.get("/category/:categoryId",authController.protect, productController.getProductsOfCategory)
router.get("/getProductsForUser/:userId", productController.getProductsForUser)

router.route("/").get(productController.getAllProducts)
  .post(authController.protect, authController.allowedTo("manager"),
    upload.single("photo"), productController.addDefaultPhoto, productController.createProduct)

router.route("/:id").get(productController.getProduct)
  .patch(authController.protect, authController.allowedTo("manager"), upload.single("photo"), productController.addDefaultPhoto, productController.updateProduct)
  .delete(authController.protect, authController.allowedTo("manager"), productController.deleteProduct)

module.exports = router