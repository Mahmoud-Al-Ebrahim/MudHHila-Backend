const router = require('express').Router();
const authController = require('../controllers/authController');


router.post("/login", authController.loginUser); // API
router.post("/register", authController.createUser); // API

module.exports = router;