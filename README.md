🛒 GeekCart — Backend

GeekCart is a full-stack e-commerce web application built with Node.js and Express.js.

This repository contains the backend REST API and real-time communication layer for GeekCart. It handles authentication, users, products, cart, wishlist, orders, payments, wallet, coupons, offers, returns, referrals, notifications, and admin operations.

The backend follows a modular feature-based architecture, separating business domains into independent modules while keeping controllers, services, routes, models, and validations organized and maintainable.

🌐 Application

Live Frontend:
https://geekcart.fathahmpm.in/

Frontend Repository:
https://github.com/FathahManipuram/geekcart-frontend

Backend Hosting:
AWS

✨ Features
👤 Authentication & User Management
User registration and login
Google authentication
JWT-based authentication
Access token handling
Refresh token handling
Protected routes
User profile management
Profile image upload
Email change and verification
Password change
Account management
Address management
User blocking and access control
🛍️ Product Management
Product creation and management
Product categories
Product variants
Product images
Product colors
Product sizes
Product search
Product filtering
Product availability
Stock management
Similar product handling
🛒 Shopping Cart
Add products to cart
Update item quantity
Remove cart items
Variant-based cart items
Stock validation
Cart total calculation
Checkout validation
❤️ Wishlist
Add products to wishlist
Remove products from wishlist
Wishlist retrieval
Wishlist and product availability handling
📦 Order Management

GeekCart provides comprehensive order management functionality.

Order creation
Order history
Order status management
Item-level status management
Order cancellation
Item-level cancellation
Return requests
Refund processing
Stock restoration
Payment status management
Order status history
Item status history
Coupon-aware Cancellation

The backend handles cancellation rules based on applied coupons.

When an applied coupon does not allow individual item cancellation, the individual item cannot be cancelled and the user must cancel the entire order.

💳 Payment Management

GeekCart supports multiple payment methods:

Razorpay
Cash on Delivery
Wallet payments

The backend handles:

Razorpay order creation
Payment verification
Payment status updates
Payment failure handling
COD payment processing
Wallet payment processing
Refund calculations
Wallet refunds
💰 Wallet
Wallet creation
Wallet balance
Wallet top-up
Wallet transactions
Wallet payments
Refund credits
Transaction history
Wallet balance updates

Wallet transactions are maintained with references to the corresponding business operations.

🎟️ Coupons & Offers
Coupon creation
Coupon management
Coupon validation
Coupon application
Coupon usage handling
Coupon restrictions
Product/category-based offers
Offer management
Discount calculation

Coupon rules are also integrated with order cancellation and refund logic.

🔄 Returns & Refunds
Return requests
Return status management
Return approval/rejection
Item-level return handling
Refund processing
Wallet refund
Refund amount calculation
Return status history
🎁 Referral & Rewards
Referral codes
Referral tracking
Referral rewards
Referral earnings
Reward processing
Referral-related wallet credits
🔔 Real-Time Notifications

GeekCart uses Socket.IO to provide real-time notifications.

When an order status changes:

Admin
  │
  │ Updates order status
  ↓
Order Service
  │
  ├── Updates order
  │
  ├── Saves notification
  │
  └── Emits Socket.IO event
              │
              ↓
        Connected User
              │
              ↓
      Notification UI

The notification system supports:

Notification persistence
Real-time notifications
User-specific Socket.IO rooms
Unread notification count
Notification history
Mark notification as read
Mark all notifications as read
Order-related notifications
🏗️ Backend Architecture

GeekCart follows a modular feature-based architecture.

Business functionality is separated into modules instead of placing all controllers, services, models, and routes into global folders.

src/
├── common/
│   ├── constants/
│   ├── middleware/
│   └── utils/
│
├── modules/
│   ├── admin-side/
│   │   ├── category/
│   │   ├── coupon/
│   │   ├── dashboard/
│   │   ├── offer/
│   │   ├── order/
│   │   ├── product/
│   │   ├── return/
│   │   └── user/
│   │
│   └── user-side/
│       ├── auth/
│       ├── cart/
│       ├── category/
│       ├── checkout/
│       ├── notification/
│       ├── order/
│       ├── payment/
│       ├── product/
│       ├── referral/
│       ├── return/
│       ├── wallet/
│       └── wishlist/
│
├── routes/
│
├── socket/
│   ├── index.js
│   ├── socket.handler.js
│   └── socket.service.js
│
├── app.js
└── server.js

The exact module names may vary as the project evolves, but the architecture is organized around independent business features.

📦 Module Structure

A typical feature follows a structure similar to:

feature/
├── controllers/
├── services/
├── routes/
├── models/
├── validations/
└── constants/
Controllers

Controllers handle:

Request parameters
Request body
Authentication information
Calling services
Sending HTTP responses
Passing errors to middleware

Example flow:

Request
   ↓
Controller
   ↓
Service
   ↓
Database / External Service
   ↓
Service Response
   ↓
Controller
   ↓
HTTP Response
⚙️ Services

Business logic is kept inside service functions rather than controllers.

For example:

Controller
    ↓
createWalletTopupOrderService()
    ↓
Razorpay
    ↓
MongoDB
    ↓
Response

This keeps controllers lightweight and makes business logic easier to maintain and reuse.

🧩 Common Layer

The common directory contains functionality shared across multiple modules.

common/
├── constants/
├── middleware/
└── utils/

