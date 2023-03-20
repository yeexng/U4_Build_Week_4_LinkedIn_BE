import express from "express";
import createHttpError from "http-errors";
import ExperienceModel from "./experiencesModel.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

const experiencesRouter = express.Router();

const cloudinaryUploader = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "U4-W4-BW4/experiences",
    },
  }),
}).single("expImg");

experiencesRouter.get("/", async (req, res, next) => {
  try {
    const experiences = await ExperienceModel.find().sort(req.query.sort);
    if (experiences) {
      res.send(experiences);
    }
  } catch (error) {
    next(error);
  }
});

experiencesRouter.get("/:experienceId", async (req, res, next) => {
  try {
    const experience = await ExperienceModel.findById(req.params.experienceId);
    if (!experience) {
      next(
        createError(
          404,
          `Experience with id ${req.params.experienceId} was not found!`
        )
      );
    }
    res.send(experience);
  } catch (error) {
    next(error);
  }
});

experiencesRouter.post("/", async (req, res, next) => {
  try {
    const newExperiences = new ExperienceModel(req.body);
    const { _id } = await newExperiences.save();
    if (!newExperiences) {
      res.send(`Problems creating new experience!`);
    }
    res.status(201).send(newExperiences);
  } catch (error) {
    next(error);
  }
});

experiencesRouter.put("/:experienceId", async (req, res, next) => {
  try {
    const updatedExperience = await ExperienceModel.findByIdAndUpdate(
      req.params.experienceId,
      req.body,
      { new: true, runValidators: true }
    );
    if (updatedExperience) {
      res.send(updatedExperience);
    } else {
      next(
        createError(
          404,
          `Experience with id ${req.params.experienceId} was not found!`
        )
      );
    }
  } catch (error) {
    next(error);
  }
});

experiencesRouter.delete("/:experienceId", async (req, res, next) => {
  try {
    const experience = await ExperienceModel.findByIdAndDelete(
      req.params.experienceId
    );
    if (experience) {
      res.status(204).send();
    } else {
      next(
        createError(
          404,
          `Experience with id ${req.params.experienceId} was not found!`
        )
      );
    }
  } catch (error) {
    next(error);
  }
});

experiencesRouter.post(
  "/:experienceId/image",
  cloudinaryUploader,
  async (req, res, next) => {
    try {
      const experience = await ExperienceModel.findByIdAndUpdate(
        req.params.experienceId,
        { imageUrl: req.file.path },
        { new: true, runValidators: true }
      );
      if (experience) {
        res.send(experience);
      } else {
        next(
          createHttpError(
            404,
            `Experience with id ${req.params.experienceId} was not found!`
          )
        );
      }
    } catch (error) {
      next(error);
    }
  }
);

export default experiencesRouter;
