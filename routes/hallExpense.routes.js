const express = require("express");
const router = express.Router();
const controller = require("../controllers/expenseController.js");

router.get("/:hallId/expenses/report", controller.getHallExpensesReport);
// جلب مصاريف صالة مع pagination
router.get("/get/:hallId", controller.getHallExpenses);

router.get("/stats/:hallId", controller.getHallExpensesStats);
// إضافة مصروف
router.post("/add", controller.addHallExpense);

// تعديل مصروف
router.put("/:id/edit", controller.editHallExpense);

// حذف مصروف
router.delete("/bulk-delete", controller.deleteHallExpenses);


module.exports = router;