import path from "path";

import express from "express";
import ffi from "ffi-napi";
import multer from "multer";
import sharp from "sharp";

async function decodeImage(buffer: Buffer) {
  return new Promise<{ buffer: Buffer; info: sharp.OutputInfo }>(
    (resolve, reject) => {
      sharp(buffer)
        .raw()
        .toBuffer((err, data, info) => {
          if (err) reject(err);

          resolve({ buffer: data, info });
        });
    },
  );
}

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

    let image: { buffer: Buffer; info: sharp.OutputInfo };
    try {
      image = await decodeImage(req.file.buffer);
    } catch (error) {
      console.error(error);
      return res.status(400).send("Invalid image.");
    }

    const result = lib.anpr_read_pixels(
      // @ts-ignore
      image.buffer,
      image.info.width,
      image.info.height,
      0,
      image.info.channels === 4 ? "RGBA" : "RGB",
      "json",
      "v",
    );

    res.status(200).json(result);
  });

  app.listen(3000);
}

bootsrap();
