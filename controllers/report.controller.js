const mongoose = require("mongoose");
const Hall = require("../models/Hall");
const Event = require("../models/Event");
const HallExpense = require("../models/HallExpense");
const Payment = require("../models/Payment");
exports.getHallReport = async (req, res) => {
  try {
    const { hallId } = req.params;
    const { startDate, endDate } = req.query;

    if (!mongoose.Types.ObjectId.isValid(hallId)) {
      return res.status(400).json({
        message: "معرّف الصالة غير صالح"
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
end.setHours(23, 59, 59, 999);
    const hallObjectId = new mongoose.Types.ObjectId(hallId);

    // =========================
    // Hall Info
    // =========================
    const hall = await Hall.findById(hallId).lean();

    if (!hall) {
      return res.status(404).json({
        message: "الصالة غير موجودة"
      });
    }

    // =========================
    // Events
    // =========================
    const events = await Event.find({
      hall: hallObjectId,
      eventDate: { $gte: start, $lte: end },
      status: { $ne: "ملغي" }
    }).lean();

    // =========================
    // Expenses
    // =========================
    const expenses = await HallExpense.find({
      hall: hallObjectId,
      expenseDate: { $gte: start, $lte: end }
    }).lean();

    // =========================
    // Map days
    // =========================
    const daysMap = {};

    // Helper function
    const getDateKey = (date) => {
      const d = new Date(date);
      return d.toISOString().split("T")[0];
    };

    // =========================
    // Add events to days
    // =========================
    events.forEach(event => {

      const key = getDateKey(event.eventDate);

      if (!daysMap[key]) {
        daysMap[key] = {
          dayName: new Date(event.eventDate).toLocaleDateString("ar-EG", {
            weekday: "long"
          }),
          date: key,
          events: [],
          expenses: 0,
          profit: 0
        };
      }

      daysMap[key].events.push({
        eventName: event.eventName,
        totalCost: event.totalCost,
        clientName: event.clientName
      });

      daysMap[key].profit += event.totalCost;
    });

    // =========================
    // Add expenses to days
    // =========================
    expenses.forEach(expense => {

      const key = getDateKey(expense.expenseDate);

      if (!daysMap[key]) {
        daysMap[key] = {
          dayName: new Date(expense.expenseDate).toLocaleDateString("ar-EG", {
            weekday: "long"
          }),
          date: key,
          events: [],
          expenses: 0,
          profit: 0
        };
      }

      daysMap[key].expenses += expense.amount;
      daysMap[key].profit -= expense.amount;
    });

    // =========================
    // Convert map to array
    // =========================
    const days = Object.values(daysMap).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    res.json({
      hall: {
        id: hall._id,
        name: hall.name,
        address: hall.address,
        phone: hall.phone,
        supervisorName: hall.supervisorName,
        auditorName : hall.auditorName
      },

      period: {
        startDate,
        endDate
      },

      days
    });

  } catch (error) {
    res.status(500).json({
      message: "حدث خطأ أثناء جلب بيانات التقرير",
      error: error.message
    });
  }
};


exports.getPaymentsReport = async (req, res) => {
  try {

    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        message: "تاريخ البداية والنهاية مطلوبان"
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

        const filter = {
      expenseDate: {
        $gte: new Date(start),
        $lte: new Date(end)
      }
    };

    const result = await Payment.aggregate([
{ $match: filter },
      /// جلب بيانات الحدث
      {
        $lookup: {
          from: "events",
          localField: "event",
          foreignField: "_id",
          as: "event"
        }
      },

      {
        $unwind: "$event"
      },

      /// اختيار البيانات المطلوبة فقط
      {
        $project: {
          _id: 1,
          amount: 1,
          paymentMethod: 1,
          paymentDate: 1,
          notes: 1,
          status: 1 ,
          clientName: "$event.clientName",
          eventName: "$event.eventName"
        }
      },

      {
        $sort: {
          paymentDate: 1
        }
      }

    ]);

    /// حساب الإجمالي
    const total = result.reduce((sum, item) => sum + item.amount, 0);

    res.json({
      data: result,
      totalAmount: total
    });

  } catch (error) {
    res.status(500).json({
      message: "error getting payments report",
      error: error.message
    });
  }
};