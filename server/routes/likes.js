const express = require("express");
const router = express.Router();
const { likes } = require("../models");
const { validateUser } = require("../middlewares/userMiddleware");

// Create a like
router.post("/", validateUser, async (req, res) => {
  const { postId } = req.body;
  const userId = req.user.id;
  const existingLike = await likes.findOne({
    where: { postId, userId },
  });
  if (!existingLike) {
    await likes.create({ postId, userId });
    return res.status(200).json({ message: "Post liked successfully." });
  } else {
    await likes.destroy({ where: { postId, userId } });
    return res.status(200).json({ message: "Post unliked successfully." });
  }
});

module.exports = router;
