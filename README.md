# E-commerce API

## Description
The E-commerce API provides backend services for managing an online shopping platform. It includes endpoints for user authentication, product management, cart management, order processing, and more.

## Technologies 
JavaScript, Node.js, Express.js, Sequelize, JWT, Multer, Bcrypt

## Routes

### Address Routes

- **POST /api/v1/address**: Create a new address.
- **GET /api/v1/address**: Get all addresses.
- **GET /api/v1/address/:id**: Get a specific address.
- **PATCH /api/v1/address/:id**: Update an address.
- **DELETE /api/v1/address/:id**: Delete an address.

### Authentication Routes

- **POST /api/v1/auth/signUp**: Register a new user.
- **POST /api/v1/auth/verify/:token**: Verify user's email.
- **POST /api/v1/auth/sendVerification**: Send email verification token.
- **POST /api/v1/auth/login**: Log in an existing user.
- **POST /api/v1/auth/forgotPassword**: Send password reset token.
- **PATCH /api/v1/auth/resetPassword/:token**: Reset user's password.
- **GET /api/v1/auth/refreshToken**: Refresh authentication token.
- **POST /api/v1/auth/logOut**: Log out the current user.

### Cart Routes

- **POST /api/v1/cart/addToCart/:productId**: Add a product to the cart.
- **POST /api/v1/cart/deleteFromCart/:cartItemId**: Remove a product from the cart.
- **GET /api/v1/cart/showCart**: View the cart contents.
- **GET /api/v1/cart/showPrice**: View the total price of items in the cart.
- **PATCH /api/v1/cart/updateCartItem/:cartItemId**: Update quantity of a product in the cart.
- **GET /api/v1/cart/:id**: Get cart details.
- **GET /api/v1/cart**: Get all carts.

### Category Routes

- **POST /api/v1/category**: Create a new category.
- **GET /api/v1/category**: Get all categories.
- **GET /api/v1/category/:id**: Get a specific category.
- **PATCH /api/v1/category/:id**: Update a category.
- **DELETE /api/v1/category/:id**: Delete a category.

### Order Routes

- **GET /api/v1/order**: Get all orders.
- **GET /api/v1/order/:id**: Get a specific order.
- **PATCH /api/v1/order/:id**: Update an order.
- **DELETE /api/v1/order/:id**: Delete an order.
- **POST /api/v1/order/checkOut**: Checkout and create an order.
- **GET /api/v1/order/getOrderState/:orderId**: Get order state.
- **POST /api/v1/order/recieveOrder/:orderId**: Receive an order.
- **GET /api/v1/order/getUserOrders/:userId**: Get orders for a specific user.
- **DELETE /api/v1/order/deleteFromOrder/:orderId/:orderItemIds**: Delete items from an order.

### Product Routes

- **GET /api/v1/product/search**: Search for products.
- **GET /api/v1/product/category/:categoryId**: Get products of a specific category.
- **GET /api/v1/product/getProductsForUser/:userId**: Get products uploaded by a user.
- **GET /api/v1/product**: Get all products.
- **POST /api/v1/product**: Create a new product.
- **GET /api/v1/product/:id**: Get a specific product.
- **PATCH /api/v1/product/:id**: Update a product.
- **DELETE /api/v1/product/:id**: Delete a product.

### Review Routes

- **GET /api/v1/product/:productId/review/getAverageRating**: Get the average rating of a product.
- **GET /api/v1/product/:productId/review**: Get reviews for a product.
- **POST /api/v1/product/:productId/review**: Create a new review for a product.
- **GET /api/v1/product/:productId/review/:id**: Get a specific review.
- **PATCH /api/v1/product/:productId/review/:id**: Update a review.
- **DELETE /api/v1/product/:productId/review/:id**: Delete a review.

### User Routes

- **GET /api/v1/user/me**: Get current user details.
- **PATCH /api/v1/user/updateMe**: Update current user details.
- **PATCH /api/v1/user/updatePassword**: Update user's password.
- **GET /api/v1/user**: Get all users.
- **GET /api/v1/user/:id**: Get a specific user.
- **DELETE /api/v1/user/:id**: Delete a user.
- **GET /api/v1/user/usersIn/:addressId**: Get users in a specific address.

