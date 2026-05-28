const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

// Load .env.local
const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
    const envConfig = require("dotenv").parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
    console.error("MONGODB_URI not found in .env.local");
    process.exit(1);
}

// Define schemas inline (same as models)
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: {
        type: String,
        enum: ["admin", "teacher", "parent", "student"],
        default: "admin"
    },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Parent" },
});

const teacherSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: String,
    subjects: [String],
    classes: [{
        classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
        section: String,
    }],
    qualifications: [String],
}, { timestamps: true });

const studentSchema = new mongoose.Schema({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true },
    email: { type: String, unique: true, sparse: true },
    password: String,
    dob: Date,
    gender: { type: String, enum: ["male", "female", "other"] },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
    section: String,
    admissionNo: { type: String, unique: true, sparse: true },
    admissionDate: Date,
    medical: {
        allergies: [String],
        notes: String,
    },
    parents: [{
        parentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        name: String,
        phone: String,
        email: String,
        relation: String,
    }],
    pickupInfo: {
        pickupPerson: String,
        pickupPhone: String,
    },
    documents: [{ name: String, url: String }],
}, { timestamps: true });

const classSchema = new mongoose.Schema({
    name: { type: String, required: true },
    section: { type: String, default: "A" },
    teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Teacher" }],
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
    roomNumber: String,
}, { timestamps: true });

const feeStructureSchema = new mongoose.Schema({
    name: { type: String, required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: false },
    heads: [{
        title: { type: String, required: true },
        amount: { type: Number, required: true },
        frequency: { type: String, enum: ["monthly", "quarterly", "yearly", "one-time"], default: "monthly" },
        dueDateDay: { type: Number, default: 1 }
    }],
    finePerDay: { type: Number, default: 0 },
    description: String,
    active: { type: Boolean, default: true }
}, { timestamps: true });

