const mongoose = require("mongoose");

const HallSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: String,
  supervisorName: String,
  auditorName: String,
  phone: String,
  email: String
}, { timestamps: true });

module.exports = mongoose.model("Hall", HallSchema);