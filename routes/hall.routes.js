const router = require("express").Router();
const controller = require("../controllers/hall.controller");

router.get("/:hallId/statistics" , controller.getHallStatisticsOptimized);
router.get("/dashboard", controller.getHallsDashboard);
router.post("/add", controller.createHall);
router.put("/:id/edit", controller.updateHall);
router.delete("/:id/delete", controller.deleteHall);

module.exports = router;