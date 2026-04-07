# Project Documentation: DealSpheree

This document provide a comprehensive technical and functional overview of the **DealSpheree** platform (formerly Sizzling Valoris), a location-aware marketplace for local mall and storefront business offers.

---

## 1. Executive Summary
- **Product Name**: DealSpheree
- **Mission**: To connect local shoppers with exclusive, real-time deals from physical and online storefronts within a 50km radius.
- **Platforms**: 
    - **Mobile**: Android & iOS (via Expo/React Native)
    - **Web**: Progressive Web App/Desktop (`dealspheree.in`)
    - **Admin Dashboard**: Web-only interface for platform oversight.

---

## 2. Technical Architecture

### Core Stack
| Layer | Tech Stack | Key Purpose |
| :--- | :--- | :--- |
| **Frontend** | React Native (Expo) | Cross-platform UI (Mobile + Web). |
| **Backend** | Node.js (Express) | RESTful API & Business Logic. |
| **Database** | MongoDB Atlas | NoSQL storage for high-performance querying. |
| **State** | TanStack Query | Server state caching and optimistic UI. |
| **Media** | Cloudinary | Global CDN and optimized image storage. |
| **Auth** | JWT / Social OAuth | Secure, stateless authentication. |

### System Integrations
- **Email Service**: Brevo (via Web API) for OTPs and high-priority alerts.
- **Push Notifications**: Expo Server SDK (Native) + Web Push API (Browsers).
- **Scheduled Tasks**: Node-Cron for daily offer expiry checks and cleanup.

---

## 3. Data Schema (MongoDB Models)

### User Model
- **Roles**: `customer`, `store_owner`, `admin`.
- **Fields**: Name, Email, Password (hashed), Mobile (unique), City, Profile Image.
- **Auth**: Stores refresh tokens, password reset OTPs, and push notification tokens.

### Store Model
- **Branding**: Name, Logo, Banner, Category.
- **Geodata**: Latitude, Longitude, City, Physical Address.
- **Status**: `approved` (boolean), `hasDeliveryPartner` (boolean).
- **Engagement**: Average Rating, Total Views, Likes Count, List of Users who liked.
- **Verification**: `businessProofUrl` (link to uploaded documentation).

### Offer Model
- **Details**: Title, Description, Discount %, Original Price, Expiry Date.
- **Type**: `isOnline` (boolean) with optional `platformLink`.
- **Logic**: Linked to a `storeId`; tracked by views and likes.

### SystemLog Model
- **Purpose**: Traceability of administrative actions.
- **Fields**: Type (success/warning), Title (e.g., "New User joined"), Message, Timestamp, UI Color.

---

## 4. Key Workflows

### Authentication Flow (Secure & Stateless)
1. **Access Token (15m)**: Short-lived token sent in the `Authorization: Bearer` header.
2. **Refresh Token (30d)**: Long-lived token stored in `AsyncStorage`.
3. **Auto-Refresh**: The `apiClient` interceptor automatically attempts to refresh the session if a 401 error occurs.
4. **Social Login**: Integrated Google and Apple OAuth providers.

### Store Registration & Approval
1. **Application**: Store owners submit details along with **Business Proof** images.
2. **Pending State**: Store is marked `approved: false` and hidden from the customer feed.
3. **Admin Verification**: Registered admins review the proof in the `AdminDashboardScreen`.
4. **Launch**: Upon approval, a **SystemLog** is generated, a push notification is sent to the owner, and the store goes live.

### Geospatial Filtering (The "Nearby" Engine)
- **Calculation**: Uses the **Haversine Formula** in `DataContext.js` to calculate distance between user coordinates and store coordinates.
- **Visibility**: Only stores/offers within a **50km radius** are displayed to the user by default to ensure relevance.

---

## 5. Security Implementations
- **Helmet**: Sets secure HTTP response headers to protect against common web vulnerabilities.
- **Rate-Limiting**: 
    - `globalLimiter`: Prevents IP-based flooding.
    - `authLimiter`: Prevents brute-force password guessing.
- **Input Sanitization**: `express-mongo-sanitize` prevents NoSQL injection attacks.
- **ID Guarding**: Backend logic strictly validates `ownerId` against the JWT session to prevent users from editing other people's stores.

---

## 6. Deployment & Environment Settings

### Backend (Render)
- **Environment**: Node.js instance.
- **Critical Keys**: `MONGO_URI`, `JWT_SECRET`, `BREVO_API_KEY`, `CLOUDINARY_URL`.

### Frontend (Vercel)
- **Domain**: `https://dealspheree.in`
- **Logic**: Detected automatically by `apiClient.js` to toggle between Production and Localhost.

---

## 7. Developer Cheat-Sheet
- **Start Backend**: `npm run dev` (Backend folder)
- **Start Expo**: `npm run web` or `npm run start` (mall-offers-app folder)
- **Cron Jobs**: Automated cleanup runs daily at **09:00 AM**.
- **Admin Stats**: Admin dashboard charts are generated via MongoDB aggregation in `routes/admin.js`.

---
*Last Updated: 2026-04-03*
