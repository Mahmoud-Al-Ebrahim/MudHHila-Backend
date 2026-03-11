const router = require("express").Router();
const controller = require("../controllers/event.controller");

router.get("/upcoming", controller.getUpcomingEvents);

router.post("/add", controller.addEvent);

router.get("/:eventId/financial-summary", controller.getEventFinancialSummary);

router.get("/:hallId/get", controller.getAllEvents);

router.put("/:id/edit", controller.editEvent);

router.delete("/:id/delete", controller.deleteEvent);

module.exports = router;