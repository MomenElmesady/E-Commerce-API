const express = require("express")
const multer = require("multer")
const productController = require("../constrollers/productController")
const authController = require("../constrollers/authController")
const appError = require("../utils/appError")
const reviewRouter = require("./reviewRouter")
const router = express.Router()

const storage = multer.diskStorage({
  destination: (req,file,cb)=>{
    cb(null,"uploads")
  },
  filename: (req,file,cb)=>{
    const ext = file.mimetype.split("/")[1]
    const fileName = `${Date.now()}-p.${ext}`
    cb(null,fileName)
  }
})

const fileFilter = (req,file,cb)=>{
  const type = file.mimetype.split("/")[0]
  if (type === "image")
    return cb(null,true)
  else 
    return cb(new appError("file must be an image",400),false)
}
const upload = multer({storage,fileFilter})

// redirect to review Router / merge routes /
router.use("/:productId/review",reviewRouter)

// test
// router.post("/upload",upload.single("photo"))
router.route("/").get(productController.getAllProducts)
.post(upload.single("photo"),productController.addDefaultPhoto,productController.createProduct)

router.get("/search",productController.searchInProducts)

router.route("/:id").get(productController.getProduct)
.patch(productController.updateProduct)
.delete(productController.deleteProduct)


router.get("/category/:categoryId",productController.getProductsOfCategory)

router.post("/addToCart/:productId",authController.protect,productController.addToCart)

router.get("/getProductsForUser/:userId",productController.getProductsForUser)

module.exports = router