import mongoose from "mongoose";

const { Schema, model } = mongoose;

const commentsSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: "User" },
        comment: { type: String, required: true },
    },
    { timestamps: true }
);

const postsSchema = new Schema(
    {
        text: { type: String, required: true },
        image: { type: String, required: true },
        user: { type: Schema.Types.ObjectId, ref: "User" },
        likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
        comments: [commentsSchema],
    },
    {
        timestamps: true,
    }
);

postsSchema.static("findPostsWithUsers", async function (query) {
    const posts = await this.find(query.criteria, query.options.fields)
        .limit(query.options.limit)
        .skip(query.options.skip)
        .sort(query.options.sort)
        .populate({ path: "user", select: "name surname title image" });
    const total = await this.countDocuments(query.criteria);
    return { posts, total };
});

postsSchema.static("findPostWithUser", async function (id) {
    const post = await this.findById(id).populate({
        path: "user",
        select: "name surname title image",
    });
    return post;
});

export default model("Post", postsSchema);
