const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true
  },

  amount: { type: Number, required: true },

  dueDate: { type: Date, required: true },   // تاريخ الاستحقاق
  paymentDate: { type: Date },               // تاريخ الدفع الفعلي

  status: {
    type: String,
    enum: [ "مكتمل", "ملغي", "معلق"],
    default: "معلق"
  },
paymentMethod: {type: String , default: "نقدي"},
  notes: String

}, { timestamps: true });

module.exports = mongoose.model("Payment", PaymentSchema);