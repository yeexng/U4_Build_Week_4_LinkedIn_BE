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
            folder: "U4-W4-BW4/posts"
        },
    }),
}).single("post")

//POST a post
postsRouter.post("/", async (req, res, next) => {
    try {
        const newPost = new PostsModel(req.body)
        const { _id } = await newPost.save()
        res.status(201).send({ _id })
    } catch (error) {
        next(error)
    }
})

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
        const deletedPost = await PostsModel.findByIdAndDelete(req.params.postID)
        if (deletedPost) {
            res.status(204).send()
        } else {
            next(createHttpError(404, `Post with ID ${req.params.postID} not found!`))
        }
    } catch (error) {
        next(error)
    }
})

//POST an image to a post
postsRouter.post("/:postID/image", cloudinaryUploader, async (req, res, next) => {
    try {
        const post = await PostsModel.findById(req.params.postID)
        if (post) {
            post.image = req.file.path;
            await post.save()
            res.status(201).send({
                success: "true",
                message: `Image has been added to post with id ${req.params.postID}!`
            })
        } else {
            next(createHttpError(404, `Post with ID ${req.params.postID} not found!`))
        }
    } catch (error) {
        next(error)
    }
})

//liking a post
postsRouter.put("/:postID/like", async (req, res, next) => {
    try {
        const post = await PostsModel.findById(req.params.postID)
        if (post) {
            if (!post.likes.includes(req.body.userID.toString())) {
                console.log("does not include, lets add")
                const updatedPost = await PostsModel.findByIdAndUpdate(
                    req.params.postID,
                    { $push: { likes: req.body.userID } },
                    { new: true, runValidators: true })
                res.send({ message: `User with id ${req.body.userID} liked the post with id ${req.params.postID}!`, count: updatedPost.likes.length, isLiked: true })
            } else {
                console.log("includes, lets delete")
                const updatedPost = await PostsModel.findByIdAndUpdate(
                    req.params.postID,
                    { $pull: { likes: req.body.userID } },
                    { new: true, runValidators: true })
                res.send({ message: `User with id ${req.body.userID} disliked the post with id ${req.params.postID}!`, count: updatedPost.likes.length, isLiked: false })
            }
        } else {
            next(createHttpError(404, `Post with id ${req.params.postID} not found!`))
        }
    } catch (error) {
        next(error)
    }
})

//adding a comment into a post
postsRouter.post("/:postID/comments", async (req, res, next) => {
    try {
        const comment = { ...req.body }
        const updatedPost = await PostsModel.findByIdAndUpdate(
            req.params.postID,
            { $push: { comments: comment } },
            { new: true, runValidators: true })
        if (updatedPost) {
            res.send(updatedPost)
        } else {
            next(createHttpError(404, `Post with id ${req.params.postID} not found!`))
        }
    } catch (error) {
        next(error)
    }
})

export default postsRouter
