import express from "express";
import {
  addOrRemoveMember,
  createNewGroup,
  groupList,
} from "../controller/group.controller.js";
import { auth } from "../middleware/authMiddleware.js";
const route = express.Router();

route.post("/createGroup", auth, createNewGroup);
route.get("/list", groupList);
route.patch("/addOrRemoveMember/:groupId", auth, addOrRemoveMember);

export default route;
