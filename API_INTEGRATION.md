# API Integration Guide

This document outlines how to integrate the Pizza Wale Backend API with the Frontend (Customer App) and Shop Owner Portal.

## Base URL
`http://localhost:3000` (Local Development)

## Authentication

### 1. Shop Owner Login
*   **Endpoint**: `POST /auth/shop/login`
*   **Body**: `{ "username": "admin", "password": "admin123" }`
*   **Response**: `{ "access_token": "JWT_TOKEN" }`
*   **Usage**: Store the `access_token` and send it in the `Authorization` header as `Bearer <token>` for all shop-related protected routes (e.g., managing products, updating order status).

### 2. Customer Authentication (OTP)
*   **Step 1: Send OTP**
    *   **Endpoint**: `POST /auth/otp/send`
    *   **Body**: `{ "phone": "+1234567890" }`
    *   **Response**: `{ "message": "OTP sent" }` (Mocked: OTP is always `123456` in dev)
*   **Step 2: Verify OTP**
    *   **Endpoint**: `POST /auth/otp/verify`
    *   **Body**: `{ "phone": "+1234567890", "otp": "123456" }`
    *   **Response**: `{ "access_token": "JWT_TOKEN" }`
*   **Usage**: Store the `access_token` and send it in the `Authorization` header as `Bearer <token>` for creating orders.

---

## Customer App Flow

### 1. Fetching the Menu
*   **Scenario**: User scans a QR code or visits a shop link.
*   **Endpoint**: `GET /shops/:shopId/menu`
*   **Response**: Returns a list of categories with nested products and their option configurations.
*   **Frontend Logic**:
    *   Display categories as tabs or sections.
    *   List products under each category.
    *   When a user selects a product, show available options (e.g., Size, Toppings) based on `optionConfigs`.

### 2. Creating an Order
*   **Scenario**: User adds items to cart and proceeds to checkout.
*   **Pre-requisite**: User must be authenticated (have a valid JWT).
*   **Endpoint**: `POST /orders`
*   **Header**: `Authorization: Bearer <user_token>`, `Idempotency-Key: <unique_uuid>`
*   **Body**:
    ```json
    {
      "shopId": "UUID",
      "items": [
        {
          "productId": "UUID",
          "quantity": 1,
          "options": [
            { "optionId": "UUID" }
          ]
        }
      ]
    }
    ```
*   **Response**: Returns the created order object, including `id` and `shortId`.

### 3. Tracking Order Status (Real-time)
*   **Mechanism**: Firebase Firestore
*   **Collection Path**: `/users/{userId}/orders/{orderId}`
*   **Frontend Logic**:
    *   Use Firebase Client SDK.
    *   Listen to the document snapshot for real-time updates on the `status` field (e.g., `PENDING` -> `CONFIRMED` -> `PREPARING` -> `READY`).

---

## Shop Owner Portal Flow

### 1. Dashboard & Real-time Orders
*   **Mechanism**: Firebase Firestore
*   **Collection Path**: `/shops/{shopId}/orders`
*   **Frontend Logic**:
    *   Use Firebase Client SDK.
    *   Query this collection (e.g., `where('status', '!=', 'COMPLETED')`) to show active orders.
    *   Listen for real-time updates to display new orders instantly without refreshing.

### 2. Updating Order Status
*   **Scenario**: Shop owner accepts an order or marks it as ready.
*   **Endpoint**: `POST /orders/:orderId/status`
*   **Header**: `Authorization: Bearer <shop_token>`
*   **Body**: `{ "status": "CONFIRMED" }` (or `PREPARING`, `READY`, `COMPLETED`)
*   **Effect**: Updates the database and triggers a Firestore update, which the customer app will receive in real-time.

### 3. Menu Management
*   **Create Product**: `POST /shops/:shopId/product`
*   **Update Product**: `PUT /shops/:shopId/product/:productId`
*   **Usage**: Allows shop owners to add new items or change prices/availability.

---

## Testing with Postman
1.  Import the provided `postman_collection.json` into Postman.
2.  Set the `baseUrl` variable to `http://localhost:3000`.
3.  **Get IDs**: Run `npx ts-node fetch-ids.ts` in the backend terminal to get valid `shopId`, `productId`, etc.
4.  **Update Variables**: Update the collection variables (`shopId`, `productId`, etc.) with the values from the script.
5.  **Login**: Run the "Shop Login" request to get a token, then update the `shopToken` variable.
6.  **Test Flows**: Run requests in the order described above.
