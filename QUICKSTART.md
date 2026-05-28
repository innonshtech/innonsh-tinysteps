# 🚀 Quick Start Guide - Admin UI

## Getting Started in 5 Minutes

### Step 1: Start Development Server
```bash
npm run dev
```
Server runs at `http://localhost:3000`

### Step 2: Navigate to Dashboard
```
http://localhost:3000/dashboard
```

### Step 3: Access Admin Modules

| Module | URL | Features |
|--------|-----|----------|
| Dashboard | `/dashboard` | Overview & stats |
| Students | `/students` | Manage students |
| Teachers | `/teachers` | Manage teachers |
| Classes | `/classes` | Manage classes |
| Admissions | `/admission` | Review applications |
| Attendance | `/attendance` | Mark attendance |
| Fees | `/fees` | Track payments |

---

## Common Tasks

### ➕ Add a New Student

1. Go to **Students** page
2. Click **"+ Add Student"** button
3. Fill in the form:
   - First Name (required)
   - Last Name
   - Date of Birth
   - Gender
   - Section
4. Click **"Add Student"**

### ➕ Add a New Teacher

1. Go to **Teachers** page
2. Click **"+ Add Teacher"** button
3. Fill required fields:
   - Name
   - Email
   - Phone (optional)
4. Add subjects using **"+ Add Subject"**
5. Click **"Add Teacher"**

### 🏫 Create a New Class

1. Go to **Classes** page
2. Click **"+ Add Class"** button
3. Enter:
   - Class Name (e.g., "Nursery", "KG1")
   - Section (A, B, C, D)
   - Room Number
4. Click **"Add Class"**

### ✅ Review Admissions

1. Go to **Admissions** page
2. View all pending applications
3. Click **"View"** to see details
4. Click **"Approve"** or **"Reject"**

### 📝 Mark Attendance

1. Go to **Attendance** page
2. Click **"+ Mark Attendance"** button
3. Select:
   - Student
   - Date
   - Status (Present/Absent/Late/Excused)
4. Add notes if needed
5. Click **"Mark Attendance"**

### 💰 Record Fee Payment

1. Go to **Fees** page
2. Click **"+ Record Payment"** button
3. Enter:
   - Student ID
   - Amount
   - Payment Mode (Cash/Check/Online)
4. Add description (optional)
5. Click **"Record Payment"**

---

## Component Usage Examples

### Using the Table Component
```tsx
<Table
  columns={[
    { key: "name", label: "Name" },
    { key: "email", label: "Email" }
  ]}
  data={students}
  loading={isLoading}
  actions={(row) => (
    <>
      <button onClick={() => edit(row)}>Edit</button>
      <button onClick={() => delete(row)}>Delete</button>
    </>
  )}
/>
```

### Using the Modal Component
```tsx
const [open, setOpen] = useState(false);

return (
  <>
    <button onClick={() => setOpen(true)}>Open Modal</button>
    <Modal
      isOpen={open}
      onClose={() => setOpen(false)}
      title="Confirm Action"
      footer={
        <>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="primary">Confirm</Button>
        </>
      }
    >
      Are you sure?
    </Modal>
  </>
);
```

### Using the Card Component
```tsx
<Card shadow="md" padding="lg">
  <h2>Card Title</h2>
  <p>Card content goes here</p>
</Card>
```

### Using the Button Component
```tsx
<Button variant="primary" size="lg" onClick={handleClick}>
  Primary Button
</Button>

<Button variant="secondary">Secondary</Button>
<Button variant="danger">Delete</Button>
<Button variant="success">Save</Button>
<Button variant="warning">Warning</Button>
```

### Using the Badge Component
```tsx
<Badge variant="success">Approved</Badge>
<Badge variant="danger">Rejected</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="info">Info</Badge>
```

### Using the Alert Component
```tsx
<Alert variant="success" closable>
  Operation completed successfully!
</Alert>

<Alert variant="error">
  An error occurred. Please try again.
</Alert>

<Alert variant="warning">
  Please review this before proceeding.
</Alert>
```

---

## Form Validation Examples

### Input Validation
```tsx
const [firstName, setFirstName] = useState("");
const [error, setError] = useState("");

const handleAdd = () => {
  if (!firstName.trim()) {
    setError("First name is required");
    return;
  }
  // Process...
};

<Input
  label="First Name"
  value={firstName}
  onChange={(e) => setFirstName(e.target.value)}
  error={error}
  fullWidth
/>
```

