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

// Use existing model if available, otherwise compile
const User = mongoose.models.User || mongoose.model("User", userSchema);

async function createAdminUser() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB successfully!");

        const email = "harshladukar@gmail.com";
        const plainPassword = "admin123";
        const name = "Harsh Ladukar";

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log(`\n❌ User with email ${email} already exists!`);
            console.log("User details:", {
                _id: existingUser._id,
                name: existingUser.name,
                email: existingUser.email,
                role: existingUser.role,
            });
            await mongoose.disconnect();
            process.exit(0);
        }

        // Hash the password
        console.log("Hashing password...");
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        // Create new admin user
        const newUser = new User({
            name: name,
            email: email,
            role: "admin",
            password: hashedPassword,
        });

        await newUser.save();
        console.log("\n✅ Admin user created successfully!");
        console.log("User details:", {
            _id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
        });
        console.log("\n📧 Email:", email);
        console.log("🔑 Password:", plainPassword);
        console.log("\nYou can now login with these credentials!");

    } catch (error) {
        console.error("\n❌ Error creating admin user:", error);
    } finally {
        await mongoose.disconnect();
        console.log("\nDisconnected from MongoDB.");
        process.exit(0);
    }
}

createAdminUser();