const timetableSchema = new mongoose.Schema({
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    day: { type: String, required: true },
    subject: { type: String, required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    roomNumber: String,
}, { timestamps: true });

const feeTransactionSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    structureId: { type: mongoose.Schema.Types.ObjectId, ref: "FeeStructure" },
    items: [{
        head: String,
        amount: Number,
    }],
    amountDue: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    fineAmount: { type: Number, default: 0 },
    status: { type: String, enum: ["due", "partial", "paid"], default: "due" },
    paymentMethod: { type: String, enum: ["cash", "razorpay", "online", "offline"], default: "cash" },
    paymentMeta: mongoose.Schema.Types.Mixed,
    receipts: [{ url: String, createdAt: Date }],
    note: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

// Models
const User = mongoose.models.User || mongoose.model("User", userSchema);
const Teacher = mongoose.models.Teacher || mongoose.model("Teacher", teacherSchema);
const Student = mongoose.models.Student || mongoose.model("Student", studentSchema);
const Class = mongoose.models.Class || mongoose.model("Class", classSchema);
const FeeStructure = mongoose.models.FeeStructure || mongoose.model("FeeStructure", feeStructureSchema);
const Timetable = mongoose.models.Timetable || mongoose.model("Timetable", timetableSchema);
const FeeTransaction = mongoose.models.FeeTransaction || mongoose.model("FeeTransaction", feeTransactionSchema);

async function clearExistingSampleData() {
    console.log("🗑️  Clearing existing sample data...");

    // Delete sample teachers
    await Teacher.deleteMany({
        email: {
            $in: [
                "priya.sharma@school.com",
                "amit.patel@school.com",
                "sneha.reddy@school.com",
                "rajesh.kumar@school.com"
            ]
        }
    });

    // Delete sample students
    await Student.deleteMany({
        admissionNo: {
            $in: ["STU001", "STU002", "STU003", "STU004", "STU005", "STU006"]
        }
    });

    // Delete sample parents
    await User.deleteMany({
        email: {
            $in: [
                "ramesh.gupta@parent.com",
                "sunita.verma@parent.com",
                "vikram.singh@parent.com",
                "anjali.mehta@parent.com"
            ]
        }
    });

    // Delete sample classes (but keep if they have other students)
    await Class.deleteMany({
        roomNumber: {
            $in: ["101", "102", "201", "202", "301", "302"]
        }
    });

    // Delete sample fee structures
    await FeeStructure.deleteMany({
        name: {
            $regex: /2024-25/
        }
    });

    // Delete sample timetables (for sample classes)
    await Timetable.deleteMany({
        roomNumber: {
            $in: ["101", "102", "201", "202", "301", "302"]
        }
    });

    // Delete sample fee transactions (for sample students)
    const sampleStudents = await Student.find({
        admissionNo: {
            $in: ["STU001", "STU002", "STU003", "STU004", "STU005", "STU006"]
        }
    }).select("_id");
    const studentIds = sampleStudents.map(s => s._id);
    await FeeTransaction.deleteMany({
        studentId: { $in: studentIds }
    });

    console.log("✅ Cleared existing sample data\n");
}

async function seedData() {
    try {
        console.log("🔌 Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB successfully!\n");

        // Clear existing sample data first
        await clearExistingSampleData();

        // Hash password for all users
        const hashedPassword = await bcrypt.hash("password123", 10);

        console.log("📚 Creating Classes...");
        const classes = await Class.insertMany([
            { name: "Nursery", section: "A", roomNumber: "101" },
            { name: "Nursery", section: "B", roomNumber: "102" },
            { name: "LKG", section: "A", roomNumber: "201" },
            { name: "LKG", section: "B", roomNumber: "202" },
            { name: "UKG", section: "A", roomNumber: "301" },
            { name: "UKG", section: "B", roomNumber: "302" },
        ]);
        console.log(`✅ Created ${classes.length} classes\n`);

        console.log("👨‍🏫 Creating Teachers...");
        const teachers = await Teacher.insertMany([
            {
                name: "Priya Sharma",
                email: "priya.sharma@school.com",
                password: hashedPassword,
                phone: "+91-9876543210",
                subjects: ["English", "EVS"],
                classes: [{ classId: classes[0]._id, section: "A" }],
                qualifications: ["B.Ed", "M.A. English"]
            },
            {
                name: "Amit Patel",
                email: "amit.patel@school.com",
                password: hashedPassword,
                phone: "+91-9876543211",
                subjects: ["Mathematics", "Science"],
                classes: [{ classId: classes[2]._id, section: "A" }],
                qualifications: ["B.Sc", "B.Ed"]
            },
            {
                name: "Sneha Reddy",
                email: "sneha.reddy@school.com",
                password: hashedPassword,
                phone: "+91-9876543212",
                subjects: ["Hindi", "Art"],
                classes: [{ classId: classes[4]._id, section: "A" }],
                qualifications: ["B.A.", "B.Ed"]
            },
            {
                name: "Rajesh Kumar",
                email: "rajesh.kumar@school.com",
                password: hashedPassword,
                phone: "+91-9876543213",
                subjects: ["Physical Education", "Music"],
                classes: [{ classId: classes[1]._id, section: "B" }],
                qualifications: ["B.P.Ed"]
            }
        ]);
        console.log(`✅ Created ${teachers.length} teachers\n`);

        console.log("👨‍👩‍👧 Creating Parent Users...");
        const parents = await User.insertMany([
            {
                name: "Ramesh Gupta",
                email: "ramesh.gupta@parent.com",
                password: hashedPassword,
                role: "parent"
            },
            {
                name: "Sunita Verma",
                email: "sunita.verma@parent.com",
                password: hashedPassword,
                role: "parent"
            },
            {
                name: "Vikram Singh",
                email: "vikram.singh@parent.com",
                password: hashedPassword,
                role: "parent"
            },
            {
                name: "Anjali Mehta",
                email: "anjali.mehta@parent.com",
                password: hashedPassword,
                role: "parent"
            }
        ]);
        console.log(`✅ Created ${parents.length} parent users\n`);

        console.log("👶 Creating Students...");
        const students = await Student.insertMany([
            {
                firstName: "Aarav",
                lastName: "Gupta",
                email: "aarav.gupta@student.com",
                password: hashedPassword,
                dob: new Date("2020-05-15"),
                gender: "male",
                classId: classes[0]._id,
                section: "A",
                admissionNo: "STU001",
                admissionDate: new Date("2024-04-01"),
                parents: [{
                    parentId: parents[0]._id,
                    name: "Ramesh Gupta",
                    phone: "+91-9876543220",
                    email: "ramesh.gupta@parent.com",
                    relation: "Father"
                }],
                medical: {
                    allergies: ["Peanuts"],
                    notes: "Requires inhaler for asthma"
                },
                pickupInfo: {
                    pickupPerson: "Ramesh Gupta",
                    pickupPhone: "+91-9876543220"
                }
            },
            {
                firstName: "Diya",
                lastName: "Verma",
                email: "diya.verma@student.com",
                password: hashedPassword,
                dob: new Date("2020-08-22"),
                gender: "female",
                classId: classes[0]._id,
                section: "A",
                admissionNo: "STU002",
                admissionDate: new Date("2024-04-01"),
                parents: [{
                    parentId: parents[1]._id,
                    name: "Sunita Verma",
                    phone: "+91-9876543221",
                    email: "sunita.verma@parent.com",
                    relation: "Mother"
                }],
                medical: {
                    allergies: [],
                    notes: ""
                },
                pickupInfo: {
                    pickupPerson: "Sunita Verma",
                    pickupPhone: "+91-9876543221"
                }
            },
            {
                firstName: "Arjun",
                lastName: "Singh",
                email: "arjun.singh@student.com",
                password: hashedPassword,
                dob: new Date("2019-03-10"),
                gender: "male",
                classId: classes[2]._id,
                section: "A",
                admissionNo: "STU003",
                admissionDate: new Date("2023-04-01"),
                parents: [{
                    parentId: parents[2]._id,
                    name: "Vikram Singh",
                    phone: "+91-9876543222",
                    email: "vikram.singh@parent.com",
                    relation: "Father"
                }],
                medical: {
                    allergies: ["Dairy"],
                    notes: "Lactose intolerant"
                },
                pickupInfo: {
                    pickupPerson: "Vikram Singh",
                    pickupPhone: "+91-9876543222"
                }
            },
            {
                firstName: "Ananya",
                lastName: "Mehta",
                email: "ananya.mehta@student.com",
                password: hashedPassword,
                dob: new Date("2018-11-30"),
                gender: "female",
                classId: classes[4]._id,
                section: "A",
                admissionNo: "STU004",
                admissionDate: new Date("2022-04-01"),
                parents: [{
                    parentId: parents[3]._id,
                    name: "Anjali Mehta",
                    phone: "+91-9876543223",
                    email: "anjali.mehta@parent.com",
                    relation: "Mother"
                }],
                medical: {
                    allergies: [],
                    notes: ""
                },
                pickupInfo: {
                    pickupPerson: "Anjali Mehta",
                    pickupPhone: "+91-9876543223"
                }
            },
            {
                firstName: "Ishaan",
                lastName: "Kapoor",
                email: "ishaan.kapoor@student.com",
                password: hashedPassword,
                dob: new Date("2020-01-18"),
                gender: "male",
                classId: classes[1]._id,
                section: "B",
                admissionNo: "STU005",
                admissionDate: new Date("2024-04-01"),
                medical: {
                    allergies: [],
                    notes: ""
                }
            },
            {
                firstName: "Sara",
                lastName: "Khan",
                email: "sara.khan@student.com",
                password: hashedPassword,
                dob: new Date("2019-07-25"),
                gender: "female",
                classId: classes[3]._id,
                section: "B",
                admissionNo: "STU006",
                admissionDate: new Date("2023-04-01"),
                medical: {
                    allergies: ["Shellfish"],
                    notes: ""
                }
            }
        ]);
        console.log(`✅ Created ${students.length} students\n`);

        // Update parent users with student IDs
        console.log("🔗 Linking parents to students...");
        await User.findByIdAndUpdate(parents[0]._id, { studentId: students[0]._id });
        await User.findByIdAndUpdate(parents[1]._id, { studentId: students[1]._id });
        await User.findByIdAndUpdate(parents[2]._id, { studentId: students[2]._id });
        await User.findByIdAndUpdate(parents[3]._id, { studentId: students[3]._id });
        console.log("✅ Linked parents to students\n");

        // Update classes with teachers and students
        console.log("🔗 Updating class rosters...");
        await Class.findByIdAndUpdate(classes[0]._id, {
            teachers: [teachers[0]._id],
            students: [students[0]._id, students[1]._id]
        });
        await Class.findByIdAndUpdate(classes[1]._id, {
            teachers: [teachers[3]._id],
            students: [students[4]._id]
        });
        await Class.findByIdAndUpdate(classes[2]._id, {
            teachers: [teachers[1]._id],
            students: [students[2]._id]
        });
        await Class.findByIdAndUpdate(classes[3]._id, {
            students: [students[5]._id]
        });
        await Class.findByIdAndUpdate(classes[4]._id, {
            teachers: [teachers[2]._id],
            students: [students[3]._id]
        });
        console.log("✅ Updated class rosters\n");

        console.log("💰 Creating Fee Structures...");
        const feeStructures = await FeeStructure.insertMany([
            {
                name: "Nursery Fee Structure 2024-25",
                classId: classes[0]._id,
                heads: [
                    { title: "Tuition Fee", amount: 5000, frequency: "monthly", dueDateDay: 5 },
                    { title: "Activity Fee", amount: 1000, frequency: "quarterly", dueDateDay: 10 },
                    { title: "Transport Fee", amount: 2000, frequency: "monthly", dueDateDay: 5 }
                ],
                finePerDay: 50,
                description: "Fee structure for Nursery section A & B",
                active: true
            },
            {
                name: "LKG Fee Structure 2024-25",
                classId: classes[2]._id,
                heads: [
                    { title: "Tuition Fee", amount: 6000, frequency: "monthly", dueDateDay: 5 },
                    { title: "Activity Fee", amount: 1200, frequency: "quarterly", dueDateDay: 10 },
                    { title: "Transport Fee", amount: 2000, frequency: "monthly", dueDateDay: 5 },
                    { title: "Books & Stationery", amount: 3000, frequency: "yearly", dueDateDay: 1 }
                ],
                finePerDay: 50,
                description: "Fee structure for LKG section A & B",
                active: true
            },
            {
                name: "UKG Fee Structure 2024-25",
                classId: classes[4]._id,
                heads: [
                    { title: "Tuition Fee", amount: 7000, frequency: "monthly", dueDateDay: 5 },
                    { title: "Activity Fee", amount: 1500, frequency: "quarterly", dueDateDay: 10 },
                    { title: "Transport Fee", amount: 2000, frequency: "monthly", dueDateDay: 5 },
                    { title: "Books & Stationery", amount: 3500, frequency: "yearly", dueDateDay: 1 },
                    { title: "Computer Lab Fee", amount: 2000, frequency: "yearly", dueDateDay: 1 }
                ],
                finePerDay: 50,
                description: "Fee structure for UKG section A & B",
                active: true
            },
            {
                name: "General Fee Structure 2024-25",
                heads: [
                    { title: "Admission Fee", amount: 10000, frequency: "one-time", dueDateDay: 1 },
                    { title: "Annual Charges", amount: 5000, frequency: "yearly", dueDateDay: 1 }
                ],
                finePerDay: 0,
                description: "General fee structure applicable to all classes",
                active: true
            }
        ]);
        console.log(`✅ Created ${feeStructures.length} fee structures\n`);

        console.log("📅 Creating Timetables...");
        const timetables = [];

        // Nursery A Timetable (Priya Sharma - English, EVS)
        const nurseryASchedule = [
            { day: "Monday", subject: "English", startTime: "09:00", endTime: "09:45" },
            { day: "Monday", subject: "Break", startTime: "09:45", endTime: "10:00" },
            { day: "Monday", subject: "EVS", startTime: "10:00", endTime: "10:45" },
            { day: "Monday", subject: "Art & Craft", startTime: "10:45", endTime: "11:30" },

            { day: "Tuesday", subject: "Mathematics", startTime: "09:00", endTime: "09:45" },
            { day: "Tuesday", subject: "Break", startTime: "09:45", endTime: "10:00" },
            { day: "Tuesday", subject: "English", startTime: "10:00", endTime: "10:45" },
            { day: "Tuesday", subject: "Music", startTime: "10:45", endTime: "11:30" },

            { day: "Wednesday", subject: "EVS", startTime: "09:00", endTime: "09:45" },
            { day: "Wednesday", subject: "Break", startTime: "09:45", endTime: "10:00" },
            { day: "Wednesday", subject: "Physical Education", startTime: "10:00", endTime: "10:45" },
            { day: "Wednesday", subject: "Story Time", startTime: "10:45", endTime: "11:30" },

            { day: "Thursday", subject: "English", startTime: "09:00", endTime: "09:45" },
            { day: "Thursday", subject: "Break", startTime: "09:45", endTime: "10:00" },
            { day: "Thursday", subject: "Mathematics", startTime: "10:00", endTime: "10:45" },
            { day: "Thursday", subject: "Art & Craft", startTime: "10:45", endTime: "11:30" },

            { day: "Friday", subject: "EVS", startTime: "09:00", endTime: "09:45" },
            { day: "Friday", subject: "Break", startTime: "09:45", endTime: "10:00" },
            { day: "Friday", subject: "English", startTime: "10:00", endTime: "10:45" },
            { day: "Friday", subject: "Free Play", startTime: "10:45", endTime: "11:30" },
        ];

        nurseryASchedule.forEach(slot => {
            timetables.push({
                classId: classes[0]._id,
                day: slot.day,
                subject: slot.subject,
                teacherId: teachers[0]._id, // Priya Sharma
                startTime: slot.startTime,
                endTime: slot.endTime,
                roomNumber: "101"
            });
        });

        // LKG A Timetable (Amit Patel - Math, Science)
        const lkgASchedule = [
            { day: "Monday", subject: "English", startTime: "09:00", endTime: "09:45" },
            { day: "Monday", subject: "Break", startTime: "09:45", endTime: "10:00" },
            { day: "Monday", subject: "Mathematics", startTime: "10:00", endTime: "10:45" },
            { day: "Monday", subject: "Art & Craft", startTime: "10:45", endTime: "11:30" },
            { day: "Monday", subject: "Lunch Break", startTime: "11:30", endTime: "12:00" },
            { day: "Monday", subject: "Science", startTime: "12:00", endTime: "12:45" },

            { day: "Tuesday", subject: "Mathematics", startTime: "09:00", endTime: "09:45" },
            { day: "Tuesday", subject: "Break", startTime: "09:45", endTime: "10:00" },
            { day: "Tuesday", subject: "Hindi", startTime: "10:00", endTime: "10:45" },
            { day: "Tuesday", subject: "Music", startTime: "10:45", endTime: "11:30" },
            { day: "Tuesday", subject: "Lunch Break", startTime: "11:30", endTime: "12:00" },
            { day: "Tuesday", subject: "English", startTime: "12:00", endTime: "12:45" },

            { day: "Wednesday", subject: "Science", startTime: "09:00", endTime: "09:45" },
            { day: "Wednesday", subject: "Break", startTime: "09:45", endTime: "10:00" },
            { day: "Wednesday", subject: "Physical Education", startTime: "10:00", endTime: "10:45" },
            { day: "Wednesday", subject: "Mathematics", startTime: "10:45", endTime: "11:30" },
            { day: "Wednesday", subject: "Lunch Break", startTime: "11:30", endTime: "12:00" },
            { day: "Wednesday", subject: "Story Time", startTime: "12:00", endTime: "12:45" },

            { day: "Thursday", subject: "English", startTime: "09:00", endTime: "09:45" },
            { day: "Thursday", subject: "Break", startTime: "09:45", endTime: "10:00" },
            { day: "Thursday", subject: "Mathematics", startTime: "10:00", endTime: "10:45" },
            { day: "Thursday", subject: "Art & Craft", startTime: "10:45", endTime: "11:30" },
            { day: "Thursday", subject: "Lunch Break", startTime: "11:30", endTime: "12:00" },
            { day: "Thursday", subject: "Science", startTime: "12:00", endTime: "12:45" },

            { day: "Friday", subject: "Mathematics", startTime: "09:00", endTime: "09:45" },
            { day: "Friday", subject: "Break", startTime: "09:45", endTime: "10:00" },
            { day: "Friday", subject: "English", startTime: "10:00", endTime: "10:45" },
            { day: "Friday", subject: "Computer Lab", startTime: "10:45", endTime: "11:30" },
            { day: "Friday", subject: "Lunch Break", startTime: "11:30", endTime: "12:00" },
            { day: "Friday", subject: "Free Play", startTime: "12:00", endTime: "12:45" },
        ];

        lkgASchedule.forEach(slot => {
            timetables.push({
                classId: classes[2]._id,
                day: slot.day,
                subject: slot.subject,
                teacherId: teachers[1]._id, // Amit Patel
                startTime: slot.startTime,
                endTime: slot.endTime,
                roomNumber: "201"
            });
        });

        // UKG A Timetable (Sneha Reddy - Hindi, Art)
        const ukgASchedule = [
            { day: "Monday", subject: "English", startTime: "09:00", endTime: "09:45" },
            { day: "Monday", subject: "Break", startTime: "09:45", endTime: "10:00" },
            { day: "Monday", subject: "Mathematics", startTime: "10:00", endTime: "10:45" },
            { day: "Monday", subject: "Hindi", startTime: "10:45", endTime: "11:30" },
            { day: "Monday", subject: "Lunch Break", startTime: "11:30", endTime: "12:00" },
            { day: "Monday", subject: "Science", startTime: "12:00", endTime: "12:45" },
            { day: "Monday", subject: "Art", startTime: "12:45", endTime: "13:30" },

            { day: "Tuesday", subject: "Mathematics", startTime: "09:00", endTime: "09:45" },
            { day: "Tuesday", subject: "Break", startTime: "09:45", endTime: "10:00" },
            { day: "Tuesday", subject: "Hindi", startTime: "10:00", endTime: "10:45" },
            { day: "Tuesday", subject: "English", startTime: "10:45", endTime: "11:30" },
            { day: "Tuesday", subject: "Lunch Break", startTime: "11:30", endTime: "12:00" },
            { day: "Tuesday", subject: "Music", startTime: "12:00", endTime: "12:45" },
            { day: "Tuesday", subject: "Computer Lab", startTime: "12:45", endTime: "13:30" },

            { day: "Wednesday", subject: "Science", startTime: "09:00", endTime: "09:45" },
            { day: "Wednesday", subject: "Break", startTime: "09:45", endTime: "10:00" },
            { day: "Wednesday", subject: "Physical Education", startTime: "10:00", endTime: "10:45" },
            { day: "Wednesday", subject: "Mathematics", startTime: "10:45", endTime: "11:30" },
            { day: "Wednesday", subject: "Lunch Break", startTime: "11:30", endTime: "12:00" },
            { day: "Wednesday", subject: "Hindi", startTime: "12:00", endTime: "12:45" },
            { day: "Wednesday", subject: "Art", startTime: "12:45", endTime: "13:30" },

            { day: "Thursday", subject: "English", startTime: "09:00", endTime: "09:45" },
            { day: "Thursday", subject: "Break", startTime: "09:45", endTime: "10:00" },
            { day: "Thursday", subject: "Mathematics", startTime: "10:00", endTime: "10:45" },
            { day: "Thursday", subject: "Hindi", startTime: "10:45", endTime: "11:30" },
            { day: "Thursday", subject: "Lunch Break", startTime: "11:30", endTime: "12:00" },
            { day: "Thursday", subject: "Science", startTime: "12:00", endTime: "12:45" },
            { day: "Thursday", subject: "Story Time", startTime: "12:45", endTime: "13:30" },

            { day: "Friday", subject: "Mathematics", startTime: "09:00", endTime: "09:45" },
            { day: "Friday", subject: "Break", startTime: "09:45", endTime: "10:00" },
            { day: "Friday", subject: "English", startTime: "10:00", endTime: "10:45" },
            { day: "Friday", subject: "Hindi", startTime: "10:45", endTime: "11:30" },
            { day: "Friday", subject: "Lunch Break", startTime: "11:30", endTime: "12:00" },
            { day: "Friday", subject: "Art", startTime: "12:00", endTime: "12:45" },
            { day: "Friday", subject: "Free Play", startTime: "12:45", endTime: "13:30" },
        ];

        ukgASchedule.forEach(slot => {
            timetables.push({
                classId: classes[4]._id,
                day: slot.day,
                subject: slot.subject,
                teacherId: teachers[2]._id, // Sneha Reddy
                startTime: slot.startTime,
                endTime: slot.endTime,
                roomNumber: "301"
            });
        });

        // Nursery B Timetable (Rajesh Kumar - PE, Music)
        const nurseryBSchedule = [
            { day: "Monday", subject: "English", startTime: "09:00", endTime: "09:45" },
            { day: "Monday", subject: "Break", startTime: "09:45", endTime: "10:00" },
            { day: "Monday", subject: "Physical Education", startTime: "10:00", endTime: "10:45" },
            { day: "Monday", subject: "Art & Craft", startTime: "10:45", endTime: "11:30" },

            { day: "Tuesday", subject: "Mathematics", startTime: "09:00", endTime: "09:45" },
            { day: "Tuesday", subject: "Break", startTime: "09:45", endTime: "10:00" },
            { day: "Tuesday", subject: "Music", startTime: "10:00", endTime: "10:45" },
            { day: "Tuesday", subject: "English", startTime: "10:45", endTime: "11:30" },

            { day: "Wednesday", subject: "EVS", startTime: "09:00", endTime: "09:45" },
            { day: "Wednesday", subject: "Break", startTime: "09:45", endTime: "10:00" },
            { day: "Wednesday", subject: "Physical Education", startTime: "10:00", endTime: "10:45" },
            { day: "Wednesday", subject: "Story Time", startTime: "10:45", endTime: "11:30" },

            { day: "Thursday", subject: "English", startTime: "09:00", endTime: "09:45" },
            { day: "Thursday", subject: "Break", startTime: "09:45", endTime: "10:00" },
            { day: "Thursday", subject: "Mathematics", startTime: "10:00", endTime: "10:45" },
            { day: "Thursday", subject: "Music", startTime: "10:45", endTime: "11:30" },

            { day: "Friday", subject: "EVS", startTime: "09:00", endTime: "09:45" },
            { day: "Friday", subject: "Break", startTime: "09:45", endTime: "10:00" },
            { day: "Friday", subject: "Physical Education", startTime: "10:00", endTime: "10:45" },
            { day: "Friday", subject: "Free Play", startTime: "10:45", endTime: "11:30" },
        ];

        nurseryBSchedule.forEach(slot => {
            timetables.push({
                classId: classes[1]._id,
                day: slot.day,
                subject: slot.subject,
                teacherId: teachers[3]._id, // Rajesh Kumar
                startTime: slot.startTime,
                endTime: slot.endTime,
                roomNumber: "102"
            });
        });

        await Timetable.insertMany(timetables);
        console.log(`✅ Created ${timetables.length} timetable entries\n`);

        console.log("💳 Creating Fee Transactions...");
        const feeTransactions = [];

        // Student 1 (Aarav Gupta) - Fully Paid
        feeTransactions.push({
            studentId: students[0]._id,
            parentId: parents[0]._id,
            structureId: feeStructures[0]._id,
            items: [
                { head: "Tuition Fee", amount: 5000 },
                { head: "Activity Fee", amount: 1000 },
                { head: "Transport Fee", amount: 2000 }
            ],
            amountDue: 8000,
            amountPaid: 8000,
            fineAmount: 0,
            status: "paid",
            paymentMethod: "online",
            note: "January 2025 fees - Paid in full"
        });

        // Student 2 (Diya Verma) - Partial Payment
        feeTransactions.push({
            studentId: students[1]._id,
            parentId: parents[1]._id,
            structureId: feeStructures[0]._id,
            items: [
                { head: "Tuition Fee", amount: 5000 },
                { head: "Activity Fee", amount: 1000 },
                { head: "Transport Fee", amount: 2000 }
            ],
            amountDue: 8000,
            amountPaid: 5000,
            fineAmount: 0,
            status: "partial",
            paymentMethod: "cash",
            note: "January 2025 fees - Partial payment"
        });

        // Student 3 (Arjun Singh) - Fully Paid
        feeTransactions.push({
            studentId: students[2]._id,
            parentId: parents[2]._id,
            structureId: feeStructures[1]._id,
            items: [
                { head: "Tuition Fee", amount: 6000 },
                { head: "Activity Fee", amount: 1200 },
                { head: "Transport Fee", amount: 2000 }
            ],
            amountDue: 9200,
            amountPaid: 9200,
            fineAmount: 0,
            status: "paid",
            paymentMethod: "online",
            note: "January 2025 fees - Paid in full"
        });

        // Student 4 (Ananya Mehta) - Due
        feeTransactions.push({
            studentId: students[3]._id,
            parentId: parents[3]._id,
            structureId: feeStructures[2]._id,
            items: [
                { head: "Tuition Fee", amount: 7000 },
                { head: "Activity Fee", amount: 1500 },
                { head: "Transport Fee", amount: 2000 }
            ],
            amountDue: 10500,
            amountPaid: 0,
            fineAmount: 150,
            status: "due",
            paymentMethod: "cash",
            note: "January 2025 fees - Payment pending"
        });

        // Student 5 (Ishaan Kapoor) - Partial Payment
        feeTransactions.push({
            studentId: students[4]._id,
            structureId: feeStructures[0]._id,
            items: [
                { head: "Tuition Fee", amount: 5000 },
                { head: "Transport Fee", amount: 2000 }
            ],
            amountDue: 7000,
            amountPaid: 3000,
            fineAmount: 0,
            status: "partial",
            paymentMethod: "cash",
            note: "January 2025 fees - Partial payment"
        });

        // Student 6 (Sara Khan) - Due
        feeTransactions.push({
            studentId: students[5]._id,
            structureId: feeStructures[1]._id,
            items: [
                { head: "Tuition Fee", amount: 6000 },
                { head: "Activity Fee", amount: 1200 }
            ],
            amountDue: 7200,
            amountPaid: 0,
            fineAmount: 100,
            status: "due",
            paymentMethod: "cash",
            note: "January 2025 fees - Payment pending"
        });

        // Add February fees for some students
        feeTransactions.push({
            studentId: students[0]._id,
            parentId: parents[0]._id,
            structureId: feeStructures[0]._id,
            items: [
                { head: "Tuition Fee", amount: 5000 },
                { head: "Transport Fee", amount: 2000 }
            ],
            amountDue: 7000,
            amountPaid: 7000,
            fineAmount: 0,
            status: "paid",
            paymentMethod: "online",
            note: "February 2025 fees - Paid in full"
        });

        feeTransactions.push({
            studentId: students[2]._id,
            parentId: parents[2]._id,
            structureId: feeStructures[1]._id,
            items: [
                { head: "Tuition Fee", amount: 6000 },
                { head: "Transport Fee", amount: 2000 }
            ],
            amountDue: 8000,
            amountPaid: 6000,
            fineAmount: 0,
            status: "partial",
            paymentMethod: "cash",
            note: "February 2025 fees - Partial payment"
        });

        await FeeTransaction.insertMany(feeTransactions);
        console.log(`✅ Created ${feeTransactions.length} fee transactions\n`);

        console.log("\n" + "=".repeat(80));
        console.log("🎉 SAMPLE DATA SEEDED SUCCESSFULLY!");
        console.log("=".repeat(80));
        console.log("\n📋 SUMMARY:");
        console.log(`   • Classes: ${classes.length}`);
        console.log(`   • Teachers: ${teachers.length}`);
        console.log(`   • Students: ${students.length}`);
        console.log(`   • Parents: ${parents.length}`);
        console.log(`   • Fee Structures: ${feeStructures.length}`);
        console.log(`   • Timetable Entries: ${timetables.length}`);
        console.log(`   • Fee Transactions: ${feeTransactions.length}`);

        console.log("\n🔑 LOGIN CREDENTIALS (All passwords: password123):");
        console.log("\n   👨‍💼 ADMIN:");
        console.log("      • admin@school.com");
        console.log("      • harshladukar@gmail.com (created earlier with password: admin123)");

        console.log("\n   👨‍🏫 TEACHERS:");
        teachers.forEach(t => console.log(`      • ${t.name.padEnd(20)} - ${t.email}`));

        console.log("\n   👶 STUDENTS:");
        students.forEach(s => console.log(`      • ${(s.firstName + ' ' + (s.lastName || '')).padEnd(20)} - ${s.email}`));

        console.log("\n   👨‍👩‍👧 PARENTS:");
        parents.forEach(p => console.log(`      • ${p.name.padEnd(20)} - ${p.email}`));

        console.log("\n" + "=".repeat(80) + "\n");

    } catch (error) {
        console.error("\n❌ Error seeding data:", error);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 Disconnected from MongoDB.");
        process.exit(0);
    }
}

seedData();
