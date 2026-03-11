const router = require("express").Router();
const controller = require("../controllers/report.controller");

router.get("/payments-report/:hallId", controller.getPaymentsReport);
router.get("/hall-report/:hallId", controller.getHallReport);


module.exports = router;
