# Authentication Flow Documentation

This document explains the step-by-step authentication flow for both sign-in and page refresh scenarios.

## 🔐 Sign-In Flow

### Step-by-Step Process:

1. **User submits login form** (`LoginForm.tsx`)
   - User enters email and password
   - Clicks "Sign in" button
   - `handleSubmit` is called

2. **LoginForm calls auth.login()** (`LoginForm.tsx`)
   - Calls `login(email, password)` from `useAuth` hook
   - Sets loading state
   - Shows error if login fails

3. **Step 1: Call /auth/signin** (`useAuth.tsx` → `api.ts`)
   - `apiClient.signIn({ email, password })` is called
   - Axios request is made: `POST /auth/signin`
   - Request includes: `withCredentials: true` (sends cookies)
   - Request body: `{ email, password }`

4. **Backend processes signin** (Backend)
   - Validates credentials
   - Sets HTTP-only cookies:
     - `access_token` (expires ~30 minutes)
     - `refresh_token` (expires ~7 days)
   - Cookies have: `SameSite=None; Secure; HttpOnly`
   - Returns 200 OK

5. **Step 2: Wait for cookies to be processed** (`useAuth.tsx`)
   - Waits 1000ms for browser to process Set-Cookie headers
   - Ensures cookies are available for subsequent requests

6. **Step 2.5: Optional cookie debug** (`useAuth.tsx`)
   - Calls `GET /auth/debug-cookies` to verify cookies are received by backend
   - This is for debugging purposes only

7. **Step 3: Verify authentication** (`useAuth.tsx` → `api.ts`)
   - Calls `apiClient.getMe()` → `GET /auth/me`
   - Request includes: `withCredentials: true` (sends cookies automatically)
   - Backend validates access token from cookie
   - Returns user info: `{ id, email }`

8. **Set user state** (`useAuth.tsx`)
   - Sets `user` state with user info
   - Sets `isAuthenticated` to `true`
   - Sets `token` to `'cookie'` (for compatibility)

9. **Render app** (`App.tsx`)
   - `AppContent` checks `token` (now `'cookie'`)
   - Since token exists, renders `<Layout />` instead of `<LoginForm />`
   - User sees the main application

---

## 🔄 Page Refresh / App Load Flow

### Step-by-Step Process:

1. **App loads** (`App.tsx`)
   - React app initializes
   - `<AuthProvider>` component mounts

2. **AuthProvider initializes** (`useAuth.tsx`)
   - Sets `isLoading = true`
   - Sets initial state: `user = null`, `isAuthenticated = false`
   - `useEffect` hook runs `checkAuth()` function

3. **Step 1: Try GET /auth/me** (`checkAuth()` → `api.ts`)
   - Calls `apiClient.getMe()` → `GET /auth/me`
   - Request includes: `withCredentials: true` (sends cookies automatically)
   - **Two possible outcomes:**

   **Outcome A: Access token still valid (~30 minutes)**
   - Backend validates access token from cookie
   - Returns 200 OK with user info: `{ id, email }`
   - Sets `user` state with user info
   - Sets `isAuthenticated = true`
   - Sets `isLoading = false`
   - User sees main application (no login screen)

   **Outcome B: Access token expired (401)**
   - Backend returns 401 Unauthorized
   - Goes to Step 2

4. **Step 2: Refresh token (if 401)** (`checkAuth()` → `api.ts`)
   - Calls `apiClient.refresh()` → `POST /auth/refresh`
   - Uses `fetch()` directly with `credentials: 'include'`
   - Request sends refresh token from cookie automatically
   - **Two possible outcomes:**

   **Outcome A: Refresh token valid (within 7 days)**
   - Backend validates refresh token from cookie
   - Creates new access token and refresh token
   - Sets new HTTP-only cookies (rotates refresh token)
   - Returns 200 OK
   - Goes to Step 3

   **Outcome B: Refresh token expired or doesn't exist**
   - Backend returns 401 Unauthorized
   - Sets `user = null`
   - Sets `isAuthenticated = false`
   - Sets `isLoading = false`
   - User sees login screen

5. **Step 3: Retry GET /auth/me (after successful refresh)** (`checkAuth()` → `api.ts`)
   - Calls `apiClient.getMe()` again → `GET /auth/me`
   - Request includes new access token from cookie
   - Backend validates new access token
   - Returns 200 OK with user info: `{ id, email }`
   - Sets `user` state with user info
   - Sets `isAuthenticated = true`
   - Sets `isLoading = false`
   - User sees main application (logged in)

6. **Render app based on auth state** (`App.tsx`)
   - While `isLoading = true`: Shows loading spinner
   - If `token` (user) exists: Renders `<Layout />` (main app)
   - If `token` is null: Renders `<LoginForm />` (login screen)

---

## 🔄 Automatic Token Refresh (During API Calls)

### When any API call returns 401:

1. **401 Response Interceptor catches error** (`api.ts`)
   - Request to any endpoint returns 401
   - Interceptor checks: not already retried, not an auth endpoint

2. **Queue request if already refreshing** (`api.ts`)
   - If another request is already refreshing, queues this request
   - Waits for refresh to complete

3. **Attempt refresh** (`api.ts`)
   - Sets `isRefreshing = true` to prevent concurrent refreshes
   - Calls `POST /auth/refresh` using `fetch()` with `credentials: 'include'`
   - Backend validates refresh token and issues new tokens
   - New cookies are set automatically

4. **Retry original request** (`api.ts`)
   - If refresh succeeds, retries the original request
   - New request includes new access token from cookie
   - Request should now succeed

5. **Handle refresh failure** (`api.ts`)
   - If refresh fails (refresh token expired)
   - Notifies auth context via `onAuthFailure()` callback
   - Clears auth state
   - Rejects original request
   - User will see login screen on next interaction

---

## 📋 Summary

### Sign-In:
1. POST /auth/signin → Sets cookies
2. Wait for cookies
3. GET /auth/me → Verify auth
4. Set user state → Show app

### Page Refresh / App Load:
1. GET /auth/me
   - ✅ Success → User logged in
   - ❌ 401 → Try refresh
2. POST /auth/refresh (if 401)
   - ✅ Success → Retry GET /auth/me → User logged in
   - ❌ 401 → Show login screen

### Automatic Refresh:
- Any API call returns 401
- Auto-refresh using refresh token
- Retry original request
- Seamless user experience

### Cookie Management:
- **All cookies are HTTP-only** (not accessible via JavaScript)
- **All cookies are set by backend** (frontend never stores tokens)
- **All requests include cookies** (`withCredentials: true`)
- **Cookies use SameSite=None; Secure** (cross-origin support)
- **Refresh token rotates** (extends 7-day window each refresh)

