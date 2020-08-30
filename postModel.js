const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    imageUrl: { type: String },
    content: { type: String, required: true },
    creator: { type: Object, required: true },
  },
  { timestamps: true }
);

exports.postModel = mongoose.model("PostsCollection", postSchema);



// const posts = {
//   posts: [
//     {
//       _id: Math.floor(Math.random() * 10000),
//       title: "A",
//       content: "The Post A",
//       createdAt: new Date(),
//       creator: { name: "User A" },
//     },
//   ],
// };