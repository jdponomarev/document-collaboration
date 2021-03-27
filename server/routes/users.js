const router = require("express").Router();
const { User } = require("../models/User");
const logger = require("../utils/logger");
const { body, check, validationResult, param } = require("express-validator");
const { requiresAuth } = require("../middleware/auth");
const jwt = require("jsonwebtoken");
//Public API's
router.post(
	"/",
	[body("email").isEmail(), body("name").exists()],
	async (req, res) => {
		logger.info(req.body);
		const validationErrors = await validationResult(req);
		if (
			validationErrors &&
			validationErrors.errors &&
			validationErrors.errors.length
		) {
			return res.json({ status: "error", code: "BAD_PARAMS" });
		}

		const { email, name } = req.body;
		let user = new User({
			email,
			name,
			salt: "" + Math.random(),
		});
		try {
			await user.save();
		} catch (e) {
			logger.error(`POST /users db error `, e);
			if (e.code == 11000) {
				return res
					.status(502)
					.json({ status: "error", code: "ALREADY_SIGNED_UP" });
			} else {
				return res
					.status(502)
					.json({ status: "error", code: "INTERNAL_ERROR" });
			}
		}

		const token = jwt.sign(
			{
				//TODO: add more parameters later on
				_id: user._id,
			},
			process.env.JWT_KEY
		);
		res.cookie("jwt", token, {
			maxAge: 1000 * 60 * 60 * 24 * 365,
			httpOnly: true,
		});
		res.json({ status: "ok", user, jwt: token });
	}
);

//Authorized APIs below
router.use(requiresAuth);

router.get("/me", async (req, res) => {
	return res.json({ status: "ok", me: req.user });
});

module.exports = { router };
