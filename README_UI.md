# 🎓 School ERP - Complete Admin UI System

A modern, professional, and elegant Pre-Primary School ERP system with a complete admin interface built with Next.js, React 19, TypeScript, and Tailwind CSS.

![Status](https://img.shields.io/badge/Status-Production%20Ready-green)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

### 📊 Dashboard
- Overview with key metrics
- Student enrollment statistics
- Teacher and class management stats
- Pending admissions indicator
- Quick action buttons
- System information display

### 👥 Student Management
- Complete student CRUD operations
- Search and filter functionality
- Student enrollment tracking
- Parent information management
- Medical and emergency contact details
- Document upload and tracking

### 👨‍🏫 Teacher Management
- Teacher profile management
- Subject assignment
- Class assignment tracking
- Qualification management
- Contact information management

### 📚 Class Management
- Class creation and organization
- Section management
- Teacher assignment to classes
- Student enrollment by class
- Room number tracking

### 📝 Admission Management
- Application submission tracking
- Status workflow (submitted → pending → approved/rejected → enrolled)
- Batch application review
- Fee tracking
- Document verification

### ✅ Attendance Management
- Daily attendance marking
- Attendance status tracking (present, absent, late, excused)
- Attendance reports and statistics
- Historical attendance data

### 💰 Fee Management
- Fee collection tracking
- Payment mode recording (cash, check, online)
- Fee structure management
- Outstanding payment tracking
- Payment history and receipts

### 🎨 UI/UX Highlights

#### Component Library
- **15+ Reusable Components** - Buttons, Cards, Tables, Modals, Forms, etc.
- **Consistent Design System** - Color palette, typography, spacing
- **Responsive Design** - Mobile, tablet, and desktop layouts
- **Dark Mode Ready** - CSS variable support for theming

#### Design Standards
- **Professional Look** - Modern, clean, corporate design
- **Accessibility** - WCAG AA compliance with semantic HTML
- **Performance** - Optimized components and lazy loading
- **Type Safety** - Full TypeScript implementation

## 🛠️ Technology Stack

```json
{
  "framework": "Next.js 16.0.3",
  "runtime": "React 19.2.0",
  "language": "TypeScript 5.x",
  "styling": "Tailwind CSS 4.x",
  "backend": "MongoDB with Mongoose",
  "authentication": "JWT",
  "payment": "Razorpay",
  "upload": "Cloudinary"
}
```

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- MongoDB
- Git

### Setup Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd myapp
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```
MONGODB_URI=mongodb://localhost:27017/school-erp
JWT_SECRET=your-secret-key
NEXT_PUBLIC_API_URL=http://localhost:3000/api
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
CLOUDINARY_API_KEY=your-cloudinary-key
```

4. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
myapp/
├── app/
│   ├── api/                    # API routes
│   ├── (auth)/                # Authentication pages
│   ├── dashboard/             # Admin dashboard
│   ├── students/              # Student management
│   ├── teachers/              # Teacher management
│   ├── classes/               # Class management
│   ├── admission/             # Admission management
│   ├── attendance/            # Attendance tracking
│   ├── fees/                  # Fee management
│   ├── layout.tsx             # Root layout
│   └── globals.css            # Global styles
├── components/
│   ├── common/                # Shared UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Table.tsx
│   │   ├── Modal.tsx
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   └── ...
│   └── admin/                 # Admin-specific components
│       ├── AdminDashboard.tsx
│       ├── StudentManagement.tsx
│       ├── TeacherManagement.tsx
│       └── ...
├── context/                   # React Context API
│   ├── AuthContext.tsx
│   ├── StudentContext.tsx
│   └── ...
├── models/                    # MongoDB schemas
│   ├── Student.ts
│   ├── Teacher.ts
│   ├── User.ts
│   └── ...
├── utils/                     # Utility functions
│   ├── helpers.ts
│   ├── validators.ts
│   ├── permissions.ts
│   └── ...
├── styles/                    # Global styles
│   ├── theme.css
│   └── variables.css
└── public/                    # Static assets
```

## 🎯 Core Components

### Layout Components
```tsx
<Navbar />          // Top navigation
<Sidebar />         // Side navigation
<Breadcrumbs />     // Breadcrumb trail
<PageHeader />      // Page title and actions
```

### Data Display
```tsx
<Table />           // Data tables
<Card />            // Content containers
<Badge />           // Status badges
<Alert />           // Notifications
```

### Forms & Input
```tsx
<Input />           // Text input
<Select />          // Dropdowns
<FormLayout />      // Form structure
```

### Feedback
```tsx
<Modal />           // Dialogs
<Loader />          // Loading indicator
<Alert />           // Alert messages
<StatsCard />       // Statistics display
```

## 🔐 Authentication & Authorization

The system uses role-based access control (RBAC):

- **Admin**: Full system access
- **Teacher**: Attendance, timetable, exams
- **Parent**: Dashboard, gallery, notifications

```tsx
// Protected routes example
<Protected module="students">
  <StudentManagement />
</Protected>
```

## 🎨 Customization

### Change Color Scheme
Edit `app/globals.css` and `styles/theme.css`:
```css
:root {
  --color-primary: #your-color;
  --color-success: #your-color;
  /* ... */
}
```

### Add Custom Component
```tsx
// components/common/CustomComponent.tsx
export default function CustomComponent() {
  return <div>Custom content</div>;
}
```

### Extend Tailwind Config
Edit `tailwind.config.ts` for custom utilities and themes.

## 📱 Responsive Design

```
Mobile      < 768px    - Single column, stacked layout
Tablet      768-1024px - Two columns, visible sidebar
Desktop     > 1024px   - Full multi-column layout
```

All components are fully responsive and tested across devices.

## ♿ Accessibility

- **WCAG 2.1 AA Compliance** - High contrast, proper semantics
- **Keyboard Navigation** - Full keyboard support
- **Screen Reader Support** - ARIA labels and roles
- **Focus Management** - Clear focus states

## 📈 Performance Optimization

- **Code Splitting** - Lazy loaded components
- **Image Optimization** - Next.js Image component
- **CSS Optimization** - Purged unused styles
- **API Caching** - Efficient data fetching

## 🧪 Testing

```bash
# Run tests
npm run test

# Run linter
npm run lint

# Build for production
npm run build
```

## 📚 Documentation

- `UI_DOCUMENTATION.md` - Component API reference
- `ADMIN_UI_SETUP.md` - Setup and integration guide
- Component JSDoc comments - Inline documentation

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Follow the code style
4. Test your changes
5. Submit a pull request

## 📊 API Endpoints

### Students
```
GET    /api/students              - List all students
POST   /api/students              - Create student
GET    /api/students/:id          - Get student details
PUT    /api/students/:id          - Update student
DELETE /api/students/:id          - Delete student
```

### Teachers
```
GET    /api/teachers              - List all teachers
POST   /api/teachers              - Create teacher
PUT    /api/teachers/:id          - Update teacher
DELETE /api/teachers/:id          - Delete teacher
```

### Classes
```
GET    /api/classes               - List all classes
POST   /api/classes               - Create class
PUT    /api/classes/:id           - Update class
DELETE /api/classes/:id           - Delete class
```

### Admissions
```
GET    /api/admission/list        - List admissions
POST   /api/admission/apply       - Submit application
POST   /api/admission/approve     - Approve application
POST   /api/admission/reject      - Reject application
```

### Attendance
```
GET    /api/attendance            - List attendance
POST   /api/attendance            - Mark attendance
GET    /api/attendance/:studentId - Student attendance
```

### Fees
```
GET    /api/fees                  - List fee transactions
POST   /api/fees                  - Record payment
GET    /api/fees/structure        - Fee structures
```

## 🐛 Known Issues

None at this time. Please report any issues found.

## 🚀 Deployment

### Vercel
```bash
npm run build
vercel deploy
```

### Docker
```bash
docker build -t school-erp .
docker run -p 3000:3000 school-erp
```

### Traditional Server
```bash
npm run build
npm run start
```

## 📞 Support & Contact

For support, questions, or suggestions:
- Open an issue on GitHub
- Email: support@schoolerp.com
- Documentation: See docs/ folder

## 📄 License

MIT License - feel free to use in your projects.

## 🎉 Changelog

### Version 1.0.0 (December 2025)
- Initial release
- Complete admin UI implementation
- All core features implemented
- Full TypeScript support
- Production-ready

---

**Made with ❤️ for educators and administrators**

![Screenshot](./public/screenshots/dashboard.png)
