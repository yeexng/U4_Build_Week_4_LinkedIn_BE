import express from "express";
import createHttpError from "http-errors";
import ExperienceModel from "./experiencesModel.js";
import UserModel from "../users/model.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { format } from "date-fns";
import { stringify } from "csv-stringify";
import { pipeline, Readable } from "stream";

const experiencesRouter = express.Router();

const cloudinaryUploader = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "U4-W4-BW4/experiences",
    },
  }),
}).single("expImg");

experiencesRouter.get(
  "/:userId/experiences/CSV",
  async (request, response, next) => {
    try {
      const experiences = await ExperienceModel.find();
      const foundExperiences = experiences.filter(
        (exp) => exp.user.toString() === request.params.userId
      );

      const experiencesReadableStream = new Readable({
        objectMode: true,
        read() {
          foundExperiences.forEach((exp) => {
            const formattedExp = exp.toObject();
            formattedExp.startDate = format(
              new Date(exp.startDate),
              "dd.MM.yyyy"
            );
            formattedExp.endDate = formattedExp.endDate
              ? format(new Date(exp.endDate), "dd.MM.yyyy")
              : null;
            this.push(formattedExp);
          });
          this.push(null);
        },
      });

      const csvTransform = stringify({
        header: true,
        columns: ["role", "company", "area", "startDate", "endDate"],
      });

      response.setHeader(
        "Content-Disposition",
        `attachment; filename=experiences${request.params.userId}.csv`
      );

      const source = experiencesReadableStream;
      const transform = csvTransform;
      const destination = response;

      pipeline(source, transform, destination, (error) => {
        if (error) console.error(error);
      });
    } catch (error) {
      next(error);
    }
  }
);

experiencesRouter.get("/:userId/experiences", async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.params.userId);
    if (!user) {
      next(
        createHttpError(404, `User with id ${req.params.user} was not found!`)
      );
    }
    res.send(user.experience);
  } catch (error) {
    next(error);
  }
});

experiencesRouter.get(
  "/:userId/experiences/:experienceId",
  async (req, res, next) => {
    try {
      const user = await UserModel.findById(req.params.userId);
      if (user) {
        const experience = user.experience.find(
          (e) => e._id.toString() === req.params.experienceId
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
      }
    } catch (error) {
      next(error);
    }
  }
);

experiencesRouter.post("/:userId/experiences", async (req, res, next) => {
  try {
    const user = UserModel.findById(req.params.userId);
    if (user) {
      const newExp = new ExperienceModel(req.body);
      const { _id } = await newExp.save();
      const updatedUser = await UserModel.findByIdAndUpdate(
        req.params.userId,
        { $push: { experience: _id } },
        { new: true, runValidators: true }
      );

      res.status(201).send({ updatedUser: updatedUser });
    } else {
      createHttpError(
        404,
        `User with the id: ${req.params.userId} was not found!`
      );
    }
  } catch (error) {
    next(error);
  }
});

experiencesRouter.put(
  "/:userId/experiences/:experienceId",
  async (req, res, next) => {
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
  }
);

experiencesRouter.delete(
  "/:userId/experiences/:experienceId",
  async (req, res, next) => {
    try {
      const experience = await ExperienceModel.findByIdAndDelete(
        req.params.experienceId
      );
      await UserModel.findByIdAndUpdate(
        req.params.userId,
        { $pull: { experience: req.params.experienceId } },
        { new: true, runValidators: true }
      );
      if (experience) {
        res.status(204).send();
      } else {
        next(
          createHttpError(
            404,
            `Experience with id ${req.params.experienceId} not found!`
          )
        );
      }
    } catch (error) {
      next(error);
    }
  }
);

experiencesRouter.post(
  "/:userId/experiences/:experienceId/image",
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
