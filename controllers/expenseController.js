const mongoose = require("mongoose");
const HallExpense = require("../models/HallExpense");
const paginate = require("../utils/pagination");

// =============================
// 1️⃣ Add Expense To Hall
// =============================
exports.addHallExpense = async (req, res) => {
  try {
    const { hall, title, description, amount, expenseDate , workerName} = req.body;

    if (!mongoose.Types.ObjectId.isValid(hall)) {
      return res.status(400).json({
        message: "معرّف الصالة غير صالح"
      });
    }

    const expense = await HallExpense.create({
      hall,
      title,
      description,
      amount,
      expenseDate,
      workerName
    });

    res.status(201).json(expense);

  } catch (error) {
    res.status(500).json({
      message: "حدث خطأ أثناء إضافة المصروف",
      error: error.message
    });
  }
};


// =============================
// 2️⃣ Edit Expense
// =============================
exports.editHallExpense = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "معرّف المصروف غير صالح"
      });
    }

    const expense = await HallExpense.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    if (!expense) {
      return res.status(404).json({
        message: "المصروف غير موجود"
      });
    }

    res.json(expense);

  } catch (error) {
    res.status(500).json({
      message: "حدث خطأ أثناء تعديل المصروف",
      error: error.message
    });
  }
};


// =============================
// 3️⃣ Get Expenses For Hall (Pagination)
// =============================
exports.getHallExpenses = async (req, res) => {
  try {
    const { hallId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(hallId)) {
      return res.status(400).json({
        message: "معرّف الصالة غير صالح"
      });
    }

    const { page, limit, skip } = paginate.getPagination(req);

    const expenses = await HallExpense.find({ hall: hallId })
      .sort({ expenseDate: -1 })
      .skip(skip)
      .limit(limit);

    res.json(expenses);

  } catch (error) {
    res.status(500).json({
      message: "حدث خطأ أثناء جلب المصاريف",
      error: error.message
    });
  }
};


// =============================
// 4️⃣ Delete Expense
// =============================
exports.deleteHallExpenses = async (req, res) => {
  try {
    const { expenseIds } = req.body;

    if (!Array.isArray(expenseIds) || !expenseIds.length) {
      return res.status(400).json({
        message: "يجب إرسال قائمة المعرفات للحذف"
      });
    }

    // Validate all ids
    const invalidIds = expenseIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length) {
      return res.status(400).json({
        message: "يوجد معرفات غير صالحة",
        invalidIds
      });
    }

    const result = await HallExpense.deleteMany({
      _id: { $in: expenseIds }
    });

    res.json({
      message: `تم حذف ${result.deletedCount} مصروف بنجاح`
    });

  } catch (error) {
    res.status(500).json({
      message: "حدث خطأ أثناء حذف المصاريف",
      error: error.message
    });
  }
};

exports.getHallExpensesStats = async (req, res) => {
  try {
    const { hallId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(hallId)) {
      return res.status(400).json({
        message: "معرّف الصالة غير صالح"
      });
    }

    const hallObjectId = new mongoose.Types.ObjectId(hallId);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats = await HallExpense.aggregate([
      { $match: { hall: hallObjectId } },
      {
        $group: {
          _id: "$hall",
          totalExpenses: { $sum: "$amount" },
          expenseCount: { $sum: 1 },
          averageExpense: { $avg: "$amount" },
          todayExpenses: {
            $sum: {
              $cond: [
                { $gte: ["$expenseDate", startOfToday] },
                "$amount",
                0
              ]
            }
          },
          monthlyExpenses: {
            $sum: {
              $cond: [
                { $gte: ["$expenseDate", startOfMonth] },
                "$amount",
                0
              ]
            }
          }
        }
      }
    ]);

    if (!stats.length) {
      return res.json({
        id: hallId,
        totalExpenses: 0,
        expenseCount: 0,
        averageExpense: 0,
        todayExpenses: 0,
        monthlyExpenses: 0
      });
    }

    const result = stats[0];

    res.json({
      id: result._id,
      totalExpenses: result.totalExpenses,
      expenseCount: result.expenseCount,
      averageExpense: result.averageExpense,
      todayExpenses: result.todayExpenses,
      monthlyExpenses: result.monthlyExpenses
    });

  } catch (error) {
    res.status(500).json({
      message: "حدث خطأ أثناء جلب إحصائيات المصاريف",
      error: error.message
    });
  }
};

exports.getHallExpensesReport = async (req, res) => {
  try {

    const { hallId } = req.params;
    const { startDate, endDate } = req.body;
endDate.setHours(23, 59, 59, 999);

    if (!startDate || !endDate) {
      return res.status(400).json({
        message: "تاريخ البداية والنهاية مطلوبان"
      });
    }
const objectHallId = new mongoose.Types.ObjectId(hallId);

    const filter = {
      hall: objectHallId,
      expenseDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    const expenses = await HallExpense.find(filter)
      .sort({ expenseDate: 1 })
      .select("title description amount expenseDate");

    const totalAmount = await HallExpense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      }
    ]);

    res.json({
      data: expenses,
      totalAmount: totalAmount[0]?.total || 0,
    });

  } catch (error) {
    res.status(500).json({
      message: "error getting expenses report",
      error: error.message
    });
  }
};