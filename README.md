# E-Commerce Platform

This project is a full-featured eCommerce application built using Django for the backend and React for the frontend, designed to deliver a seamless shopping experience for users and efficient management tools for administrators. Key features include product browsing, shopping cart, user profiles, product reviews, and integration with payment gateways.

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Deployment](#deployment)
- [License](#license)
- [Contributing](#contributing)

---

## Features

- **Shopping Cart**: Users can add, update, and remove products, and proceed to checkout.
- **Product Management**: Features like product details, search, pagination, and user reviews.
- **User Profiles**: Allows users to manage account details and view order history.
- **Admin Tools**: Administrators can manage products, users, and orders.
- **Payment Integration**: Supports PayPal and credit card payments.
- **Secure Authentication**: User authentication using JWT for secure access to the API.

## Project Structure
Ecommerce-Site-with-Django/ ├── backend/ # Django backend with API logic and data models │ ├── settings.py # Configuration settings for Django │ └── urls.py # URL routing for backend APIs ├── frontend/ # React frontend with shopping cart and UI components │ ├── src/ # Source code for React app │ └── public/ # Public assets and index.html ├── staticfiles/ # Static files managed by Django and whitenoise ├── requirements.txt # Backend dependencies └── README.md # Project description and usage


## Technologies Used

- **Backend**: Django, Django REST Framework, PostgreSQL, AWS S3
- **Frontend**: React, Redux
- **Authentication**: JWT for secure user authentication
- **Deployment**: Heroku (backend), Netlify or Vercel (frontend)
- **Payment**: PayPal API integration

## Installation

### Prerequisites

- [Python 3.x](https://www.python.org/downloads/)
- [Node.js and npm](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/)
- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)

### Backend Setup (Django)

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ecommerce-site-with-django.git
   cd ecommerce-site-with-django/backend
