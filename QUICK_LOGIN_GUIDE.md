# Quick Login Reference Card

## Login Credentials (for testing)

### Admin
```
URL:      http://localhost:3000/auth/login
Role:     Admin
Email:    admin@school.com
Password: admin123
Dashboard: /dashboard
```

### Teacher
```
URL:      http://localhost:3000/auth/login
Role:     Teacher
Email:    teacher@school.com
Password: teacher123
Dashboard: /teacher-dashboard
```

### Parent
```
URL:      http://localhost:3000/auth/login
Role:     Parent
Email:    parent@email.com
Password: parent123
Dashboard: /parent-dashboard
```

### Student
```
URL:      http://localhost:3000/auth/login
Role:     Student
Email:    student@school.com
Password: student123
Dashboard: /student-dashboard
```

---

## Login Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    LOGIN PAGE (/auth/login)                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Select Role: [Admin ▼]  Email: [_______]          │    │
│  │               Password: [_______]  [LOGIN]          │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
            ┌──────────────────────────┐
            │ POST /api/auth/login     │
            │ - Verify email           │
            │ - Check password         │
            │ - Create JWT token       │
            │ - Set HTTP-Only Cookie   │
            └──────────────┬───────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────────┐
    │        JWT Token Created & Stored            │
    │  Role: admin/teacher/parent/student          │
    │  Expiry: 7 days                              │
    │  Storage: HTTP-Only Secure Cookie            │
    └──────────────┬───────────────────────────────┘
                   │
         ┌─────────┴──────────┬──────────────┬─────────────┐
         │                    │              │             │
         ▼                    ▼              ▼             ▼
    /dashboard        /teacher-dashboard  /student-     /parent-
    (Admin)           (Teacher)          dashboard    dashboard
                                         (Student)     (Parent)
```

---

## User Roles & Access

| Role | Dashboard | Modules | Key Features |
|------|-----------|---------|--------------|
| **Admin** | `/dashboard` | All | Full control, settings, user management |
| **Teacher** | `/teacher-dashboard` | Classes, Attendance, Grades, Exams | Manage classroom, mark attendance |
| **Student** | `/student-dashboard` | Attendance, Exams, Timetable | View own data, grades, schedule |
| **Parent** | `/parent-dashboard` | Child Tracking, Fees, Gallery | Monitor child's progress |

---

## Authentication Token Details

**Token Type:** JWT (JSON Web Token)

**Created on:** Login successful

**Stored in:** HTTP-Only Secure Cookie (browser)

**Expires:** 7 days

**Contains:**
- User ID
- User Role
- Timestamp

**Used for:**
- Authenticating protected API routes
- Validating dashboard access
- Storing user session

---

## API Endpoints Reference

### Authentication APIs
```
POST   /api/auth/login          → Login user
POST   /api/auth/register       → Register new user (if enabled)
GET    /api/auth/me             → Get current user info (requires token)
POST   /api/auth/logout         → Logout user (clears token)
```

### Example Login Request
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@school.com",
    "password": "admin123"
  }'
```

### Example Response
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Admin User",
    "email": "admin@school.com",
    "role": "admin"
  }
}
```

---

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| "Invalid email" | User not found | Create user account first |
| "Invalid password" | Wrong password | Re-enter correct password |
| Redirect to login after auth | Token not set | Check browser cookies enabled |
| Can't access dashboard | Token expired | Login again |
| Wrong dashboard on login | Role mismatch | Verify role in User database |

---

## Security Features

✅ Passwords hashed (bcryptjs)
✅ JWT tokens with expiry
✅ HTTP-Only cookies (no JS access)
✅ CSRF protection (SameSite attribute)
✅ Token validated on every request
✅ Role-based access control

---

## Session Duration

- **Login Valid For:** 7 days
- **Auto Logout:** After 7 days of no activity
- **Manual Logout:** Click Logout button in dashboard

---

## First Time Setup

1. **Start Application:**
   ```bash
   npm run dev
   ```

2. **Create Admin User:**
   ```bash
   # Via API or database seed
   POST /api/auth/register
   ```

3. **Login as Admin:**
   ```
   Email: admin@school.com
   Password: admin123
   ```

4. **Create Other Users:**
   - Teachers via Admin dashboard
   - Parents via Admin dashboard
   - Students via Admin dashboard

5. **Users Can Login:**
   - With their respective roles
   - Redirected to their dashboard
   - Access role-specific features

---

## Key Takeaways

- **Each role has a different dashboard** with role-specific features
- **Login is unified** - same `/auth/login` page for all roles
- **Role selection** happens during login via dropdown
- **Redirects are automatic** based on user's role
- **Session persists** for 7 days (HTTP-Only cookie)
- **Protected routes** require valid JWT token
- **Logout clears** the session cookie

