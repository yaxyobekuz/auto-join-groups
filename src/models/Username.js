const mongoose = require("mongoose");

const usernameSchema = new mongoose.Schema({
  createdAt: { type: Date, default: Date.now },
  username: { type: String, required: true },
});

module.exports = mongoose.model("Username", usernameSchema);
