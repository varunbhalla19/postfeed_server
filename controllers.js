const fs = require("fs");
const path = require("path");

const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");

const { postModel, userSchema } = require("./postModel");

const bcrypt = require("bcryptjs");

const itemsPerPage = 2;

const signUpController = (req, res, next) => {
  const errors = validationResult(req);
  console.log(errors);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed!");
    error.statusCode = 422;
    error.actualErrors = errors;
    throw error;
  }

  const { email, name, password } = req.body;

  bcrypt
    .hash(password, 5)
    .then((result) => {
      console.log("original and hashed pw => ", password, result);
      const user = new userSchema({
        name,
        email,
        password: result,
      });
      return user.save();
    })
    .then((savedUser) => {
      console.log("User saved! ", savedUser);
      res.status(201).json({
        message: "User Created!",
        user: savedUser,
      });
    })
    .catch((er) => {
      console.log("er msg catch -> ", er.message);
      if (!er.statusCode) {
        er.statusCode = 500;
      }
      next(er);
    });
};

const getPostsController = (req, res, next) => {
  console.log("page =>", req.query.page);
  const page = req.query.page || 1;

  postModel
    .find()
    .skip((page - 1) * itemsPerPage)
    .limit(itemsPerPage)
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
};

const getSinglePostController = (req, res, next) => {
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
};

const addPostController = (req, res, next) => {
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
};

const updatePostController = (req, res, next) => {
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
};

const deletePostController = (req, res, next) => {
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
};

const loginController = (req, res, next) => {
  const { email, password } = req.body;
  console.log("/post login ", email, password);
  let user;
  userSchema
    .findOne({ email: email })
    .then((doc) => {
      if (!doc) {
        const err = new Error("User Doesn't Exist");
        err.statusCode = 404;
        throw err;
      }
      console.log("user found!", doc);

      let email = doc.email,
        userId = doc._id.toString();

      return bcrypt.compare(password, doc.password).then((equal) => {
        console.log("isEqual => ", equal);
        if (!equal) {
          const err = new Error("Wrong Password!");
          err.statusCode = 401;
          throw err;
        }
        console.log('email and pass match!!!');
        const token = jwt.sign(
          { email, userId },
          "secretshouldremainsecretnomatterwhathappens",
          { expiresIn: "4h" }
        );
        console.log("token is ", token);
        res.status(200).json({ token, userId, email });
      });
    })
    .catch((er) => {
      er.statusCode = 500;
      next(er);
    });
};

exports.getPostsController = getPostsController;
exports.getSinglePostController = getSinglePostController;
exports.addPostController = addPostController;
exports.updatePostController = updatePostController;
exports.signUpController = signUpController;
exports.deletePostController = deletePostController;
exports.loginController = loginController;
