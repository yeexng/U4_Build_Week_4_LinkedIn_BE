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
            folder: "U4-W4-BW4/posts",
        },
    }),
}).single("post");

//POST a post
postsRouter.post("/", async (req, res, next) => {
    try {
        const newPost = new PostsModel(req.body);
        const { _id } = await newPost.save();
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

//POST an image to a post
postsRouter.post(
    "/:postID/image",
    cloudinaryUploader,
    async (req, res, next) => {
        try {
            const post = await PostsModel.findById(req.params.postID);
            if (post) {
                post.image = req.file.path;
                await post.save();
                res.status(201).send({
                    success: "true",
                    message: `Image has been added to post with id ${req.params.postID}!`,
                });
            } else {
                next(
                    createHttpError(404, `Post with ID ${req.params.postID} not found!`)
                );
            }
        } catch (error) {
            next(error);
        }
    }
);

//Comments
postsRouter.post("/:postID/comments", async (req, res, next) => {
    try {
        const newComment = req.body;
        const commentToInsert = {
            ...newComment,
        };
        const updatedPosts = await PostsModel.findByIdAndUpdate(
            req.params.postID,
            { $push: { comments: commentToInsert } },
            { new: true, runValidators: true }
        );
        if (updatedPosts) {
            res.status(201).send(updatedPosts);
        } else {
            next(
                createHttpError(404, `Post with id ${req.params.postID} not found!`)
            );
        }
    } catch (error) {
        next(error);
    }
});

postsRouter.get("/:postID/comments", async (req, res, next) => {
    try {
        const post = await PostsModel.findById(req.params.postID);
        if (post) {
            res.send(post.comments);
        } else {
            next(
                createHttpError(404, `Post with id ${req.params.postID} not found!`)
            );
        }
    } catch (error) {
        next(error);
    }
});

postsRouter.get("/:postID/comments/:commentId", async (req, res, next) => {
    try {
        const post = await PostsModel.findById(req.params.postID);
        if (post) {
            const comment = post.comments.find(
                (r) => r._id.toString() === req.params.commentId
            );
            if (comment) {
                res.send(comment);
            } else {
                next(
                    createHttpError(
                        404,
                        `Review with id ${req.params.commentId} not found!`
                    )
                );
            }
        } else {
            next(
                createHttpError(404, `Product with id ${req.params.postID} not found!`)
            );
        }
    } catch (error) {
        next(error);
    }
});

postsRouter.put("/:postID/comments/:commentId", async (req, res, next) => {
    try {
        const post = await PostsModel.findById(req.params.postID);
        if (post) {
            const i = post.comments.findIndex(
                (r) => r._id.toString() === req.params.commentId
            );
            if (i !== -1) {
                post.comments[i] = {
                    ...post.comments[i].toObject(),
                    ...req.body,
                    updatedAt: new Date(),
                };
                await post.save();
                res.send(post.comments[i]);
            } else {
                next(
                    createHttpError(
                        404,
                        `Review with id ${req.params.commentId} not found!`
                    )
                );
            }
        } else {
            next(
                createHttpError(404, `Product with id ${req.params.postID} not found!`)
            );
        }
    } catch (error) {
        next(error);
    }
});

postsRouter.delete("/:postID/comments/:commentId", async (req, res, next) => {
    try {
        const post = await PostsModel.findByIdAndUpdate(
            req.params.postID,
            { $pull: { comments: { _id: req.params.commentId } } },
            { new: true, runValidators: true }
        );
        if (post) {
            res.status(204).send();
        } else {
            next(
                createHttpError(
                    404,
                    `Review with id ${req.params.commentId} not found!`
                )
            );
        }
    } catch (error) {
        next(error);
    }
});

export default postsRouter;
