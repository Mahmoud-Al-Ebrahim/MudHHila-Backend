const User = require("../models/User");
const CryptoJS = require('crypto-js');
const jwt = require('jsonwebtoken');

module.exports = {
    loginUser: async (req, res) => {
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

        if (!emailRegex.test(req.body.email)) {
            return res.status(400).json({ status: false, message: "البريد الالكتروني المدخل غير صالح" });
        }

       if (req.body.password < 8) {
            return res.status(400).json({ status: false, message: "كلمة المرور يجب أن تكون 8 محارف على الأقل"});
        }

        try {
            const user = await User.findOne({ email: req.body.email });

            if (!user) {
                return res.status(400).json({ status: false, message: "البريد الالكتروني أو كلمة المرور غير صحيحة" });
            }

            const decryptedPassword = CryptoJS.AES.decrypt(user.password, process.env.SECRET);
             const depassword = decryptedPassword.toString(CryptoJS.enc.Utf8);

            if (depassword !== req.body.password) {
                return res.status(400).json({ status: false, message: "البريد الالكتروني أو كلمة المرور غير صحيحة" });
            }
            const userToken = jwt.sign({
                id: user._id,
                email: user.email,
                name: user.name
            }, process.env.JWT_SECRET, { expiresIn: "21d" });


            res.status(200).json({token: userToken , user: user});
        } catch (error) {
            res.status(500).json({ status: false, message: "فشل تسجيل الدخول" ,});
        }

    },

        createUser: async (req, res) => {
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

        if (!emailRegex.test(req.body.email)) {
            return res.status(400).json({ status: false, message: "البريد الالكتروني المدخل غير صالح" });
        }

        const minPasswordLength = 8;

        if (req.body.password < minPasswordLength) {
            return res.status(400).json({ status: false, message: "كلمة المرور يجب أن تكون على الأقل" + minPasswordLength + "حرفا" });
        }

        try {
            const emailExists = await User.findOne({ email: req.body.email });

            if (emailExists) {
                return res.status(400).json({ status: false, message: "البريد الالكتروني موجود مسبقا" });
            }

            const newUser = new User({
                username: req.body.username,
                email: req.body.email,
                name: req.body.name,
                password: CryptoJS.AES.encrypt(req.body.password, process.env.SECRET).toString(),
            })

            //SAVE USER
            await newUser.save();

         const userToken = jwt.sign({
                id: newUser._id,
                email: newUser.email,
                name: newUser.name
            }, process.env.JWT_SECRET, { expiresIn: "21d" });
            res.status(201).json({ status: true, message: "تم إنشاء الحساب بنجاح" ,token: userToken , user: newUser});
        } catch (error) {
            res.status(500).json({ status: false, message: error.message });
        }
    },
}