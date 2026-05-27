# Full E-Commerce Backend API

A production-ready, highly secure RESTful API built with Node.js, Express, and MongoDB. This backend provides complete business logic for modern e-commerce platforms, including robust user authentication, product/cart management, and secure payment processing with Native Stripe Integration.

## 🚀 Features

- **User Authentication & Security:** Secure registration, login, and session tracking using password hashing (`bcryptjs`) and custom security middleware.
- **Route Protection:** Custom middleware layers guarding administrative and user-specific endpoints against unauthorized access.
- **Product & Inventory Cataloging:** Dynamic schemas for managing rich product data, categories, and inventory statuses via Mongoose.
- **Cart & Order System:** Flexible cart handling with reliable data persistence for authenticated sessions.
- **Stripe Payment Gateway:** End-to-end integration with the Stripe API to securely handle checkout events and process real-time transactions gracefully.
- **Modular Architecture:** Clean Separation of Concerns (SoC) using a predictable Model-View-Controller (MVC) approach.

---

## 🛠️ Tech Stack

- **Runtime Environment:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB
- **ODM (Object Data Modeling):** Mongoose
- **Payments:** Stripe API
- **Security & Utilities:** Bcryptjs, dotenv, custom Express middleware

---

## 📋 Prerequisites

Before running this project, ensure you have the following installed on your local environment:
- [Node.js](https://nodejs.org/) (v16.x or higher recommended)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account or a local running instance of MongoDB.
- A [Stripe Developer Account](https://stripe.com/) to get test API keys.

---

## ⚙️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/giorgi-bezhiashvili/Full-eccomerce-backend.git](https://github.com/giorgi-bezhiashvili/Full-eccomerce-backend.git)
   cd Full-eccomerce-backend

2. **Install dependencies
   ```bash
   npm install
   
3. **Configure Environment Variables:**
   Create a `.env` file in the root directory of the project and populate it with your configuration values:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_signing_secret
   ACCESS_TOKEN_SECRET=your_jwt_signing_token_secret
   REFRESH_TOKEN_SECRET=your_jwt_refreshtoken_secret

4. **Start the development server:**
   ```bash
   npm run devStart
   
🛣️ Core API Endpoints (Snapshot)
🔐 Authentication & Users
POST /api/auth/register - Register a new user profile.

POST /api/auth/login - Authenticate a user and receive credentials.

📦 Products
GET /api/products - Fetch all products (supports filtering/pagination).

GET /api/products/:id - Fetch details for a specific item.

POST /api/products - Create a new product (Admin authorization required).

🛒 Shopping Cart & Orders
GET /api/cart - View items currently saved in user's cart.

POST /api/cart/add - Append an item to the current checkout cart.

POST /api/orders/checkout - Initialize the Stripe Checkout session.

🔒 Security Practices Implemented
Password Salting: Using bcryptjs to securely process user credentials, ensuring passwords are never stored as plain text.

Environment Isolation: Keeping critical infrastructure variables (Database connections, Stripe API Keys) safely decoupled from code execution flows via .env.

Fail-Safe Middleware: Graceful error catching and centralized response orchestration to prevent raw system errors from exposing back-end internals.

🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check out the issues page if you want to help make this project even better.

Fork the Project

Create your Feature Branch (git checkout -b feature/AmazingFeature)

Commit your Changes (git commit -m 'Add some AmazingFeature')

Push to the Branch (git push origin feature/AmazingFeature)

Open a Pull Request

📝 License
Distributed under the MIT License.




