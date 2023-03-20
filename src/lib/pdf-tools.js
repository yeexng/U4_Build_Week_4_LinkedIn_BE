import PdfPrinter from "pdfmake";
import imageToBase64 from "image-to-base64";
import { pipeline } from "stream";
import { promisify } from "util";
import fs from "fs-extra";
import { createWriteStream } from "fs";

const getUserPDFWriteStream = (fileName) => createWriteStream();
