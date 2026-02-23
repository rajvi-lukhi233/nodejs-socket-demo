import mongoose from "mongoose";
import { DB_NAME } from "../util/constant.js";

const groupSchema = new mongoose.Schema(
  {
    groupName: {
      type: String,
      default: null,
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: DB_NAME.USER,
        required: true,
      },
    ],
  },
  { timestamps: true, versionKey: false },
);

export const groupModel = mongoose.model(DB_NAME.GROUP, groupSchema);
