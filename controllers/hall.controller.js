const Hall = require("../models/Hall");
const HallExpense = require("../models/HallExpense");
const Payment = require("../models/Payment");
const Event = require("../models/Event");
const moment = require("moment");
const mongoose = require("mongoose");
exports.getHallsDashboard = async (req, res) => {
  try {
    const startOfMonth = moment().startOf("month").toDate();
    const endOfMonth = moment().endOf("month").toDate();

    const startOfWeek = moment().startOf("week").toDate();
    const endOfWeek = moment().endOf("week").toDate();

    const halls = await Hall.aggregate([
      // ======================
      // ربط الحفلات بالصالة
      // ======================
      {
        $lookup: {
          from: "events",
          localField: "_id",
          foreignField: "hall",
          as: "events"
        }
      },

      // ======================
      // حساب عدد حفلات الأسبوع الحالي
      // ======================
      {
        $addFields: {
          weeklyEventsCount: {
            $size: {
              $filter: {
                input: "$events",
                as: "event",
                cond: {
                  $and: [
                    { $gte: ["$$event.eventDate", startOfWeek] },
                    { $lte: ["$$event.eventDate", endOfWeek] },
                    { $ne: ["$$event.status", "ملغي"] }
                  ]
                }
              }
            }
          }
        }
      },

      // ======================
      // ربط الدفعات بالحفلات
      // ======================
      {
        $lookup: {
          from: "payments",
          let: { eventIds: "$events._id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ["$event", "$$eventIds"] },
                    { $gte: ["$paymentDate", startOfMonth] },
                    { $lte: ["$paymentDate", endOfMonth] }
                  ]
                }
              }
            }
          ],
          as: "monthlyPayments"
        }
      },

      // ======================
      // حساب إيرادات الشهر الحالي
      // ======================
      {
        $addFields: {
          monthlyIncome: {
            $sum: "$monthlyPayments.amount"
          }
        }
      },

      // ======================
      // تنظيف البيانات النهائية
      // ======================
      {
        $project: {
          events: 0,
          monthlyPayments: 0
        }
      }
    ]);

    res.json(halls);
  } catch (error) {
    res.status(500).json({
      message: "حدث خطأ أثناء جلب بيانات الصالات",
      error: error.message
    });
  }
};

exports.createHall = async (req, res) => {
  try {
    const hall = await Hall.create(req.body);
    res.status(201).json(hall);
  } catch (error) {
    res.status(400).json({
      message: "حدث خطأ أثناء إنشاء الصالة",
      error: error.message
    });
  }
};


exports.updateHall = async (req, res) => {
  try {
    const hall = await Hall.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!hall) {
      return res.status(404).json({
        message: "الصالة غير موجودة"
      });
    }

    res.json(hall);
  } catch (error) {
    res.status(400).json({
      message: "حدث خطأ أثناء تعديل بيانات الصالة",
      error: error.message
    });
  }
};

exports.deleteHall = async (req, res) => {
  try {
    const hall = await Hall.findByIdAndDelete(req.params.id);

    if (!hall) {
      return res.status(404).json({
        message: "الصالة غير موجودة"
      });
    }

    res.json({ message: "تم حذف الصالة بنجاح" });
  } catch (error) {
    res.status(500).json({
      message: "حدث خطأ أثناء حذف الصالة",
      error: error.message
    });
  }
};



exports.getHallStatisticsOptimized = async (req, res) => {
  try {
    const hallId = req.params.hallId;

    if (!mongoose.Types.ObjectId.isValid(hallId)) {
      return res.status(400).json({
        message: "معرّف الصالة غير صالح"
      });
    }

    const hallObjectId = new mongoose.Types.ObjectId(hallId);

    // ===============================
    // 1) Payment + Event Aggregation
    // ===============================
    const paymentStats = await Payment.aggregate([
      {
        $lookup: {
          from: "events",
          localField: "event",
          foreignField: "_id",
          as: "event"
        }
      },
      { $unwind: "$event" },
      {
        $match: {
          "event.hall": hallObjectId,
          "event.status": { $ne: "ملغي" }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$paymentDate" },
            month: { $month: "$paymentDate" }
          },
          monthlyReceived: {
            $sum: {
              $cond: [
                { $eq: ["$status", "مكتمل"] },
                "$amount",
                0
              ]
            }
          },
          totalReceived: {
            $sum: {
              $cond: [
                { $eq: ["$status", "مكتمل"] },
                "$amount",
                0
              ]
            }
          },
          totalPending: {
            $sum: {
              $cond: [
                { $eq: ["$status", "معلق"] },
                "$amount",
                0
              ]
            }
          },
          totalAmount: { $sum: "$amount" },
          completedPayments: {
            $sum: {
              $cond: [{ $eq: ["$status", "مكتمل"] }, 1, 0]
            }
          },
          pendingPayments: {
            $sum: {
              $cond: [{ $eq: ["$status", "معلق"] }, 1, 0]
            }
          },
          failedPayments: {
            $sum: {
              $cond: [{ $eq: ["$status", "ملغي"] }, 1, 0]
            }
          }
        }
      }
    ]);

    // ===============================
    // 2) Expenses Aggregation
    // ===============================
    const expenseStats = await HallExpense.aggregate([
      {
        $match: {
          hall: hallObjectId
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$expenseDate" },
            month: { $month: "$expenseDate" }
          },
          monthlyExpenses: { $sum: "$amount" }
        }
      }
    ]);

    // ===============================
    // 3) Build monthlyRevenue Map
    // ===============================
    const monthlyRevenue = {};

    paymentStats.forEach(p => {
      const key = `${p._id.year}-${p._id.month}`;
      monthlyRevenue[key] = (p.monthlyReceived || 0);
    });

    expenseStats.forEach(e => {
      const key = `${e._id.year}-${e._id.month}`;
      monthlyRevenue[key] =
        (monthlyRevenue[key] || 0) - e.monthlyExpenses;
    });

    // ===============================
    // 4) Event Stats
    // ===============================
    const eventStats = await Event.aggregate([
      {
        $match: {
          hall: hallObjectId,
          status: { $ne: "ملغي" }
        }
      },
      {
        $group: {
          _id: null,
          totalEvents: { $sum: 1 },
          completedEvents: {
            $sum: {
              $cond: [{ $eq: ["$status", "مكتمل"] }, 1, 0]
            }
          },
          ongoingEvents: {
            $sum: {
              $cond: [{ $eq: ["$status", "مستمر"] }, 1, 0]
            }
          },
          totalEventsAmount: { $sum: "$totalCost" }
        }
      }
    ]);

    const events = eventStats[0] || {
      totalEvents: 0,
      completedEvents: 0,
      ongoingEvents: 0,
      totalEventsAmount: 0
    };

    const payments = paymentStats.reduce(
      (acc, curr) => {
        acc.totalReceived += curr.totalReceived || 0;
        acc.totalPending += curr.totalPending || 0;
        acc.totalAmount += curr.totalAmount || 0;
        acc.completedPayments += curr.completedPayments || 0;
        acc.pendingPayments += curr.pendingPayments || 0;
        acc.failedPayments += curr.failedPayments || 0;
        return acc;
      },
      {
        totalReceived: 0,
        totalPending: 0,
        totalAmount: 0,
        completedPayments: 0,
        pendingPayments: 0,
        failedPayments: 0
      }
    );

    res.json({
      ...events,
      ...payments,
      monthlyRevenue
    });

  } catch (error) {
    res.status(500).json({
      message: "حدث خطأ أثناء جلب إحصائيات الصالة",
      error: error.message
    });
  }
};