const fs = require("fs");
const path = require("path");
const express = require("express");

const app = express();

const { body, validationResult } = require("express-validator");

const mongoose = require("mongoose");

const multer = require("multer");

const { postModel } = require("./postModel");

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

app.post("/img", (req, res) => {
  if (req.file) {
    console.log(req.file);
    res.end("got image");
  } else {
    res.end("didnt get image");
  }
});

app.get("/posts", (req, res) => {
  postModel
    .find()
    .then((docs) => {
      if (!docs) {
        const er = new Error("No Docs found");
        er.statusCode = 404;
        throw er;
      }

      res.status(200).json(docs);
    })
    .catch((er) => {
      next(er);
    });
});

app.get("/posts/:postId", (req, res, next) => {
  let { postId } = req.params;
  postModel
    .findById(postId)
    .then((post) => {
      console.log("post is ", post);
      if (!post) {
        throw new Error("Post not found!");
      }
      res.status(200).json({ post });
    })
    .catch((er) => {
      console.log("er msg catch -> ", er.message);
      if (!er.statusCode) {
        er.statusCode = 404;
      }
      next(er);
    });
});

app.post(
  "/posts",
  [
    body("title").trim().isLength({ min: 10 }).withMessage("Title too short"),
    body("content")
      .trim()
      .isLength({ min: 10 })
      .withMessage("Content-Body Too short"),
  ],
  (req, res, next) => {
    console.log("/posts");
    const errors = validationResult(req);
    console.log(req.body);
    console.log(errors);
    if (!errors.isEmpty()) {
      const error = new Error("Validation failed!");
      error.statusCode = 422;
      error.actualErrors = errors;
      throw error;
    }
    if (!req.file) {
      const error = new Error("Image not uploaded!");
      error.statusCode = 422;
      error.actualErrors = errors;
      throw error;
    }
    const imageUrl = req.file.path;
    console.log("data recieved ", req.body, req.file);
    // res.end('Its ok!')
    const post = new postModel({
      title: req.body.title,
      content: req.body.content,
      creator: { name: "Mr X" },
      imageUrl: imageUrl,
    });
    post
      .save()
      .then((result) => {
        console.log(result);
        res.status(201).json({
          message: "Post created sucessfully",
          post: post,
        });
      })
      .catch((er) => {
        er.statusCode = 500;
        next(er);
      });
  }
);

app.put("/posts/:postId", (req, res, next) => {
  let { postId } = req.params;
  console.log("put ", postId);
  let { title, content, imageUrl } = req.body;
  console.log(req.body, req.file);
  if (req.file) {
    console.log(" old img-> ", imageUrl, " and new img-> ", req.file.path);
    fs.unlink(imageUrl, (err) =>
      err ? console.log(err.message) : console.log("Old Img Deleted!")
    );
    imageUrl = req.file.path;
  }
  console.log("to be saved ===> ", title, content, imageUrl);

  postModel
    .findById(postId)
    .then((post) => {
      post.title = title;
      post.content = content;
      post.imageUrl = imageUrl;
      return post.save();
    })
    .then((savedPost) => {
      console.log("new post saved!");
      res.status(200).json({
        message: "Post updated successfully!",
        post: savedPost,
      });
    })
    .catch((er) => {
      er.statusCode = 500;
      next(er);
    });
  // res.end("ok!");
});

app.delete("/posts/:postId", (req, res, next) => {
  const { postId } = req.params;
  postModel
    .findById(postId)
    .then((post) => {
      // we will check loggedIn User.

      if (post) {
        fs.unlink(post.imageUrl, (err) =>
          err ? console.log(err.message) : console.log("Post Img Deleted!")
        );
        return postModel.findByIdAndRemove(postId);
      }
    })
    .then((result) => {
      console.log("Post Deleted ", result);
      res.status(200).json({
        message: "Post Deleted",
      });
    })
    .catch((er) => {
      er.statusCode = 500;
      next(er);
    });
});

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
