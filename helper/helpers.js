
const Event = require("../models/Event");
const Payment = require("../models/Payment");

exports.updateEventStatus = async (eventId) => {
  const event = await Event.findById(eventId);
  const payments = await Payment.find({ event: eventId });

  const totalPaid = payments
    .filter(p => p.status === "مكتمل")
    .reduce((sum, p) => sum + p.amount, 0);

  if (totalPaid >= event.totalCost) {
    event.status = "مكتمل";
  } else {
    event.status = "مستمر";
  }

  await event.save();
};