import express from "express";
import { uploadMedia } from "../controller/uploadMedia.controller.js";
import { upload } from "../util/multer.js";
const route = express.Router();

route.post("/uploadMedia", upload.single("media"), uploadMedia);

export default route;
