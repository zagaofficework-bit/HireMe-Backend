# HireMe Backend API — Developer Guide

> Complete reference for frontend developers integrating with the HireMe REST API.

---

## Table of Contents

1. [Base URL & Setup](#1-base-url--setup)
2. [Authentication Flow](#2-authentication-flow)
3. [Role System](#3-role-system)
4. [Standard Response Format](#4-standard-response-format)
5. [Modules & Endpoints](#5-modules--endpoints)
6. [Key Business Rules](#6-key-business-rules)
7. [File Uploads](#7-file-uploads)
8. [Error Codes Reference](#8-error-codes-reference)
9. [Environment Variables](#9-environment-variables)

---

## 1. Base URL & Setup

```
Development:  http://localhost:5000/api/v1
Production:   https://yourdomain.com/api/v1
Health Check: GET /health
```

### Axios Setup (recommended)

```js
// src/utils/api.js
import axios from 'axios';
import { auth } from './firebase';

const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
});

// Auto-attach fresh Firebase token before every request
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken(true); // true = refresh if expired
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

Use `api` instead of `axios` everywhere — token handling is automatic.

---

## 2. Authentication Flow

This project uses **Firebase Authentication** on the frontend. The backend only verifies Firebase tokens — it never handles passwords.

### Registration Flow

```
1. User signs up on Firebase (email/password, Google, phone OTP)
2. Firebase returns an idToken
3. Frontend calls your backend to create the MongoDB profile:

   POST /auth/register/user    ← for talent accounts
   POST /auth/register/client  ← for employer accounts

4. Backend creates the account with a permanent role
5. Frontend redirects to profile setup
```

### Login Flow

```
1. User logs in on Firebase
2. Firebase returns a fresh idToken
3. Frontend calls GET /auth/me to restore session
4. Backend returns user data (role, status, profile complete?)
5. Frontend stores user in Redux/Context
```

### Every Protected Request

```
Frontend attaches header:
  Authorization: Bearer <Firebase_idToken>

Backend:
  1. Verifies token with Firebase Admin SDK
  2. Fetches user from MongoDB
  3. Checks account is not banned/suspended
  4. Attaches user to req.user
  5. Passes to controller
```

> **Note:** Firebase tokens expire every 1 hour. The axios interceptor above handles auto-refresh — you never need to manually refresh tokens.

---

## 3. Role System

Three permanent roles — set at registration, **never changed**.

| Role | Who | What they can do |
|------|-----|-----------------|
| `user` | Talent/Job seeker | Create profile, upload resume, receive reviews |
| `client` | Employer/Recruiter | Search profiles, bookmark, review, create company |
| `admin` | Platform admin | Ban users, verify profiles/companies, moderate |

### How to check role on frontend

```js
const { data } = await api.get('/auth/me');
const { role, status } = data.data.user;

if (role === 'user')   // show profile builder
if (role === 'client') // show search/dashboard
if (role === 'admin')  // show admin panel
```

---

## 4. Standard Response Format

Every API response — success or error — follows the same shape.

### Success Response
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Profile fetched",
  "data": {
    "profile": { ... }
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Email is required" }
  ]
}
```

### Paginated Response
```json
{
  "success": true,
  "data": {
    "profiles": [ ... ],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 20,
      "pages": 8
    }
  }
}
```

---

## 5. Modules & Endpoints

### 🔐 Auth — `/api/v1/auth`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/register/user` | Firebase token | — | Register as talent |
| POST | `/register/client` | Firebase token | — | Register as employer |
| GET | `/me` | ✅ | any | Get own account info |

**Register body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+919876543210"
}
```

---

### 👤 Profiles — `/api/v1/profiles`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/` | ✅ | user | Create profile (once) |
| GET | `/me` | ✅ | any | Get own full profile |
| GET | `/:id` | optional | any | View public profile |
| PATCH | `/me/basic` | ✅ | user | Update name, bio, age |
| PATCH | `/me/skills` | ✅ | user | Update skills array |
| PATCH | `/me/experience` | ✅ | user | Update work history |
| PATCH | `/me/education` | ✅ | user | Update education |
| PATCH | `/me/preferences` | ✅ | user | Salary, work type, availability |
| PATCH | `/me/location` | ✅ | user | City, state, coordinates |
| PATCH | `/me/social` | ✅ | user | LinkedIn, GitHub, website |
| PATCH | `/me/contact` | ✅ | user | Email, phone (hidden from public) |
| PATCH | `/me/languages` | ✅ | user | Languages |
| PATCH | `/me/visibility` | ✅ | user | Toggle profile public/hidden |
| DELETE | `/me` | ✅ | user | Hide profile (soft delete) |

**Important:** `GET /:id` returns `contact` (email/phone) **only** if the viewer is a verified client. Check `canSeeContact` in response.

**Update skills body:**
```json
{
  "skills": [
    { "name": "React", "level": "expert" },
    { "name": "Node.js", "level": "intermediate" }
  ]
}
```

**Profile completion** — response includes `completionPercentage` (0–100). Show a progress bar on frontend.

---

### 📁 Uploads — `/api/v1/uploads`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/profile-image` | ✅ | user | Upload profile photo |
| POST | `/resume` | ✅ | user | Upload PDF resume |
| POST | `/portfolio` | ✅ | user | Upload up to 5 images |
| DELETE | `/portfolio/:itemId` | ✅ | user | Delete portfolio item |

> **Important:** Use `multipart/form-data` NOT `application/json` for uploads.

```js
// Frontend upload example
const formData = new FormData();
formData.append('profileImage', file); // key must match exactly

await api.post('/uploads/profile-image', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

| Endpoint | Form key | Allowed types | Max size |
|----------|----------|---------------|----------|
| `/profile-image` | `profileImage` | JPG, PNG, WebP | 2MB |
| `/resume` | `resume` | PDF only | 5MB |
| `/portfolio` | `portfolio` | JPG, PNG, WebP | 3MB each |

---

### 🏷 Categories — `/api/v1/categories`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/` | — | public | List all active categories |
| GET | `/:slug` | — | public | Get single category |
| POST | `/` | ✅ | admin | Create category |
| PATCH | `/:id` | ✅ | admin | Update category |
| DELETE | `/:id` | ✅ | admin | Delete category |

---

### 🏠 Homepage — `/api/v1/homepage`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | — | Stats + featured profiles + top categories |

**Response shape:**
```json
{
  "stats": {
    "totalTalents": 1200,
    "totalHirers": 340,
    "totalVerified": 89,
    "totalProfileViews": 45000,
    "display": {
      "talents": "1.2K+",
      "hirers": "340",
      "verified": "89",
      "views": "45.0K+"
    }
  },
  "topSkills": [
    { "skill": "React", "count": 234 }
  ],
  "featuredProfiles": [ ... ],
  "topCategories": [ ... ]
}
```

---

### 🔍 Search — `/api/v1/search`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | optional | Search profiles with filters |
| GET | `/suggestions?q=rea` | — | Skill autocomplete |
| GET | `/nearby` | optional | Profiles near coordinates |

**All search filters (query params):**

| Param | Type | Example | Description |
|-------|------|---------|-------------|
| `q` | string | `react developer` | Keyword search |
| `skills` | string | `React,Node.js` | Comma-separated skills |
| `category` | ObjectId | `64abc...` | Category ID |
| `city` | string | `Mumbai` | City filter |
| `state` | string | `Maharashtra` | State filter |
| `workType` | string | `remote` | remote / onsite / hybrid |
| `jobType` | string | `fulltime` | fulltime / parttime / freelance / internship |
| `availability` | string | `immediate` | immediate / one_week / two_weeks / one_month |
| `minSalary` | number | `50000` | Min expected salary |
| `maxSalary` | number | `100000` | Max expected salary |
| `minRate` | number | `500` | Min hourly rate |
| `maxRate` | number | `2000` | Max hourly rate |
| `verified` | boolean | `true` | Verified profiles only |
| `minRating` | number | `4` | Minimum star rating |
| `sortBy` | string | `top_rated` | newest / top_rated / most_viewed |
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Results per page (max 50) |

```js
// Example search call
const results = await api.get('/search', {
  params: {
    skills: 'React,Node.js',
    workType: 'remote',
    city: 'Mumbai',
    sortBy: 'top_rated',
    page: 1,
    limit: 20
  }
});
```

---

### 🏢 Company — `/api/v1/company`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/` | ✅ | client | Create company profile |
| GET | `/me` | ✅ | client | Get own company |
| PATCH | `/me` | ✅ | client | Update company |
| POST | `/me/logo` | ✅ | client | Upload company logo |
| GET | `/:slug` | — | public | View company profile |
| GET | `/admin/all` | ✅ | admin | List all companies |
| PATCH | `/admin/:id/verify` | ✅ | admin | Verify company |
| PATCH | `/admin/:id/reject` | ✅ | admin | Reject company |

> **Business rule:** Client can only see user contact details (email/phone) AFTER their company is verified by admin.

---

### ⭐ Reviews — `/api/v1/reviews`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/` | ✅ | client | Submit review |
| GET | `/profile/:profileId` | — | public | Get profile reviews |
| GET | `/my` | ✅ | client | My submitted reviews |
| PATCH | `/:id` | ✅ | client | Edit own review |
| DELETE | `/:id` | ✅ | client | Delete own review |
| PATCH | `/:id/toggle-visibility` | ✅ | admin | Hide/show review |

**Submit review body:**
```json
{
  "profileId": "64abc123...",
  "rating": 5,
  "comment": "Excellent developer, delivered on time"
}
```

> Profile `averageRating` and `totalReviews` auto-update after every review change.

---

### 🔖 Bookmarks — `/api/v1/bookmarks`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/` | ✅ | client | Bookmark a profile |
| GET | `/` | ✅ | client | Get all bookmarks |
| GET | `/tags` | ✅ | client | Get my bookmark tags |
| GET | `/check/:profileId` | ✅ | client | Is this bookmarked? |
| PATCH | `/:id` | ✅ | client | Update tag/note |
| DELETE | `/:profileId` | ✅ | client | Remove bookmark |

**Bookmark body:**
```json
{
  "profileId": "64abc123...",
  "tag": "React Developers",
  "note": "Strong portfolio, follow up next week"
}
```

---

### 🚩 Reports — `/api/v1/reports`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/` | ✅ | any | File a report |
| GET | `/my` | ✅ | any | My filed reports |
| GET | `/admin` | ✅ | admin | All reports |
| GET | `/admin/stats` | ✅ | admin | Report statistics |
| GET | `/admin/:id` | ✅ | admin | Single report detail |
| PATCH | `/admin/:id/resolve` | ✅ | admin | Resolve report |

**Report reasons:** `fake_profile` `spam` `abusive_content` `misleading_info` `inappropriate_image` `other`

---

### 🔔 Notifications — `/api/v1/notifications`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ✅ | Get all notifications |
| GET | `/unread-count` | ✅ | Unread bell count |
| PATCH | `/mark-all-read` | ✅ | Mark all as read |
| PATCH | `/:id/read` | ✅ | Mark one as read |
| DELETE | `/:id` | ✅ | Delete notification |

**Notification types:**
```
profile_viewed        profile_shortlisted    review_received
account_banned        account_suspended      account_unbanned
verification_approved verification_rejected
company_verified      company_rejected
report_resolved       admin_warning
```

**Unread count for bell icon:**
```js
const { data } = await api.get('/notifications/unread-count');
setBellCount(data.data.count); // poll every 30 seconds
```

---

### ✅ Verification — `/api/v1/verification`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/status` | ✅ | Check email + phone verified |
| POST | `/send-email` | ✅ | Send verification email |
| POST | `/verify-email` | ✅ | Verify with token |
| POST | `/send-phone-otp` | ✅ | Send OTP (placeholder) |
| POST | `/verify-phone` | ✅ | Verify OTP |

---

### 📊 Analytics — `/api/v1/analytics`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/homepage` | — | public | Basic platform stats |
| GET | `/admin/dashboard` | ✅ | admin | Full platform metrics |

---

### 🛡 Admin — `/api/v1/admin`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/overview` | ✅ admin | Platform counts |
| GET | `/users` | ✅ admin | List all users |
| GET | `/users/:id` | ✅ admin | User + profile + company |
| PATCH | `/users/:id/ban` | ✅ admin | Ban user |
| PATCH | `/users/:id/unban` | ✅ admin | Unban user |
| PATCH | `/users/:id/suspend` | ✅ admin | Suspend user |
| PATCH | `/users/:id/unsuspend` | ✅ admin | Unsuspend user |
| PATCH | `/profiles/:id/feature` | ✅ admin | Feature on homepage |
| PATCH | `/profiles/:id/verify` | ✅ admin | Give verified badge |
| DELETE | `/profiles/:id` | ✅ admin | Hide profile |

---

## 6. Key Business Rules

These are enforced server-side — frontend should reflect them in UI:

```
1. ROLES ARE PERMANENT
   Once registered as user or client, role never changes.
   Show correct UI based on role from /auth/me.

2. CONTACT DETAILS ARE GATED
   Phone and email on profiles are HIDDEN unless:
   - Viewer is a client AND
   - Client's company is verified by admin
   Check canSeeContact in profile response.

3. ONE PROFILE PER USER
   POST /profiles → 409 if already exists.
   Always call GET /profiles/me first on profile page load.

4. ONE REVIEW PER CLIENT PER USER
   409 error if client tries to review same user twice.
   Show edit button instead of submit if review exists.

5. BANNED/SUSPENDED USERS
   GET /auth/me returns 403 with clear message.
   Redirect to a banned screen on frontend.

6. PROFILE VISIBILITY
   Users can hide their profile via PATCH /profiles/me/visibility.
   Hidden profiles return 403 on public view.
   Don't show hidden profiles in search.

7. PROFILE COMPLETION
   Every profile update returns completionPercentage (0-100).
   Show progress bar — encourages users to fill everything.
```

---

## 7. File Uploads

All files go to **Cloudinary** — never stored on server.

```
Profile image  → auto-cropped to 400x400, face-detected
Resume PDF     → stored as raw file, direct download URL
Portfolio      → auto-optimized, max 10 items total
Company logo   → resized to 300x300
```

**Old files are automatically deleted** when replaced — no orphaned files.

---

## 8. Error Codes Reference

| Status | Meaning | Common cause |
|--------|---------|--------------|
| 400 | Bad Request | Validation failed, bad input |
| 401 | Unauthorized | No token, expired token |
| 403 | Forbidden | Wrong role, banned account |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate (already registered, already reviewed) |
| 429 | Too Many Requests | Rate limit hit |
| 500 | Server Error | Something broke on backend |

---

## 9. Environment Variables

The backend needs these in `.env`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://...
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY_ID=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=...
FIREBASE_CLIENT_ID=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
ALLOWED_ORIGINS=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

---

## Quick Start Checklist for Frontend Dev

```
□ Get Firebase config from backend dev (project ID, web API key)
□ Set up Firebase client SDK in React
□ Copy the axios interceptor above into your project
□ Call GET /auth/me on app load to restore session
□ Store user.role and user.status in Redux/Context
□ Build role-based routing (user vs client vs admin)
□ For uploads: always use FormData, not JSON
□ For search: all filters are optional query params
□ Poll GET /notifications/unread-count every 30s for bell
□ Check canSeeContact before showing contact details
```

---

*Total endpoints: 52 | Backend: Node.js + Express + MongoDB + Firebase*