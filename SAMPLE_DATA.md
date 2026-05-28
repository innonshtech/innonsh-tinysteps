# Sample Data Documentation

This document contains information about the sample data seeded in the database.

## Running the Seed Script

To populate the database with sample data, run:

```bash
node scripts/seedSampleData.js
```

**Note:** This script will clear any existing sample data before inserting new data to avoid duplicates.

## Sample Data Overview

### 📊 Summary
- **Classes:** 6 (Nursery A/B, LKG A/B, UKG A/B)
- **Teachers:** 4
- **Students:** 6
- **Parents:** 4
- **Fee Structures:** 4
- **Timetable Entries:** 100+ (Complete weekly schedules for 4 classes)

---

## 🔑 Login Credentials

**All passwords are: `password123`** (except admin@school.com uses `admin123`)

### 👨‍💼 Admin Users

| Name | Email | Password |
|------|-------|----------|
| School Administrator | admin@school.com | password123 |
| Harsh Ladukar | harshladukar@gmail.com | admin123 |

### 👨‍🏫 Teachers

| Name | Email | Subjects | Phone |
|------|-------|----------|-------|
| Priya Sharma | priya.sharma@school.com | English, EVS | +91-9876543210 |
| Amit Patel | amit.patel@school.com | Mathematics, Science | +91-9876543211 |
| Sneha Reddy | sneha.reddy@school.com | Hindi, Art | +91-9876543212 |
| Rajesh Kumar | rajesh.kumar@school.com | Physical Education, Music | +91-9876543213 |

### 👶 Students

| Name | Email | Admission No | Class | DOB | Gender |
|------|-------|--------------|-------|-----|--------|
| Aarav Gupta | aarav.gupta@student.com | STU001 | Nursery A | 2020-05-15 | Male |
| Diya Verma | diya.verma@student.com | STU002 | Nursery A | 2020-08-22 | Female |
| Arjun Singh | arjun.singh@student.com | STU003 | LKG A | 2019-03-10 | Male |
| Ananya Mehta | ananya.mehta@student.com | STU004 | UKG A | 2018-11-30 | Female |
| Ishaan Kapoor | ishaan.kapoor@student.com | STU005 | Nursery B | 2020-01-18 | Male |
| Sara Khan | sara.khan@student.com | STU006 | LKG B | 2019-07-25 | Female |

### 👨‍👩‍👧 Parents

| Name | Email | Child |
|------|-------|-------|
| Ramesh Gupta | ramesh.gupta@parent.com | Aarav Gupta |
| Sunita Verma | sunita.verma@parent.com | Diya Verma |
| Vikram Singh | vikram.singh@parent.com | Arjun Singh |
| Anjali Mehta | anjali.mehta@parent.com | Ananya Mehta |

---

## 📚 Classes

| Class Name | Section | Room Number | Teacher | Students |
|------------|---------|-------------|---------|----------|
| Nursery | A | 101 | Priya Sharma | Aarav Gupta, Diya Verma |
| Nursery | B | 102 | Rajesh Kumar | Ishaan Kapoor |
| LKG | A | 201 | Amit Patel | Arjun Singh |
| LKG | B | 202 | - | Sara Khan |
| UKG | A | 301 | Sneha Reddy | Ananya Mehta |
| UKG | B | 302 | - | - |

---

## 💰 Fee Structures

### 1. Nursery Fee Structure 2024-25
- **Class:** Nursery (All sections)
- **Fee Heads:**
  - Tuition Fee: ₹5,000/month (Due: 5th)
  - Activity Fee: ₹1,000/quarter (Due: 10th)
  - Transport Fee: ₹2,000/month (Due: 5th)
- **Late Fine:** ₹50/day

### 2. LKG Fee Structure 2024-25
- **Class:** LKG (All sections)
- **Fee Heads:**
  - Tuition Fee: ₹6,000/month (Due: 5th)
  - Activity Fee: ₹1,200/quarter (Due: 10th)
  - Transport Fee: ₹2,000/month (Due: 5th)
  - Books & Stationery: ₹3,000/year (Due: 1st)
- **Late Fine:** ₹50/day

### 3. UKG Fee Structure 2024-25
- **Class:** UKG (All sections)
- **Fee Heads:**
  - Tuition Fee: ₹7,000/month (Due: 5th)
  - Activity Fee: ₹1,500/quarter (Due: 10th)
  - Transport Fee: ₹2,000/month (Due: 5th)
  - Books & Stationery: ₹3,500/year (Due: 1st)
  - Computer Lab Fee: ₹2,000/year (Due: 1st)
- **Late Fine:** ₹50/day

### 4. General Fee Structure 2024-25
- **Class:** All classes
- **Fee Heads:**
  - Admission Fee: ₹10,000 (one-time)
  - Annual Charges: ₹5,000/year
- **Late Fine:** ₹0/day

---

## 📝 Student Details

