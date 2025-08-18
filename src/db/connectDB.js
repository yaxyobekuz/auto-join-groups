const mongoose = require("mongoose");
const MONGODB_URI = process.env.MONGODB_URI;

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Mango Baza ulandi! ✅🥭🗿");
  } catch (err) {
    console.error("MongoDB ulanmadi ❌🥭🗿", err);
    process.exit(1);
  }
};

module.exports = connectDB;
