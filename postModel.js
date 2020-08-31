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

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true },
    status: { type: String, default: 'New User' },
    posts : [
    {
        type : mongoose.SchemaTypes.ObjectId,
        ref : 'PostsCollection'
    }
    ]
  },
  { timestamps: true }
);


exports.postModel = mongoose.model("PostsCollection", postSchema);

exports.userSchema =  mongoose.model("UsersCollection", UserSchema);










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