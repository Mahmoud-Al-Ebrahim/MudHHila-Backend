const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
  hall: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hall",
    required: true
  },

  eventName: String,
  paymentMethod: String,
  eventDate: { type: Date, required: true },
  clientName: String,

  totalCost: { type: Number, required: true },

  status: {
    type: String,
    enum: ["مستمر", "مكتمل" , "ملغي"],
    default: "مستمر"
  }

}, { timestamps: true });


EventSchema.index({
  eventName: "text",
  clientName: "text"
});
module.exports = mongoose.model("Event", EventSchema);