import path from "path";

import express from "express";
import ffi from "ffi-napi";
import jpeg from "jpeg-js";
import multer from "multer";
import sharp from "sharp";

function bootsrap() {
  const lib = ffi.Library(path.join(__dirname, "..", "bin", "libtsanpr.so"), {
    anpr_initialize: ["string", ["string"]],
    anpr_read_file: ["string", ["string", "string", "string"]],
    anpr_read_pixels: [
      "string",
      ["pointer", "int32", "int32", "int32", "string", "string", "string"],
    ],
  });

  const error = lib.anpr_initialize("json");
  if (error) {
    console.error();
    return -2;
  }

  const storage = multer.memoryStorage();
  const upload = multer({ storage });

  const app = express();

  app.post("/infer", upload.single("image"), async (req, res) => {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    const image = jpeg.decode(req.file.buffer, { formatAsRGBA: false });

    let metadata: sharp.Metadata;
    try {
      metadata = await sharp(req.file.buffer).metadata();
    } catch (error) {
      console.error(error);
      return res.status(400).send("Invalid image.");
    }

    const result = lib.anpr_read_pixels(
      // @ts-ignore
      image.data,
      metadata.width,
      metadata.height,
      0,
      "BGR",
      "json",
      "v",
    );

    res.status(200).json(result);
  });

  app.listen(3000);
}

bootsrap();
