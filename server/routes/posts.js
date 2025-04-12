const express = require("express");
const router = express.Router();
const { posts, likes, comments } = require("../models");
const { sequelize } = require("../models");

// Get all posts with counts
router.get("/", async (req, res) => {
  try {
    const allPosts = await posts.findAll({
      attributes: {
        include: [
          // Subquery to count likes
          [
            sequelize.literal(`(
              SELECT COUNT(*) FROM likes WHERE likes.postId = posts.id
            )`),
            "likesCount",
          ],
          // Subquery to count comments
          [
            sequelize.literal(`(
              SELECT COUNT(*) FROM comments WHERE comments.postId = posts.id
            )`),
            "commentsCount",
          ],
        ],
      },
      order: sequelize.random(),
    });
    res.json(allPosts);
  } catch (error) {
    console.error("❌ Error fetching posts with counts:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
// Get a post by id
router.get("/post/:id", async (req, res) => {
  const post = await posts.findByPk(req.params.id);
  res.json(post);
});

// get posts by userId
router.get("/user/:id", async (req, res) => {
  try {
    const userPosts = await posts.findAll({
      where: { userId: req.params.id },
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(*) FROM likes WHERE likes.postId = posts.id
            )`),
            "likesCount",
          ],
          [
            sequelize.literal(`(
              SELECT COUNT(*) FROM comments WHERE comments.postId = posts.id
            )`),
            "commentsCount",
          ],
        ],
      },
      order: [["createdAt", "DESC"]],
    });

    res.json(userPosts);
  } catch (error) {
    console.error("❌ Error fetching user posts:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Create a post
router.post("/", async (req, res) => {
  const post = req.body;
  await posts.create(post);
  res.json(post);
});

module.exports = router;
