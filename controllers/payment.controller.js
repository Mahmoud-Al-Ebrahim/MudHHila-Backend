const Payment = require("../models/Payment");
const mongoose = require("mongoose");
const Helper = require("../helper/helpers");
exports.addPayment = async (req, res) => {
  try {
    const { eventId } = req.body;

    const payment = await Payment.create(req.body);

    await Helper.updateEventStatus(eventId);

    res.json(payment);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.editPayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    await Helper.updateEventStatus(payment.event);

    res.json(payment);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    await Payment.findByIdAndDelete(req.params.id);

    await Helper.updateEventStatus(payment.event);

    res.json({ message: "تم حذف الدفعة" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPaymentsByEvent = async (req, res) => {
  try {
    const eventId = req.params.eventId;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        message: "معرّف الحفلة غير صالح"
      });
    }

    const payments = await Payment.find({ event: eventId });

    res.json(payments);
  } catch (error) {
    res.status(500).json({
      message: "حدث خطأ أثناء جلب الدفعات",
      error: error.message
    });
  }
};