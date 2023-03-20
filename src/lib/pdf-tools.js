import PdfPrinter from "pdfmake";
import imageToBase64 from "image-to-base64";
import { pipeline } from "stream";
import { promisify } from "util";
import fs from "fs-extra";
import { createWriteStream } from "fs";

const getUsersPDFWriteStream = (fileName) => createWriteStream();

export const userToPDFReadableStream = async (user) => {
  const fonts = {
    Helvetica: {
      normal: "Helvetica",
      bold: "Helvetica-Bold",
      italics: "Helvetica-Oblique",
      bolditalics: "Helvetica-BoldOblique",
    },
  };
  const printer = new PdfPrinter(fonts);

  const encodedImage = await imageToBase64(user.image);

  const docDefinition = {
    content: [
      {
        image: `data:image/jpeg;base64,${encodedImage}`,
        width: 150,
      },
      user.name,
      user.surname,
      user.title,
      user.experience,
    ],
    defaultStyle: {
      font: "Helvetica",
    },
  };
  const pdfReadableStream = printer.createPdfKitDocument(docDefinition, {});
  pdfReadableStream.end();

  return pdfReadableStream;
};

export const asyncPDFGeneration = async (user) => {
  const source = await userToPDFReadableStream(user);
  const destination = getUsersPDFWriteStream("test.pdf");
  const promiseBasedPipeline = promisify(pipeline);
  await promiseBasedPipeline(source, destination);
};
