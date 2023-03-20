import express from "express";
import q2m from "query-to-mongo";
import createHttpError from "http-errors";
import ExperienceModel from "./experiencesModel.js";
import UserModel from "../users/model.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import createCsvWriter from "csv-writer";
import experiencesModel from "./experiencesModel.js";
import { pipeline } from "stream";
import fs from "fs";
import Json2csvParser from "json2csv";
const experiencesRouter = express.Router();

const cloudinaryUploader = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "U4-W4-BW4/experiences",
    },
  }),
}).single("expImg");

experiencesRouter.get("/:userId/experiences/CSV", async (req, res, next) => {
  try {
    const mongoQuery = q2m(req.query);
    const data = await experiencesModel.findExperiences(mongoQuery);

    const parsedJson = new Json2csvParser.Parser({ header: true });
    const csvData = parsedJson.parse(data);
    fs.writeFile("experiences.csv", csvData, function (error) {
      if (error) throw error;
    });
    // const csvWriter = createCsvWriter.createObjectCsvWriter({
    //   path: "experiences.csv",
    //   header: [
    //     { id: "role", title: "Role" },
    //     { id: "company", title: "Company" },
    //     { id: "startDate", title: "Start Date" },
    //     { id: "endDate", title: "End Date" },
    //     { id: "description", title: "Description" },
    //     { id: "imageUrl", title: "Image" },
    //   ],
    // });
    // csvWriter
    //   .writeRecords(data)
    //   .then(() => console.log("Write to experiences.csv successful!"));
    // res.send(csvWriter);
  } catch (error) {
    next(error);
  }
});

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
