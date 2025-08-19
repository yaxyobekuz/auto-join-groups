const mongoose = require("mongoose");

const usernameSchema = new mongoose.Schema({
  members: { type: Number, default: 0 },
  username: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Username", usernameSchema);
