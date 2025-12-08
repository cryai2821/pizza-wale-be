# Pizza Wale - Food Ordering MVP Backend

A NestJS-based backend for a food ordering platform with real-time order tracking via Firebase.

## 🚀 Features

- **Dual Authentication System**
  - Shop Owners: Username/Password (JWT)
  - Customers: WhatsApp OTP with lazy registration
- **Dynamic Menu Management**
  - Categories, Products, and customizable Option Groups
  - Server-side pricing calculation
- **Order Management**
  - Idempotent order creation
  - Real-time order tracking (Firebase)
  - Order status updates
- **Real-time Notifications** (Planned)
  - Customer order status updates
  - Shop owner new order notifications

## 🛠️ Tech Stack

- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Authentication**: Passport.js (Local & JWT strategies)
- **Validation**: class-validator, class-transformer
- **Real-time**: Firebase Admin SDK / Firestore
- **Testing**: Jest

## 📋 Prerequisites

- Node.js >= 16.0.0
- PostgreSQL database (or Neon account)
- Firebase project (for real-time features)

## 🔧 Installation

1. **Clone and Install**
   ```bash
   cd backend
   npm install
   ```

2. **Environment Setup**
   
   Create `.env` file:
   ```env
   DATABASE_URL="postgresql://user:password@host/database"
   JWT_SECRET="your-secret-key-change-in-production"
   PORT=3000
   FIREBASE_SERVICE_ACCOUNT_PATH="./firebase-service-account.json"
   ```

3. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

## 🏃 Running the Application

**Development Mode**
```bash
npm run start:dev
```

**Production Build**
```bash
npm run build
npm run start:prod
```

**Database Studio**
```bash
npx prisma studio
```

## 📊 Database Schema

### Core Models
- **Shop**: Store information and owner credentials
- **User**: Customer profiles (phone-based)
- **Category**: Menu categories
- **OptionGroup**: Customization options (Size, Toppings, etc.)
- **Option**: Individual choices within option groups
- **Product**: Menu items with pricing
- **Order**: Customer orders with items
- **IdempotencyKey**: Prevent duplicate orders

## 🔐 API Endpoints

### Authentication

**Shop Owner Login**
```bash
POST /auth/shop/login
Body: { "username": "admin", "password": "admin123" }
```

**Customer OTP Flow**
```bash
# Send OTP
POST /auth/otp/send
Body: { "phone": "+1234567890" }

# Verify OTP
POST /auth/otp/verify
Body: { "phone": "+1234567890", "otp": "123456" }
```

### Shop Management

**Get Menu**
```bash
GET /shops/:shopId/menu
```

**Create Product** (Protected)
```bash
POST /shops/:shopId/product
Headers: { "Authorization": "Bearer {token}" }
Body: {
  "name": "Margherita Pizza",
  "description": "Classic cheese and tomato",
  "basePrice": 299,
  "categoryId": "{categoryId}"
}
```

### Orders

**Create Order** (Protected)
```bash
POST /orders
Headers: { 
  "Authorization": "Bearer {token}",
  "Idempotency-Key": "unique-key-123"
}
Body: {
  "shopId": "{shopId}",
  "items": [
    {
      "productId": "{productId}",
      "quantity": 2,
      "options": [{ "optionId": "{optionId}" }]
    }
  ]
}
```

**Get Order**
```bash
GET /orders/:orderId
```

**Update Order Status** (Protected)
```bash
POST /orders/:orderId/status
Headers: { "Authorization": "Bearer {token}" }
Body: { "status": "CONFIRMED" }
```

## 🌱 Seed Data

The database comes pre-seeded with:
- **Shop**: Username: `admin`, Password: `admin123`
- **User**: Phone: `+1234567890`, Name: `Test Customer`
- **Products**: Margherita Pizza, Coke
- **Categories**: Pizzas, Drinks
- **Option Groups**: Size (Small/Medium/Large), Toppings (Cheese/Mushrooms/Olives)

## 🔥 Firebase Integration (Planned)

### Firestore Structure

**Shop Orders** (`/shops/{shopId}/orders/{orderId}`)
- Real-time order notifications for shop owners
- Order details with customer info

**Customer Orders** (`/users/{userId}/orders/{orderId}`)
- Real-time status updates for customers
- Order tracking information

### Setup Required
1. Create Firebase project
2. Download service account JSON
3. Place in `backend/` directory
4. Update `.env` with path

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📁 Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts            # Seed data
├── src/
│   ├── auth/              # Authentication module
│   ├── shops/             # Shop management
│   ├── orders/            # Order processing
│   ├── firestore/         # Firebase integration
│   └── common/            # Shared utilities
├── .env                   # Environment variables
└── package.json
```

## 🔒 Security Features

- **Password Hashing**: bcrypt for shop owner passwords
- **JWT Authentication**: Secure token-based auth
- **Role-Based Access Control**: Separate permissions for shops/customers
- **Idempotency**: Prevent duplicate order submissions
- **Server-side Validation**: All pricing calculated on backend

## 🚧 Roadmap

- [ ] Complete Firebase integration
- [ ] Push notifications (FCM)
- [ ] Real OTP provider integration (Twilio/Gupshup)
- [ ] Min/Max option validation
- [ ] Order cancellation logic
- [ ] Comprehensive test coverage
- [ ] API documentation (Swagger)

## 📝 Notes

- OTP service currently uses mock provider (check console for OTP codes)
- Firebase integration is mocked (awaiting service account credentials)
- All IDs are UUIDs generated by Prisma

## 🤝 Contributing

This is an MVP project. For production use, ensure:
- Proper error handling
- Rate limiting
- Input sanitization
- Comprehensive logging
- Security audits

## 📄 License

UNLICENSED - Private Project
