const mongoose = require("mongoose");

const countSchema = new mongoose.Schema({
  count: { type: Number, default: 0 },
  joined: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Count", countSchema);
