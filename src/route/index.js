import express from "express";
import authRoute from "./auth.route.js";
import groupRoute from "./group.route.js";
import uploadMedia from "./uploadMedia.route.js";

const route = express.Router();

route.use("/auth", authRoute);
route.use("/group", groupRoute);
route.use("/media", uploadMedia);

export default route;
