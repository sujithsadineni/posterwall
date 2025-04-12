const express = require("express");
const router = express.Router();
const { comments } = require("../models");
const { validateUser } = require("../middlewares/userMiddleware");

router.get("/", async (req, res) => {
  const allComments = await comments.findAll();
  res.json(allComments);
});

router.get("/:id", async (req, res) => {
  const comment = await comments.findAll({
    where: { postId: req.params.id },
  });
  res.json(comment);
});

router.post("/", validateUser, async (req, res) => {
  const { postId, comment } = req.body;
  const username = req.user.username;
  const userId = req.user.id;
  const newComment = await comments.create({
    postId,
    comment,
    username,
    userId,
  });
  res.json(newComment);
});

router.delete("/:id", validateUser, async (req, res) => {
  const comment = await comments.findOne({ where: { id: req.params.id } });
  if (comment.username !== req.user.username) {
    return res
      .status(403)
      .json({ message: "You are not authorized to delete this comment." });
  }
  await comments.destroy({ where: { id: req.params.id } });
  res.json({ message: "Comment deleted successfully." });
});

module.exports = router;
