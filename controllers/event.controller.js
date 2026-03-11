const Event = require("../models/Event");
const Payment = require("../models/Payment");
const paginate = require("../utils/pagination");
const Helper = require("../helper/helpers");
const mongoose = require("mongoose");
exports.addEvent = async (req, res) => {
  try {
    const {
      hall,
      eventName,
      eventDate,
      clientName,
      totalCost,
      advancePayment
    } = req.body;

    const event = await Event.create({
      hall,
      eventName,
      eventDate,
      clientName,
      totalCost
    });

    // إضافة دفعة مقدمة إذا موجودة
    if (advancePayment && advancePayment > 0) {
      await Payment.create({
        event: event._id,
        amount: advancePayment,
        dueDate: new Date(),
        paymentDate: new Date(),
        status: "مكتمل",
        notes: "دفعة مقدمة"
      });
    }

    // await Helper.updateEventStatus(event._id);
    res.json(event);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.editEvent = async (req, res) => {
  try {
    const {id} = req.params;
   await Event.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    res.json({message: "done"});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const {id} = req.params;

    await Payment.deleteMany({ event: id });
    await Event.findByIdAndDelete(id);

    res.json({ message: "تم حذف الحدث وكل دفعاته" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUpcomingEvents = async (req, res) => {
   try {
    const now = new Date();

    const events = await Event.find({
      eventDate: { $gte: now },
      status: { $ne: "ملغي" } // استبعاد الحفلات الملغاة
    })
      .sort({ eventDate: 1 }) // من الأقرب إلى الأبعد
      .limit(5)               // أقرب 5 حفلات فقط
      .populate("hall");

    res.json({
      count: events.length,
      data: events
    });
  } catch (error) {
    res.status(500).json({
      message: "حدث خطأ أثناء جلب الحفلات القادمة",
      error: error.message
    });
  }
};

exports.getAllEvents = async (req, res) => {
  try {

    const { hallId } = req.params;
    const { status = "all", query = "" } = req.query;

    if (!mongoose.Types.ObjectId.isValid(hallId)) {
      return res.status(400).json({
        message: "معرّف الصالة غير صالح"
      });
    }

    const { page, limit, skip } = paginate.getPagination(req);

    /// build filter
    const filter = {
      hall: hallId
    };

    /// status filter
    if (status && status !== "all") {
      filter.status = status;
    }

    /// search filter
    if (query && query.trim() !== "") {
      filter.$text = { $search: query };
    }

    const events = await Event.find(filter)
      .sort({ eventDate: -1 })
      .skip(skip)
      .limit(limit);

    res.json(events);

  } catch (error) {
    res.status(500).json({
      message: "حدث خطأ أثناء جلب الحفلات",
      error: error.message
    });
  }
};

exports.getEventFinancialSummary = async (req, res) => {
  try {

    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "معرّف الحدث غير صالح" });
    }

    const result = await Event.aggregate([

      {
        $match: {
          _id: new mongoose.Types.ObjectId(eventId)
        }
      },

      {
        $lookup: {
          from: "payments",
          localField: "_id",
          foreignField: "event",
          as: "payments"
        }
      },

      {
        $addFields: {

          /// المبلغ المستلم
          receivedCost: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$payments",
                    as: "p",
                    cond: { $eq: ["$$p.status", "مكتمل"] }
                  }
                },
                as: "p",
                in: "$$p.amount"
              }
            }
          },

          /// الدفعة المقدمة
          advancePaid: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$payments",
                    as: "p",
                    cond: { $eq: ["$$p.notes", "دفعة مقدمة"] }
                  }
                },
                as: "p",
                in: "$$p.amount"
              }
            }
          },

          /// ملاحظات المدفوعات المعلقة
          pendingNotes: {
            $map: {
              input: {
                $filter: {
                  input: "$payments",
                  as: "p",
                  cond: { $eq: ["$$p.status", "معلق"] }
                }
              },
              as: "p",
              in: "$$p.notes"
            }
          },

          /// أقرب تاريخ استحقاق
          nearestDueDate: {
            $min: {
              $map: {
                input: {
                  $filter: {
                    input: "$payments",
                    as: "p",
                    cond: { $eq: ["$$p.status", "معلق"] }
                  }
                },
                as: "p",
                in: "$$p.dueDate"
              }
            }
          }

        }
      },

      {
        $addFields: {
          restCost: {
            $subtract: ["$totalCost", "$receivedCost"]
          }
        }
      },

      {
        $project: {
          clientName: 1,
          eventName: 1,
          eventDate: 1,
          totalCost: 1,
          advancePaid: 1,
          receivedCost: 1,
          restCost: 1,
          pendingNotes: 1,
          nearestDueDate: 1
        }
      }

    ]);

    res.json(result[0] || null);

  } catch (error) {
    res.status(500).json({
      message: "حدث خطأ أثناء جلب بيانات الحدث",
      error: error.message
    });
  }
};