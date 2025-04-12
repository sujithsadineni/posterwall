const express = require("express");
const app = express();
const cors = require("cors");
const db = require("./models");
require("dotenv").config();

//Middleware
app.use(cors());
app.use(express.json());

//Routes
const postsRouter = require("./routes/posts");
app.use("/api/posts", postsRouter);

const commentsRouter = require("./routes/comments");
app.use("/api/comments", commentsRouter);

const userRouter = require("./routes/users");
app.use("/api/users", userRouter);

const likesRouter = require("./routes/likes");
app.use("/api/likes", likesRouter);

db.sequelize.sync().then(() => {
  app.listen(4000, () => {
    console.log("Server is running on port 4000");
  });
});
