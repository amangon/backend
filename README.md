# 💎 Luxury Jewellery Backend API

A complete backend API for a premium luxury jewellery e-commerce platform built with **Node.js, Express.js, MongoDB, JWT Authentication, and Cloudinary**.

This backend provides secure APIs for users, admins, products, image uploads, reviews, and authentication.

---

## 🚀 Features

- User Authentication using JWT
- Admin Authentication
- Role Based Authorization
- Product CRUD Operations
- Multiple Product Image Upload
- Cloudinary Image Management
- MongoDB Atlas Integration
- Product Search
- Product Filtering
- Category Management
- Reviews & Ratings System
- Wishlist Support
- Protected Routes
- Error Handling Middleware

---

## 🛠️ Tech Stack

### Backend
- Node.js
- Express.js

### Database
- MongoDB Atlas
- Mongoose

### Authentication
- JWT
- bcrypt.js

### Image Upload
- Cloudinary
- Multer

### Tools
- Nodemon
- dotenv
- Git & GitHub

---

# 📂 Project Structure

```
backend/
│
├── config/
│
├── controllers/
│
├── middleware/
│
├── models/
│
├── routes/
│
├── utils/
│
├── server.js
├── package.json
└── .env
```

---

# ⚙️ Installation

Clone the repository:

```bash
git clone https://github.com/amangon/backend.git
```

Go inside project:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

---

# 🔐 Environment Variables

Create a `.env` file in the root directory.

Add your variables:

```env
PORT=5001

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

ADMIN_EMAIL=admin@luxuryjewellery.com
ADMIN_PASSWORD=your_admin_password
```

---

# ▶️ Run Application

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

---

# 🔗 API Routes

## Authentication

### User Register

```
POST /api/auth/register
```

### User Login

```
POST /api/auth/login
```

---

# Products API

### Get All Products

```
GET /api/products
```

### Get Single Product

```
GET /api/products/:id
```

### Create Product (Admin)

```
POST /api/products
```

### Update Product (Admin)

```
PUT /api/products/:id
```

### Delete Product (Admin)

```
DELETE /api/products/:id
```

---

# 🔒 Authentication

Protected APIs require JWT token.

Header:

```
Authorization: Bearer YOUR_TOKEN
```

---

# ☁️ Deployment

Backend can be deployed using:

- Render
- Railway
- AWS

Database:

- MongoDB Atlas

Image Storage:

- Cloudinary

---

# 📸 API Features

The API supports:

- Product images
- Product categories
- Product pricing
- Discount pricing
- Stock management
- Featured products
- Best sellers
- New arrivals
- Reviews

---

# 👨‍💻 Author

**Aman Kumar**

GitHub:

https://github.com/amangon
