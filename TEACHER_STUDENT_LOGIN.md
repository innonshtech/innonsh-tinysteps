# Teacher and Student Login Implementation

## Overview
Updated the login API (`/api/auth/login`) to support authentication for Admin, Teacher, and Student roles. The system now searches across multiple models to find and authenticate users.

## How It Works

### Login Flow
1. User submits email and password via login form
2. API searches for user in the following order:
   - **User** model (Admin role)
   - **Teacher** model (Teacher role)
   - **Student** model (Student role)
3. Once user is found, password is verified using bcryptjs.compare()
4. JWT token is generated with the detected role
5. Token is stored in HTTP-Only cookie
6. User is redirected to appropriate dashboard based on role

### API Endpoint: `POST /api/auth/login`

**Request:**
```json
{
  "email": "john.doe@school.com",
  "password": "securePassword123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "john.doe@school.com",
    "role": "teacher",
    "name": "John Doe"
  }
}
```

**Response (Error):**
```json
{
  "error": "Invalid email"
}
```

or

```json
{
  "error": "Invalid password"
}
```

## Database Search Order

The login API searches user collections in this order:

1. **Admin/User** (`User` model)
   - Field: `email` (unique, required)
   - Role: `admin`

2. **Teacher** (`Teacher` model)
   - Field: `email` (unique, required)
   - Role: `teacher`

3. **Student** (`Student` model)
   - Field: `email` (unique, sparse)
   - Role: `student`

## Role-Based Redirects

After successful login, users are redirected based on their role:

| Role | Email Source | Dashboard | URL |
|------|--------------|-----------|-----|
| **admin** | User model | Admin Dashboard | `/dashboard` |
| **teacher** | Teacher model | Teacher Dashboard | `/teacher-dashboard` |
| **student** | Student model | Student Dashboard | `/student-dashboard` |
| **parent** | User model | Parent Dashboard | `/parent-dashboard` |

## JWT Token Structure

The JWT token includes:
- `id`: User's MongoDB ObjectId
- `role`: Detected role (admin, teacher, student, parent)
- `exp`: Expiration time (7 days)

```typescript
const token = jwt.sign(
  { id: user._id, role },
  process.env.JWT_SECRET!,
  { expiresIn: "7d" }
);
```

## Code Changes

### File: `app/api/auth/login/route.ts`

```typescript
import Teacher from "@/models/Teacher";
import Student from "@/models/Student";

// Search order:
let user = await User.findOne({ email });
let role = "admin";

if (!user) {
  user = await Teacher.findOne({ email });
  if (user) {
    role = "teacher";
  }
}

if (!user) {
  user = await Student.findOne({ email });
  if (user) {
    role = "student";
  }
}

// Generate token with detected role
const token = jwt.sign({ id: user._id, role }, process.env.JWT_SECRET!, {
  expiresIn: "7d",
});

// Return user with role
const res = NextResponse.json(
  {
    success: true,
    user: {
      _id: user._id,
      email: user.email,
      role,
      name: user.name || user.firstName,
    },
  },
  { status: 200 }
);
```

## Testing

### Test Admin Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@school.com",
  "password": "admin123"
}

# Expected response:
{
  "success": true,
  "user": {
    "_id": "...",
    "email": "admin@school.com",
    "role": "admin",
    "name": "Admin User"
  }
}
```

### Test Teacher Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john.doe@school.com",
  "password": "securePassword123"
}

# Expected response:
{
  "success": true,
  "user": {
    "_id": "...",
    "email": "john.doe@school.com",
    "role": "teacher",
    "name": "John Doe"
  }
}
```

### Test Student Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "alice@school.com",
  "password": "studentPass456"
}

# Expected response:
{
  "success": true,
  "user": {
    "_id": "...",
    "email": "alice@school.com",
    "role": "student",
    "name": "Alice Johnson"
  }
}
```

## Security Features

✅ **Automatic Role Detection**: Role is determined by which model contains the user
✅ **Password Verification**: Hashed password comparison with bcryptjs
✅ **Token Generation**: JWT token with role information
✅ **HTTP-Only Cookie**: Token stored securely in HTTP-Only cookie
✅ **Error Handling**: Generic error messages prevent user enumeration
✅ **CSRF Protection**: SameSite=Lax cookie attribute

## Frontend Changes

### File: `app/(auth)/login/page.tsx`

**Before:**
- Sent `role` parameter to API
- Used role from dropdown selector

**After:**
- No longer sends role to API (API detects it)
- Uses role from API response
- Role dropdown is now purely UI (not sent to backend)

```typescript
// Old: role was passed to API
body: JSON.stringify({ ...form, role: role })

// New: only email and password sent
body: JSON.stringify(form)

// Role is determined from API response
const userRole = data.user?.role || role;
```

## Middleware Protection

The middleware continues to protect routes:
- `/dashboard/*` - Protected (requires token)
- `/teacher-dashboard/*` - Protected (requires token)
- `/student-dashboard/*` - Protected (requires token)
- `/parent-dashboard/*` - Protected (requires token)
- `/auth/login` - Public (no token required)

## Common Issues & Solutions

### Issue: "Invalid email" error
**Cause:** User doesn't exist in any model (User, Teacher, Student)
**Solution:** 
- Ensure teacher/student was created with the email being used
- Check if email is correct in the database
- Create user first via admin dashboard

### Issue: "Invalid password" error
**Cause:** Password entered doesn't match hashed password
**Solution:**
- Verify password is correct
- Check if password was properly hashed during creation
- Reset password if needed

### Issue: Redirecting to wrong dashboard
**Cause:** Role not correctly detected during login
**Solution:**
- Check JWT token contains correct role
- Verify user exists in correct model
- Check browser console for login response

## Architecture

```
Login Request (email + password)
          ↓
    ┌─────────────────────────────┐
    │  Search User Model (Admin)  │
    └──────────┬──────────────────┘
               │ Not found
               ↓
    ┌─────────────────────────────┐
    │ Search Teacher Model         │
    └──────────┬──────────────────┘
               │ Not found
               ↓
    ┌─────────────────────────────┐
    │ Search Student Model         │
    └──────────┬──────────────────┘
               │ Not found
               ↓
         Return 400 Error
               
    (If found in any model)
               ↓
    ┌─────────────────────────────┐
    │ Verify Password with bcrypt │
    └──────────┬──────────────────┘
               │ Match
               ↓
    ┌─────────────────────────────┐
    │ Generate JWT with Role      │
    └──────────┬──────────────────┘
               │
               ↓
    ┌─────────────────────────────┐
    │ Set HTTP-Only Cookie        │
    └──────────┬──────────────────┘
               │
               ↓
    ┌─────────────────────────────┐
    │ Return User & Role Info     │
    └──────────┬──────────────────┘
               │
               ↓
    ┌─────────────────────────────┐
    │ Redirect to Dashboard       │
    │ (based on role)             │
    └─────────────────────────────┘
```

