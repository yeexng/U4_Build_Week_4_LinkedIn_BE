import mongoose from "mongoose";

const { Schema, model } = mongoose;

const experiencesModel = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "users" },
  role: { type: String, required: true },
  company: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  description: { type: String, required: true },
  area: { type: String, required: true },
  imageUrl: {
    default:
      "https://res.cloudinary.com/dlfkpg7my/image/upload/v1679311395/U4-W4-BW4/experiences/gmn46sgjhli13havaluq.png",
    type: String,
  },
});

experiencesModel.static("findExperiences", async function (query) {
  const experiences = await this.find(query.criteria, query.options.fields)
    .sort(query.options.sort)
    .populate({ path: "user" });
  return experiences;
});

export default model("experiences", experiencesModel);
