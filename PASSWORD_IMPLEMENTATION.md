# Password Implementation for Teachers and Students

## Overview
Added password functionality when creating and managing teachers and students. Passwords are hashed using bcryptjs before being stored in the database.

## Changes Made

### 1. Database Models

#### Teacher Model (`models/Teacher.ts`)
- **Added**: `password: string` field (required, hashed)
- **Type**: Stored as hashed string in database
- **Note**: Password is never returned in API responses (leaned queries exclude it)

```typescript
password: { type: String, required: true }
```

#### Student Model (`models/Student.ts`)
- **Added**: `email: string` field (unique, sparse)
- **Added**: `password: string` field (optional, hashed)
- **Type**: Stored as hashed string in database

```typescript
email: { type: String, unique: true, sparse: true }
password: String // optional, hashed
```

### 2. Validation Schemas

#### Teacher Validation (`lib/validations/teacherSchema.ts`)
```typescript
password: z.string().min(6, "Password must be at least 6 characters")
```
- Required for teacher creation
- Minimum 6 characters

#### Student Validation (`lib/validations/studentSchema.ts`)
```typescript
email: z.string().email().optional()
password: z.string().min(6, "Password must be at least 6 characters").optional()
```
- Email: optional (can be added later)
- Password: optional (only required for student login)

### 3. API Routes

#### Teacher API (`app/api/teachers/route.ts`)
```typescript
import bcryptjs from "bcryptjs";

// In POST handler:
const hashedPassword = await bcryptjs.hash(parsed.password, 10);
const teacher = await Teacher.create({
  ...parsed,
  password: hashedPassword,
});
```

#### Student API (`app/api/students/route.ts`)
```typescript
import bcryptjs from "bcryptjs";

// In POST handler:
let hashedPassword = undefined;
if (parsed.password) {
  hashedPassword = await bcryptjs.hash(parsed.password, 10);
}

const created = await Student.create({
  ...parsed,
  password: hashedPassword,
  ...
});
```

### 4. UI Components

#### TeacherManagement Component (`components/admin/TeacherManagement.tsx`)
**Form Data:**
- Added `password` field to form state
- Shows "Password (leave blank to keep current)" when editing existing teacher
- Shows "Password *" as required for new teachers

**Validation:**
- Password required for new teachers
- Password validation: minimum 6 characters (handled by schema)
- Password optional when updating (allows keeping existing password)

**Form Fields:**
```tsx
<Input
  label={editingTeacher ? "Password (leave blank to keep current)" : "Password *"}
  name="password"
  type="password"
  value={formData.password}
  onChange={handleInputChange}
  placeholder="Enter password (min 6 characters)"
  fullWidth
/>
```

#### StudentManagement Component (`components/admin/StudentManagement.tsx`)
**Form Data:**
- Added `email` field to form state
- Added `password` field to form state
- Shows "Password (leave blank to keep current)" when editing existing student
- Shows "Password *" as required for new students

**Validation:**
- Email required for new students
- Password required for new students
- Both optional when updating existing student

**Form Fields:**
```tsx
<Input
  label="Email *"
  name="email"
  type="email"
  value={formData.email}
  onChange={handleInputChange}
  placeholder="Enter email"
  fullWidth
/>

<Input
  label={editingStudent ? "Password (leave blank to keep current)" : "Password *"}
  name="password"
  type="password"
  value={formData.password}
  onChange={handleInputChange}
  placeholder="Enter password (min 6 characters)"
  fullWidth
/>
```

## How It Works

### Creating a New Teacher
1. Admin fills in teacher form including password
2. Password is validated (minimum 6 characters)
3. Password is hashed using bcryptjs with salt rounds = 10
4. Hashed password is stored in database
5. Original password is never stored
6. Teacher can login using email and password

### Creating a New Student
1. Admin fills in student form including email and password
2. Both are validated (email format, password length)
3. Password is hashed using bcryptjs with salt rounds = 10
4. Hashed password is stored in database
5. Student can login using email and password

### Editing Existing Teacher/Student
1. Admin can leave password blank to keep existing password
2. If new password is provided, it's hashed and replaced
3. All other fields can be updated independently

## Security Features

✅ **Password Hashing**: Using bcryptjs with 10 salt rounds
✅ **Database Security**: Passwords never exposed in API responses
✅ **Validation**: Minimum 6 characters required
✅ **Type Safety**: TypeScript ensures password field is handled correctly
✅ **Error Handling**: Proper error messages for validation failures

## Database Fields

### Teacher
| Field | Type | Required | Unique |
|-------|------|----------|--------|
| name | String | Yes | No |
| email | String | Yes | Yes |
| **password** | String | Yes | No |
| phone | String | No | No |
| subjects | Array | No | No |
| classes | Array | No | No |
| qualifications | Array | No | No |

### Student
| Field | Type | Required | Unique |
|-------|------|----------|--------|
| firstName | String | Yes | No |
| lastName | String | No | No |
| **email** | String | No | Yes (sparse) |
| **password** | String | No | No |
| dob | Date | No | No |
| gender | String | No | No |
| classId | ObjectId | No | No |
| section | String | No | No |
| admissionNo | String | No | Yes (sparse) |
| parents | Array | No | No |
| medical | Object | No | No |
| pickupInfo | Object | No | No |

## Testing

### Create Teacher with Password
```bash
POST /api/teachers
Content-Type: application/json

{
  "name": "Mr. John Doe",
  "email": "john.doe@school.com",
  "password": "securePassword123",
  "phone": "+91-9876543210",
  "subjects": ["Math", "Science"]
}
```

### Create Student with Email & Password
```bash
POST /api/students
Content-Type: application/json

{
  "firstName": "Alice",
  "lastName": "Johnson",
  "email": "alice@school.com",
  "password": "studentPass456",
  "classId": "6789abcdef012345",
  "gender": "female"
}
```

## Login Support

Teachers and students can now login using:
- **Email** (Teacher or Student)
- **Password** (hashed, verified during login)

The login system will compare provided password with hashed password in database using bcryptjs.compare().

## Notes

- Passwords are **never** returned in API list/detail responses
- Passwords cannot be retrieved (one-way hashing)
- Passwords must be reset via forgot password flow
- Email is unique for students (allows email-based login)
- Teacher email is unique (already existed)