### Form Submission
```tsx
const [formData, setFormData] = useState({
  name: "",
  email: "",
  phone: ""
});

const handleSubmit = async () => {
  try {
    const response = await fetch("/api/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });
    
    if (response.ok) {
      setAlert({ type: "success", message: "Saved!" });
    }
  } catch (error) {
    setAlert({ type: "error", message: "Failed to save" });
  }
};
```

---

## Search & Filter Examples

### Search in Table
```tsx
const [searchTerm, setSearchTerm] = useState("");

const filtered = data.filter(item =>
  item.name.toLowerCase().includes(searchTerm.toLowerCase())
);

<Input
  placeholder="Search..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  icon="🔍"
/>

<Table data={filtered} columns={columns} />
```

### Filter by Status
```tsx
const [statusFilter, setStatusFilter] = useState("");

const filtered = data.filter(item =>
  !statusFilter || item.status === statusFilter
);

<Select
  value={statusFilter}
  onChange={(e) => setStatusFilter(e.target.value)}
>
  <option value="">All</option>
  <option value="pending">Pending</option>
  <option value="approved">Approved</option>
</Select>
```

---

## Dashboard Stats Display

```tsx
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  <StatsCard
    icon="👥"
    title="Students"
    value={totalStudents}
    description="Total enrolled"
    color="blue"
  />
  
  <StatsCard
    icon="👨‍🏫"
    title="Teachers"
    value={totalTeachers}
    description="Staff members"
    color="purple"
  />
  
  <StatsCard
    icon="🏫"
    title="Classes"
    value={totalClasses}
    description="Active classes"
    color="orange"
  />
  
  <StatsCard
    icon="📝"
    title="Admissions"
    value={totalAdmissions}
    description="Total applications"
    color="green"
  />
</div>
```

---

## Responsive Layout Example

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards automatically adjust from 1 column on mobile
       to 2 columns on tablet to 3 columns on desktop */}
  <Card>Column 1</Card>
  <Card>Column 2</Card>
  <Card>Column 3</Card>
</div>
```

---

## Common Patterns

### Loading State
```tsx
const [loading, setLoading] = useState(false);

useEffect(() => {
  const fetch = async () => {
    setLoading(true);
    try {
      const data = await fetchData();
      setData(data);
    } finally {
      setLoading(false);
    }
  };
  fetch();
}, []);

<Table data={data} loading={loading} />
```

### Error Handling
```tsx
const [alert, setAlert] = useState(null);

try {
  await api.call();
  setAlert({ type: "success", message: "Done!" });
} catch (error) {
  setAlert({ type: "error", message: "Failed!" });
}

{alert && <Alert variant={alert.type}>{alert.message}</Alert>}
```

### Modal with Form
```tsx
const [open, setOpen] = useState(false);
const [formData, setFormData] = useState({});

<Modal
  isOpen={open}
  onClose={() => setOpen(false)}
  title="Add Item"
  footer={
    <>
      <Button onClick={() => setOpen(false)}>Cancel</Button>
      <Button onClick={handleSave} variant="primary">Save</Button>
    </>
  }
>
  <Input
    label="Name"
    value={formData.name}
    onChange={(e) => setFormData({...formData, name: e.target.value})}
  />
</Modal>
```

---

## Keyboard Shortcuts

- **Tab** - Navigate between elements
- **Enter** - Activate buttons/links
- **Escape** - Close modals
- **Ctrl/Cmd + K** - Search (when implemented)

---

## Troubleshooting

### Page not loading?
1. Check browser console for errors
2. Verify API endpoints are working
3. Check network tab in DevTools
4. Restart development server: `npm run dev`

### Components not styling correctly?
1. Verify Tailwind CSS is imported
2. Check class names are correct
3. Clear browser cache
4. Rebuild CSS: `npm run build`

### API calls failing?
1. Check MongoDB connection
2. Verify .env variables
3. Check API route files
4. Test endpoints with curl/Postman

### TypeScript errors?
1. Run: `npm run lint`
2. Check type definitions
3. Install missing @types packages
4. Restart IDE

---

## Next Steps

1. ✅ Set up development environment
2. ✅ Explore the admin dashboard
3. ✅ Try each management module
4. ✅ Test create/edit/delete operations
5. ✅ Review API responses
6. ✅ Customize theme colors
7. ✅ Add custom components
8. ✅ Deploy to production

---

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [MongoDB Docs](https://docs.mongodb.com/)

---

**Happy Building! 🎉**

For more help, see `UI_DOCUMENTATION.md` and `ADMIN_UI_SETUP.md`
