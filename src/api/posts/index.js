import express from "express";
import createHttpError from "http-errors";
import PostsModel from "./model.js";
import q2m from "query-to-mongo";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { pipeline } from "stream";

const postsRouter = express.Router();

const cloudinaryUploader = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "LinkedIn-DB/posts",
    },
  }),
}).single("poster");

//POST a post
postsRouter.post("/", async (req, res, next) => {
  try {
    const newPost = new PostsModel(req.body);
    const { _id } = await newProduct.save();
    res.status(201).send({ _id });
  } catch (error) {
    next(error);
  }
});

//GET all posts
postsRouter.get("/", async (req, res, next) => {
  try {
    const mongoQuery = q2m(req.query);
    const { posts, total } = await PostsModel.findPostsWithUsers(mongoQuery);
    res.send({
      links: mongoQuery.links("http://localhost:3001/posts", total),
      total,
      numberOfPages: Math.ceil(total / mongoQuery.options.limit),
      posts,
    });
  } catch (error) {
    next(error);
  }
});

//GET a single post
postsRouter.get("/:postID", async (req, res, next) => {
  try {
    const post = await PostsModel.findPostWithUser(req.params.postID);
    if (post) {
      res.send(post);
    } else {
      next(
        createHttpError(404, `Post with ID ${req.params.postID} not found!`)
      );
    }
  } catch (error) {
    next(error);
  }
});

//PUT a post
postsRouter.put("/:postID", async (req, res, next) => {
  try {
    const updatedPost = await PostsModel.findByIdAndUpdate(
      req.params.postID,
      req.body,
      { new: true, runValidators: true }
    );
    if (updatedPost) {
      res.send(updatedPost);
    } else {
      next(
        createHttpError(404, `Post with ID ${req.params.postID} not found!`)
      );
    }
  } catch (error) {
    next(error);
  }
});

//DELETE a post
postsRouter.delete("/:postID", async (req, res, next) => {
  try {
    const deletedPost = await PostsModel.findByIdAndDelete(req.params.postID);
    if (deletedPost) {
      res.status(204).send();
    } else {
      next(
        createHttpError(404, `Post with ID ${req.params.postID} not found!`)
      );
    }
  } catch (error) {
    next(error);
  }
});

export default postsRouter;
