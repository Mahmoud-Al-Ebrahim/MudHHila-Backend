const router = require("express").Router();
const controller = require("../controllers/payment.controller");

router.get("/get/:eventId", controller.getPaymentsByEvent);

router.post("/add", controller.addPayment);
router.put("/:id/edit", controller.editPayment);
router.delete("/:id/delete", controller.deletePayment);

module.exports = router;