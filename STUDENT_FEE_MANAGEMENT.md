# Student Fee Management Dashboard

## Overview
A comprehensive fee management system for admin/principal to track student fee payments, view detailed student information, and monitor payment status across all classes.

## Features

### 1. **Dashboard Overview**
- **Total Students Count** - See how many students are enrolled
- **Total Collected** - View total fees collected across all students
- **Total Pending** - Monitor outstanding fee payments
- **Payment Status Breakdown** - Quick view of paid, partial, and due counts

### 2. **Advanced Filtering**
- **Search** - Find students by name, admission number, or email
- **Class Filter** - Filter students by specific class and section
- **Status Filter** - View students by payment status (Paid/Partial/Due)

### 3. **Student Fee Table**
Displays comprehensive information for each student:
- Student name with avatar
- Admission number
- Class and section
- Total fee due
- Amount paid (in green)
- Pending amount (in red)
- Payment status badge
- "View Details" button for complete information

### 4. **Detailed Student View Modal**

When clicking "View Details", the admin sees:

#### **Student Profile Section**
- Student name with large avatar
- Admission number
- Email address
- Class and section
- Date of birth

#### **Parent Information**
- Parent name and relation (Father/Mother)
- Contact phone number
- Email address

#### **Fee Summary Cards**
- **Total Due** - Complete amount the student owes
- **Total Paid** - Amount already paid (in green)
- **Pending** - Outstanding balance (in red)

#### **Transaction History**
Detailed list of all fee transactions showing:
- Transaction status (Paid/Partial/Due)
- Transaction date
- Amount due, paid, and pending for each transaction
- Fee heads breakdown (Tuition, Activity, Transport, etc.)
- Payment notes

#### **Medical Information**
- Known allergies (highlighted in red)
- Medical notes and special requirements

## Usage

### For Admin/Principal:

1. **Navigate to Student Fee Management**
   - Access from the admin dashboard

2. **View All Students**
   - See complete list with payment status at a glance

3. **Filter by Class**
   - Select a specific class from the dropdown
   - View only students from that class

4. **Search for Specific Student**
   - Type name, admission number, or email
   - Results filter in real-time

5. **Check Payment Status**
   - Filter by "Paid", "Partial", or "Due"
   - Quickly identify students with pending payments

6. **View Student Details**
   - Click "View Details" button
   - See complete student profile
   - Review all fee transactions
   - Check parent contact information
   - View medical information

## Sample Data

The seed script creates sample fee transactions with different statuses:

### Paid Students:
- **Aarav Gupta** - ₹15,000 paid (2 months)
- **Arjun Singh** - ₹9,200 paid (January)

### Partial Payment:
- **Diya Verma** - ₹5,000 paid out of ₹8,000 due
- **Ishaan Kapoor** - ₹3,000 paid out of ₹7,000 due
- **Arjun Singh** - ₹6,000 paid out of ₹8,000 due (February)

### Due/Pending:
- **Ananya Mehta** - ₹10,500 pending (with ₹150 fine)
- **Sara Khan** - ₹7,200 pending (with ₹100 fine)

## API Endpoints

### GET `/api/fees/student-summary`
Fetches comprehensive fee data for all students.

**Authentication:** Admin only

**Response:**
```json
{
  "success": true,
  "students": [
    {
      "student": {
        "_id": "...",
        "firstName": "Aarav",
        "lastName": "Gupta",
        "admissionNo": "STU001",
        "classId": { "name": "Nursery", "section": "A" },
        "email": "aarav.gupta@student.com",
        "parents": [...],
        "medical": {...}
      },
      "totalDue": 15000,
      "totalPaid": 15000,
      "totalPending": 0,
      "totalFine": 0,
      "status": "paid",
      "transactions": [...]
    }
  ]
}
```

## Components

### Main Component
- **File:** `components/admin/StudentFeeManagement.tsx`
- **Purpose:** Main dashboard with filtering and student list

### Dependencies
- `Modal` - For student details popup
- `Button` - Styled buttons
- `Badge` - Status indicators
- `lucide-react` - Icons

## Color Coding

- **Green** - Paid amounts and successful status
- **Red** - Pending amounts and due status
- **Yellow/Orange** - Partial payment status
- **Blue** - General information and actions

## Benefits for Admin/Principal

1. **Quick Overview** - See all student fee status at a glance
2. **Easy Filtering** - Find specific students or classes quickly
3. **Detailed Information** - Access complete student and payment details
4. **Parent Contact** - Quickly reach out to parents for pending payments
5. **Payment Tracking** - Monitor payment history and trends
6. **Medical Awareness** - View important medical information when needed

## Future Enhancements

Potential features to add:
- Export to Excel/PDF
- Send payment reminders to parents
- Generate fee receipts
- Bulk payment collection
- Payment analytics and reports
- Fee collection by date range
- Automated fine calculation
