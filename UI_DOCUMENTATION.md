# SchoolERP - Admin UI Documentation

## Overview
A modern, professional, and elegant Pre-Primary School ERP system UI built with Next.js, React, TypeScript, and Tailwind CSS.

## Design Principles

### Color Palette
- **Primary**: Blue (`#2563EB`)
- **Success**: Green (`#16A34A`)
- **Danger**: Red (`#DC2626`)
- **Warning**: Amber (`#D97706`)
- **Secondary**: Purple (`#9333EA`)
- **Background**: Gray (`#F3F4F6`)

### Typography
- Font Family: System fonts (-apple-system, Segoe UI, sans-serif)
- Base Size: 16px
- Line Height: 1.6

## Components

### Core UI Components

#### Button
```tsx
<Button variant="primary" size="md" onClick={handleClick}>
  Click Me
</Button>
```
Variants: `primary`, `secondary`, `danger`, `success`, `warning`, `outline`
Sizes: `sm`, `md`, `lg`

#### Card
```tsx
<Card shadow="md" padding="lg">
  Content here
</Card>
```
Shadow: `sm`, `md`, `lg`, `none`
Padding: `sm`, `md`, `lg`

#### Input
```tsx
<Input 
  label="Name" 
  placeholder="Enter your name"
  error={errors.name}
  fullWidth
/>
```

#### Select
```tsx
<Select label="Category" fullWidth>
  <option value="">Select...</option>
  <option value="1">Option 1</option>
</Select>
```

#### Table
```tsx
<Table
  columns={[
    { key: "name", label: "Name" },
    { key: "email", label: "Email" }
  ]}
  data={data}
  actions={(row) => <button>Edit</button>}
/>
```

#### Modal
```tsx
<Modal
  isOpen={open}
  onClose={() => setOpen(false)}
  title="Confirm"
  size="md"
>
  Content
</Modal>
```

#### Badge
```tsx
<Badge variant="success" size="md">
  Approved
</Badge>
```

#### Alert
```tsx
<Alert variant="success" closable>
  Operation successful!
</Alert>
```

### Layout Components

#### Navbar
Main navigation bar with user profile dropdown

#### Sidebar
Collapsible sidebar with role-based menu items

#### Breadcrumbs
Navigation breadcrumb trail

#### PageHeader
Page title with optional action button

#### Tabs
Tabbed interface component

### Admin-Specific Components

#### AdminDashboard
Overview with stats cards, quick actions, and pending items

#### StudentManagement
- List all students
- Add/Edit/Delete students
- Search and filter
- View student details

#### TeacherManagement
- List all teachers
- Add/Edit/Delete teachers
- Manage subjects and qualifications
- Search functionality

#### ClassManagement
- Create and manage classes
- Assign teachers and students
- View class details
- Section management

#### AdmissionManagement
- Review admission applications
- Approve/Reject admissions
- Track application status
- View detailed applications

#### AttendanceManagement
- Mark student attendance
- View attendance records
- Filter by date and status
- Generate reports

#### FeeManagement
- Record fee payments
- Track collections
- Manage fee transactions
- View payment history

## Layout Structure

```
App
├── Navbar (Top)
├── Sidebar (Left)
└── Main Content
    ├── Breadcrumbs
    ├── Page Header
    └── Page Content
```

## Styling Guidelines

### Spacing
- Use Tailwind's spacing scale (px, 1, 2, 3, 4, 6, 8)
- Consistent padding/margin throughout

### Borders & Shadows
- Shadow SM: Light hover effects
- Shadow MD: Cards and containers
- Shadow LG: Modals and dropdowns

### Responsive Design
- Mobile-first approach
- Breakpoints: `md` (768px), `lg` (1024px)
- Grid layouts: 1 col mobile, 2-3 col tablet/desktop

## State Management

Uses React hooks for local state:
- `useState` for component state
- `useEffect` for side effects
- Context API for authentication and global state

## API Integration

Components expect API endpoints:
- `/api/students` - CRUD for students
- `/api/teachers` - CRUD for teachers
- `/api/classes` - CRUD for classes
- `/api/admission/list` - List admissions
- `/api/attendance` - Mark/List attendance
- `/api/fees` - Track fee payments

## Accessibility

- Semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- High contrast ratios
- Focus states on interactive elements

## Performance Optimizations

- Lazy loading components
- Memoization where needed
- Optimized re-renders
- Efficient state updates

## Dark Mode Support

CSS variables support dark mode through Tailwind's dark mode system

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Future Enhancements

- [ ] Advanced filters and sorting
- [ ] Bulk operations
- [ ] Export to PDF/Excel
- [ ] Advanced analytics
- [ ] Two-factor authentication
- [ ] Activity logs
- [ ] Notifications system
- [ ] Role-based permission system
