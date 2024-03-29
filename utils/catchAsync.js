const appError = require("./appError")

module.exports = catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(err => {
      return next(new appError(err.message,400))
    })
  }
}