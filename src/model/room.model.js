import mongoose from "mongoose";
import { CHAT_TYPE, DB_NAME } from "../util/constant.js";

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: DB_NAME.USER,
        required: true,
      },
    ],
    groupId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true, versionKey: false },
);

export const roomModel = mongoose.model(DB_NAME.ROOM, roomSchema);
