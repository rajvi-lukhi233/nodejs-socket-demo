import express from "express";
import { connectDB } from "../config/dbConfig.js";
import http from "http";
import { Server } from "socket.io";
import { initSocket } from "./util/socket.js";
import { createResponseHandler } from "smart-response";
import indexRoute from "./route/index.js";
import path from "path";

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000;

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
app.use(createResponseHandler());
app.use(express.json());
connectDB();
initSocket(io);
app.use("/api", indexRoute);
app.use("/public", express.static(path.resolve("src", "public")));
server.listen(port, () => {
  console.log(`Sever running on port ${port}`);
});
