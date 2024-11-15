
# 🛍️ E-Commerce Platform

Welcome to the **E-Commerce Platform**, a comprehensive e-commerce application built with Django and React. This platform offers a seamless shopping experience for users and robust management tools for administrators.

[🔗 Live Demo](https://handmadehub-4c471829f515.herokuapp.com/#/)

## 📋 Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Backend Setup (Django)](#backend-setup-django)
  - [Frontend Setup (React)](#frontend-setup-react)
- [API Endpoints](#api-endpoints)
  - [User Authentication](#user-authentication)
  - [Product Management](#product-management)
  - [Order Management](#order-management)
- [Usage](#usage)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## Features

- **Shopping Cart**: Add, update, and remove products; proceed to checkout.
- **Product Management**: Product details, search functionality, pagination, and user reviews.
- **User Profiles**: Manage account details and view order history.
- **Admin Tools**: Manage products, users, and orders.
- **Payment Integration**: Supports PayPal and credit card payments.
- **Secure Authentication**: JWT-based secure access to the API.

## Technologies Used

- **Backend**: Django, Django REST Framework, PostgreSQL, AWS S3
- **Frontend**: React, Redux
- **Authentication**: JSON Web Tokens (JWT)
- **Deployment**: Heroku
- **Payment Gateway**: PayPal API

---

## Prerequisites

- [Python 3.x](https://www.python.org/downloads/)
- [PostgreSQL](https://www.postgresql.org/)
- [Node.js & npm](https://nodejs.org/en/)
- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)

---

## Installation

### Backend Setup (Django)

1. **Clone the repository**:

   ```bash
   git clone https://github.com/yourusername/ecommerce-site-with-django.git
   cd ecommerce-site-with-django/backend
   ```

2. **Create a virtual environment and activate it**:

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. **Install dependencies**:

   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**: Create a `.env` file in the root directory and add the following:

   ```env
   SECRET_KEY=your_secret_key
   DB_PASS=your_database_password
   AWS_ACCESS_KEY_ID=your_aws_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret
   ```

5. **Apply migrations and collect static files**:

   ```bash
   python manage.py migrate
   python manage.py collectstatic --noinput
   ```

6. **Run the development server**:

   ```bash
   python manage.py runserver
   ```

### Frontend Setup (React)

1. **Navigate to the frontend directory**:

   ```bash
   cd ../frontend
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Start the React development server**:

   ```bash
   npm start
   ```

---

## API Endpoints

### User Authentication

- **Login**: `POST /api/users/login/`
- **Register**: `POST /api/users/register/`
- **Get Profile**: `GET /api/users/profile/`
- **Update Profile**: `PUT /api/users/profile/update/`

### Product Management

- **Product List**: `GET /api/products/`
- **Product Details**: `GET /api/products/<id>/`
- **Add Review**: `POST /api/products/<id>/review/`

### Order Management

- **Create Order**: `POST /api/orders/add/`
- **User Orders**: `GET /api/orders/myorders/`
- **Order Details**: `GET /api/orders/<id>/`

---

## Usage

- Visit **[http://localhost:3000](http://localhost:3000)** to access the frontend application.
- Use **[http://localhost:8000/api/](http://localhost:8000/api/)** to interact with the backend API.

---

## Contact

For questions or suggestions, please open an issue or contact at **[sainithingoudk@gmail.com](mailto:sainithingoudk@gmail.com)**.

---