### Aarav Gupta (STU001)
- **Parent:** Ramesh Gupta (Father)
- **Medical:** Allergies to Peanuts, Requires inhaler for asthma
- **Pickup:** Ramesh Gupta (+91-9876543220)

### Diya Verma (STU002)
- **Parent:** Sunita Verma (Mother)
- **Medical:** No allergies
- **Pickup:** Sunita Verma (+91-9876543221)

### Arjun Singh (STU003)
- **Parent:** Vikram Singh (Father)
- **Medical:** Allergies to Dairy, Lactose intolerant
- **Pickup:** Vikram Singh (+91-9876543222)

### Ananya Mehta (STU004)
- **Parent:** Anjali Mehta (Mother)
- **Medical:** No allergies
- **Pickup:** Anjali Mehta (+91-9876543223)

### Ishaan Kapoor (STU005)
- **Medical:** No allergies
- **Pickup:** Not specified

### Sara Khan (STU006)
- **Medical:** Allergies to Shellfish
- **Pickup:** Not specified

---

## 📅 Timetables

Complete weekly timetables have been created for all classes. Here are sample schedules:

### Nursery A (Room 101) - Teacher: Priya Sharma

| Time | Monday | Tuesday | Wednesday | Thursday | Friday |
|------|--------|---------|-----------|----------|--------|
| 09:00-09:45 | English | Mathematics | EVS | English | EVS |
| 09:45-10:00 | **Break** | **Break** | **Break** | **Break** | **Break** |
| 10:00-10:45 | EVS | English | Physical Education | Mathematics | English |
| 10:45-11:30 | Art & Craft | Music | Story Time | Art & Craft | Free Play |

### LKG A (Room 201) - Teacher: Amit Patel

| Time | Monday | Tuesday | Wednesday | Thursday | Friday |
|------|--------|---------|-----------|----------|--------|
| 09:00-09:45 | English | Mathematics | Science | English | Mathematics |
| 09:45-10:00 | **Break** | **Break** | **Break** | **Break** | **Break** |
| 10:00-10:45 | Mathematics | Hindi | Physical Education | Mathematics | English |
| 10:45-11:30 | Art & Craft | Music | Mathematics | Art & Craft | Computer Lab |
| 11:30-12:00 | **Lunch** | **Lunch** | **Lunch** | **Lunch** | **Lunch** |
| 12:00-12:45 | Science | English | Story Time | Science | Free Play |

### UKG A (Room 301) - Teacher: Sneha Reddy

| Time | Monday | Tuesday | Wednesday | Thursday | Friday |
|------|--------|---------|-----------|----------|--------|
| 09:00-09:45 | English | Mathematics | Science | English | Mathematics |
| 09:45-10:00 | **Break** | **Break** | **Break** | **Break** | **Break** |
| 10:00-10:45 | Mathematics | Hindi | Physical Education | Mathematics | English |
| 10:45-11:30 | Hindi | English | Mathematics | Hindi | Hindi |
| 11:30-12:00 | **Lunch** | **Lunch** | **Lunch** | **Lunch** | **Lunch** |
| 12:00-12:45 | Science | Music | Hindi | Science | Art |
| 12:45-13:30 | Art | Computer Lab | Art | Story Time | Free Play |

### Nursery B (Room 102) - Teacher: Rajesh Kumar

| Time | Monday | Tuesday | Wednesday | Thursday | Friday |
|------|--------|---------|-----------|----------|--------|
| 09:00-09:45 | English | Mathematics | EVS | English | EVS |
| 09:45-10:00 | **Break** | **Break** | **Break** | **Break** | **Break** |
| 10:00-10:45 | Physical Education | Music | Physical Education | Mathematics | Physical Education |
| 10:45-11:30 | Art & Craft | English | Story Time | Music | Free Play |

**Note:** All timetables include appropriate breaks and age-appropriate subjects for pre-primary education.

---

## 🎯 Testing Scenarios

You can use this sample data to test:

1. **Admin Dashboard:** Login as admin to manage all entities
2. **Teacher Portal:** Login as any teacher to view their assigned classes
3. **Parent Portal:** Login as a parent to view their child's information
4. **Student Portal:** Login as a student to view their profile
5. **Fee Management:** Test fee collection, structure management
6. **Class Management:** View and manage class rosters
7. **Timetable Management:** View and manage class timetables with complete weekly schedules
8. **Attendance:** Mark attendance for students in different classes
9. **Reports:** Generate various reports with the sample data

---

## 🔄 Re-seeding Data

If you need to reset the sample data:

1. The script automatically clears existing sample data before inserting new data
2. Simply run `node scripts/seedSampleData.js` again
3. All sample users, classes, and fee structures will be recreated

---

## ⚠️ Important Notes

- Sample data is identified by specific email patterns and admission numbers
- The script only clears sample data, not your actual production data
- Admin users created manually (like harshladukar@gmail.com) are preserved
- All passwords are hashed using bcrypt with 10 salt rounds
