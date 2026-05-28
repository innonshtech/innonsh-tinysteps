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

    const email = "admin@example.com";
    const password = "Password123!"; // The password from seedAdmin.js

    const user = await User.findOne({ email });
    if (!user) {
      console.log(`User ${email} not found.`);
      process.exit(0);
    }

    console.log(`User found: ${user.email}, Role: ${user.role}`);
    console.log(`Stored Hash: ${user.password}`);

    if (!user.password) {
      console.log("User has no password set.");
      process.exit(0);
    }

    console.log(`Testing password: "${password}"`);
    const match = await bcrypt.compare(password, user.password);
    console.log(`Match result: ${match}`);
    
    // Also test if the stored password IS null or empty string visually
    if (user.password === "") console.log("WARNING: Password is empty string");

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
