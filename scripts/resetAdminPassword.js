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
    email: String,
    password: String,
    role: String
});

// Use existing model if available, otherwise compile
const User = mongoose.models.User || mongoose.model("User", userSchema);

async function main() {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected.");

        const email = "rohan@gmail.com";
        const newPassword = "Password123!"; // The password we want to use

        const user = await User.findOne({ email });
        if (!user) {
            console.log(`User ${email} not found.`);
            process.exit(0);
        }

        console.log(`User found: ${user.email}, Role: ${user.role}`);

        // Hash the password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user
        user.password = hashedPassword;
        await user.save();

        console.log(`Password for ${email} has been reset to '${newPassword}'`);
        console.log(`New Hash: ${hashedPassword}`);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

main();
