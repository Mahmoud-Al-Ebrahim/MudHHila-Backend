const mongoose = require("mongoose");

const HallExpenseSchema = new mongoose.Schema({
  hall: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hall",
    required: true
  },

  title: String,
  description: String,
  workerName: String,
  amount: { type: Number, required: true },
  expenseDate: { type: Date, required: true }
}, { timestamps: true });

HallExpenseSchema.index({
  hall: 1,
  expenseDate: 1
});

module.exports = mongoose.model("HallExpense", HallExpenseSchema);