const express = require("express");
const router = express.Router();
const { users } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// signup route
router.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body;
    const existingUser = await users.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await users.create({ username, password: hashedPassword });
    res.json({ message: "User created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});
// login route
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await users.findOne({ where: { username } });
    if (!user) {
      return res.status(400).json({ message: "Invalid username " });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid password" });
    }
    const token = jwt.sign(
      { username: user.username, id: user.id },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );
    res.json({ token, message: "Login successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
