const fs = require("fs");
const path = require("path");
const express = require("express");

const app = express();

const { body, validationResult } = require("express-validator");

const mongoose = require("mongoose");

const multer = require("multer");

const {
  getPostsController,
  getSinglePostController,
  addPostController,
  updatePostController,
  signUpController,
  deletePostController,
  loginController,
} = require("./controllers");
const { userSchema } = require("./postModel");

const uri =
  "mongodb+srv://node_mongo_project:Su4Z5vwEAKhdUke9@varunmongocluster.hjtgo.mongodb.net/posts?retryWrites=true&w=majority";

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "images"),
  filename: (req, file, cb) => cb(null, Date.now() + file.originalname),
});

app.use(multer({ storage: fileStorage }).single("image"));

app.use(express.json()); // incoming data will be in json format

app.use("/images", express.static(path.join(__dirname, "images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.get("/posts", getPostsController);

app.get("/posts/:postId", getSinglePostController);

app.post(
  "/posts",
  [
    body("title").trim().isLength({ min: 10 }).withMessage("Title too short"),
    body("content")
      .trim()
      .isLength({ min: 10 })
      .withMessage("Content-Body Too short"),
  ],
  addPostController
);

app.put("/posts/:postId", updatePostController);

app.delete("/posts/:postId", deletePostController);

app.put(
  "/auth/signup",
  [
    body("email")
      .isEmail()
      .withMessage("Enter a valid Email!")
      .normalizeEmail()
      .custom((value, { req }) => {
        return userSchema
          .findOne({ email: value })
          .then((doc) =>
            doc ? Promise.reject("Email Exists") : Promise.resolve(true)
          );
      }),
    body("name").trim().not().isEmpty(),
    body("password")
      .trim()
      .isLength({ min: 6 })
      .withMessage("Password length min 6"),
  ],
  signUpController
);

app.post("/auth/login", loginController);

// Er Handler
app.use((er, req, res, next) => {
  console.log("inside er handler!");
  console.log(er.message);
  if (req.file) {
    if (req.file.path) {
      const filePath = path.join(__dirname, req.file.path);
      fs.unlink(filePath, (err) => console.log(err));
    }
  }
  // if (er.statusCode) {
  if (er.actualErrors) {
    res.status(er.statusCode).json({
      message: er.message,
      actual_errors: er.actualErrors,
    });
  } else {
    res.status(er.statusCode).json({
      message: er.message,
    });
  }
  // res.end("Er!");
  // }
});

mongoose
  .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((_) => {
    console.log("DB connected!");
    app.listen(8000, (_) => console.log("listening"));
  });

console.log("--------------------------------------------------");

// const express = require("express");
// const app = express();
// app.get("/", (req, res, next) => {  console.log("m1");  next();});

// app.get("/", (req, res, next) => {  console.log("m2");  throw new Error("Some Random Error");  next(); });

// app.get("/", (req, res, next) => {  console.log("m3");  next(); });

// app.use((error, req, res, next) => {  console.log("m4");  res.status(500).end("over!");});

// app.listen(8000, () => console.log("Listening!"));
