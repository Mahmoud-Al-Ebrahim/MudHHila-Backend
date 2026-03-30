const User = require("../models/User");
const CryptoJS = require('crypto-js');
const jwt = require('jsonwebtoken');

module.exports = {
    loginUser: async (req, res) => {
        const phoneRegex = /^(009665|9665|\+9665|05|5)(5|0|3|6|4|9|1|8|7)([0-9]{7})$/;

        if (!phoneRegex.test(req.body.phone)) {
            return res.status(400).json({ status: false, message: "رقم الهاتف المدخل غير صالح" });
        }

       if (req.body.password < 8) {
            return res.status(400).json({ status: false, message: "كلمة المرور يجب أن تكون 8 محارف على الأقل"});
        }

        try {
            const user = await User.findOne({ phone: req.body.phone });

            if (!user) {
                return res.status(400).json({ status: false, message: "رقم الهاتف أو كلمة المرور غير صحيحة" });
            }

            const decryptedPassword = CryptoJS.AES.decrypt(user.password, process.env.SECRET);
             const depassword = decryptedPassword.toString(CryptoJS.enc.Utf8);

            if (depassword !== req.body.password) {
                return res.status(400).json({ status: false, message: "رقم الهاتف أو كلمة المرور غير صحيحة" });
            }
            const userToken = jwt.sign({
                id: user._id,
                phone: user.phone,
                name: user.name,
            }, process.env.JWT_SECRET);


            res.status(200).json({token: userToken , user: user});
        } catch (error) {
            res.status(500).json({ status: false, message: "فشل تسجيل الدخول" ,});
        }

    },

        createUser: async (req, res) => {
        const phoneRegex = /^(009665|9665|\+9665|05|5)(5|0|3|6|4|9|1|8|7)([0-9]{7})$/;

        if (!phoneRegex.test(req.body.phone)) {
            return res.status(400).json({ status: false, message: "رقم الهاتف المدخل غير صالح" });
        }

        const minPasswordLength = 8;

        if (req.body.password < minPasswordLength) {
            return res.status(400).json({ status: false, message: "كلمة المرور يجب أن تكون على الأقل" + minPasswordLength + "حرفا" });
        }

        try {
            const phoneExists = await User.findOne({ phone: req.body.phone });

            if (phoneExists) {
                return res.status(400).json({ status: false, message: "رقم الهاتف موجود مسبقا" });
            }

            const newUser = new User({
                username: req.body.username,
                phone: req.body.phone,
                name: req.body.name,
                ut: "مستخدم",
                password: CryptoJS.AES.encrypt(req.body.password, process.env.SECRET).toString(),
            });

            //SAVE USER
            await newUser.save();

         const userToken = jwt.sign({
                id: newUser._id,
                phone: newUser.phone,
                name: newUser.name
            }, process.env.JWT_SECRET);
            res.status(201).json({ status: true, message: "تم إنشاء الحساب بنجاح" ,token: userToken , user: newUser});
        } catch (error) {
            res.status(500).json({ status: false, message: error.message });
        }
    },
}