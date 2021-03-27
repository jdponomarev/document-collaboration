const router = require("express").Router();
const { Document } = require("../models/Document");
const logger = require("../utils/logger");
const { body, check, validationResult, param } = require("express-validator");
const {requiresAuth} = require("../middleware/auth");



//Public API's
router.get("/", async (req, res) => {
	const { limit=10, skip=0 } = req.query;
	const documents = await Document.find({
        deleted:{$ne:true}
    }).limit(limit).skip(skip);
	res.json({ status: "ok", documents });
});

router.get("/:_id", [param("_id").isMongoId()], async (req, res) => {
	const validationErrors = await validationResult(req);
	if (
		validationErrors &&
		validationErrors.errors &&
		validationErrors.errors.length
	) {
		return res.json({ status: "error", code: "BAD_PARAMS" });
	}

    const {_id} = req.params;
	const document = await Document.findOne({ _id });
	if (!document) {
		return res.status(404).json({ status: "error", code: "NOT_FOUND" });
	}
	res.json({ status: "ok", document });
});


//Authorized APIs below
router.use(requiresAuth)

router.delete("/:_id", [param("_id").isMongoId()], async (req, res) => {
	const validationErrors = await validationResult(req);
	if (
		validationErrors &&
		validationErrors.errors &&
		validationErrors.errors.length
	) {
		return res.json({ status: "error", code: "BAD_PARAMS" });
	}

	const { _id } = req.params;
	let document = await Document.findOne({ _id });
	if (!document) {
		return res.status(404).json({ status: "error", code: "NOT_FOUND" });
	}
	//Only owner can delete the document
	if (""+document.owner != ""+req.user._id) {
		return res
			.status(401)
			.json({ status: "error", code: "NOT_ALLOWED" });
	}
	document.deleted = true;
	try {
		await document.save();
	} catch (e) {
		logger.error(`DELETE /documents/${_id} db error `, e);
        return res.status(502).json({ status: "error", code:"INTERNAL_ERROR"});
	}
	res.json({ status: "ok", document });
});

router.post("/", [body("title").notEmpty(), body("body").notEmpty()],async (req, res) => {
	const validationErrors = await validationResult(req);
	if (
		validationErrors &&
		validationErrors.errors &&
		validationErrors.errors.length
	) {
		return res.json({ status: "error", code: "BAD_PARAMS" });
	}

    const {title,body} = req.body;
	const document = new Document({
		body,
		title,
        owner: req.user._id
	});
	try {
		await document.save();
	} catch (e) {
        if (e.code == 11000) {
            return res
                .status(502)
                .json({ status: "error", code: "TITLE_ALREADY_USED" });
        }else{
    		logger.error(`POST /documents db error `, e);
            return res.status(502).json({ status: "error", code:"INTERNAL_ERROR"});
        }
	}
	res.json({ status: "ok", document });
});

router.post("/:_id", [param("_id").isMongoId(), body("title").notEmpty()], async (req, res) => {
	const validationErrors = await validationResult(req);
	if (
		validationErrors &&
		validationErrors.errors &&
		validationErrors.errors.length
	) {
		return res.json({ status: "error", code: "BAD_PARAMS" });
	}

	const { _id } = req.params;
	const { title } = req.body;
	const document = await Document.findOne({ _id })

    if (!document) {
		return res.status(404).json({ status: "error", code: "NOT_FOUND" });
	}

    //Only owner can edit the document
	if (""+document.owner != ""+req.user._id) {
		return res
			.status(401)
			.json({ status: "error", code: "NOT_ALLOWED" });
	}

    document.title = title;
    try {
		await document.save();
	} catch (e) {
        if (e.code == 11000) {
            return res
                .status(502)
                .json({ status: "error", code: "TITLE_ALREADY_USED" });
        }else{
            logger.error(`POST /documents db error `, e);
            return res.status(502).json({ status: "error", code:"INTERNAL_ERROR"});
        }
	}
	return res.json({ status: "ok", document });
});


const documentsSocketController = {
	viewDocument: async({socket,data,io})=>{
		const {_id, body} = data;
		const document = await Document.findOneAndUpdate({ _id })
		if (!document) {
			return socket.emit('error', JSON.stringify({ status: "error", code:"NOT_FOUND"}));
		}

		document.views++;
		try {
			await document.save();
		} catch (e) {
			logger.error(`viewDocument db error `, e);
			return socket.emit('error', JSON.stringify({ status: "error", code:"INTERNAL_ERROR", action:"viewDocument"}));
		}

		//Joining a room for broadcasts
		socket.join(_id);
		io.to(_id).emit('viewDocument',JSON.stringify({name:socket.user.name}));
	},
	editDocument: async ({socket,data,io})=>{
		const {_id, body} = data;
		const document = await Document.findOne({ _id })
		if (!document) {
			return socket.emit('error', JSON.stringify({ status: "error", code:"NOT_FOUND"}));
		}
		document.body = body;
		try {
			await document.save();
		} catch (e) {
			logger.error(`editDocument db error `, e);
			socket.emit('error', JSON.stringify({ status: "error", code:"INTERNAL_ERROR", action:"editDocument"}));
		}
		//Broadcasting to everyone in the room
		socket.join(_id);
		io.to(_id).emit('editDocument',JSON.stringify({body}));
		// socket.emit('editDocument',JSON.stringify({body}));
	}
};


module.exports = { documentsRouter:router, documentsSocketController };
