const express = require("express");
const router = express.Router();

const sauceCtrl = require("../controllers/sauces");
const auth = require("../middleware/auth");
const multer = require("../middleware/multer-config");

router.get("/", sauceCtrl.getAllStuff);
router.post("/", auth, multer, sauceCtrl.createSauce);
router.get("/:id", auth, sauceCtrl.getOneSauce);
router.put("/:id", auth, multer, sauceCtrl.modifySauce);
router.post("/:id/like", auth, sauceCtrl.LikeSauce);
router.delete("/:id", auth, sauceCtrl.deleteSauce);

module.exports = router;