It contains reusable functionality such as:

HTTP status constants
Authentication middleware
Error handling
Application errors
Shared utilities
Common constants
🔐 Authentication & Authorization

The backend uses JWT-based authentication.

Client
  │
  │ Login
  ↓
Backend
  │
  ├── Validate credentials
  │
  ├── Generate access token
  │
  └── Generate refresh token
  ↓
Client

Protected requests are handled through authentication middleware.

Client Request
      ↓
Auth Middleware
      ↓
Validate Token
      ↓
Attach User
      ↓
Controller
      ↓
Service

Role-based access is used to separate user-side and admin-side functionality.

🛡️ Error Handling

The backend uses centralized error handling.

Application errors are represented using a custom AppError and passed through the error middleware.

Controller
     ↓
Service
     ↓
AppError
     ↓
next(error)
     ↓
Error Middleware
     ↓
Standardized HTTP Response

This keeps error handling consistent across the application.

🗃️ Database

GeekCart uses MongoDB as its primary database.

MongoDB stores data related to:

Users
Products
Categories
Variants
Cart
Wishlist
Orders
Payments
Wallet
Wallet transactions
Coupons
Offers
Returns
Referrals
Notifications

MongoDB connection is initialized when the application starts.

Backend
   ↓
MongoDB Connection
   ↓
Application Starts
   ↓
HTTP + Socket.IO Server
🔌 Socket.IO

The backend runs Socket.IO on the same HTTP server.

HTTP Server
     │
     ├── REST API
     │
     └── Socket.IO

Users join their own Socket.IO room:

User ID
   ↓
join-room
   ↓
Socket.IO Room

Notifications can then be emitted specifically to that user:

emitNotification(userId, notification)
💰 Wallet & Refund Flow

For supported payment methods, refunds can be credited to the user's wallet.

Order / Item Cancellation
          ↓
Calculate Refund
          ↓
Validate Refund
          ↓
Credit Wallet
          ↓
Create Wallet Transaction
          ↓
Update Order / Item Refund Status

This allows refund processing to remain connected with the wallet transaction history.

📊 Order Status Management

Order and item status transitions are controlled through defined status transition rules.

Current Status
      ↓
Allowed Transitions
      ↓
Validate Requested Status
      ↓
Update Order / Item
      ↓
Save Status History

This prevents invalid status changes.

🔗 API Structure

The backend API is versioned under:

/api/v1

Example:

/api/v1/orders
/api/v1/products
/api/v1/cart
/api/v1/wallet
/api/v1/notifications

The application uses RESTful API design for communication between the frontend and backend.

🛠️ Tech Stack
Backend
Node.js
Express.js
JavaScript
REST API
Database
MongoDB
Mongoose
Authentication
JWT
Google Authentication
Real-Time Communication
Socket.IO
Payments
Razorpay
File & Image Management
Cloudinary
Middleware & Utilities
CORS
Morgan
dotenv
☁️ Deployment

The GeekCart backend is hosted on AWS.

User Browser
     │
     ↓
GeekCart Frontend
     │
     │ HTTPS / REST API
     ↓
AWS
     │
     ↓
GeekCart Backend
     │
     ├── MongoDB
     ├── Razorpay
     ├── Cloudinary
     └── Socket.IO

The backend provides both REST API endpoints and Socket.IO real-time communication.

⚙️ Installation
1. Clone the repository
git clone https://github.com/FathahManipuram/geekcart-backend.git
2. Navigate to the project
cd geekcart-backend
3. Install dependencies
npm install
🔐 Environment Variables

Create the required environment configuration file.

Example:

PORT=5000

MONGO_URI=your_mongodb_connection_string

CLIENT_URLS=http://localhost:5173

JWT_ACCESS_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret

RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

Use the actual environment variable names defined in your project. Never commit .env files or production credentials to the repository.

▶️ Running the Application
Development
npm run dev

The backend will normally run on:

http://localhost:5000
Production
npm start

The production server is deployed on AWS.

🔄 Application Flow

The overall backend request flow is:

Frontend
   ↓
REST API
   ↓
Route
   ↓
Middleware
   ↓
Controller
   ↓
Service
   ↓
Model / External Service
   ↓
Database
   ↓
Service Response
   ↓
Controller
   ↓
Frontend

For real-time events:

Backend Service
      ↓
Notification Service
      ↓
Socket.IO
      ↓
User Room
      ↓
Frontend
🧪 Development Practices

The backend follows:

Modular feature-based architecture
Separation of controllers and business logic
Service-based business logic
Centralized error handling
Authentication middleware
Role-based authorization
RESTful API design
Environment-based configuration
MongoDB data modeling
Status transition validation
Real-time event handling
Separation of admin and user modules
Reusable constants and utilities
🚀 Project Goals

GeekCart was developed with a focus on building a scalable e-commerce backend capable of handling:

Authentication and authorization
Product and inventory management
Cart and wishlist functionality
Payment processing
Wallet transactions
Coupon and offer management
Order lifecycle management
Returns and refunds
Referral rewards
Real-time notifications
Admin operations
Modular and maintainable backend architecture
👨‍💻 Author

Abdul Fathah M T

GitHub: https://github.com/FathahManipuram

LinkedIn: https://www.linkedin.com/in/fathah-manipuram-b7313b207/

📄 License

This project is developed for educational and portfolio purposes.
