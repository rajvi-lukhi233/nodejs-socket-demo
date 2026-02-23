import mongoose from "mongoose";
import { DB_NAME } from "../util/constant.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, versionKey: false },
);

export const userModel = mongoose.model(DB_NAME.USER, userSchema);
