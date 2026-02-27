import mongoose from "mongoose";
import { CALL_STATUS, CALL_TYPE, DB_NAME } from "../util/constant.js";

const callHistorySchema = new mongoose.Schema(
  {
    callerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: DB_NAME.USER,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: DB_NAME.USER,
    },
    status: {
      type: String,
      enum: Object.values(CALL_STATUS),
      default: CALL_STATUS.RINGING,
    },
    duration: {
      type: Number,
      default: 0,
    },
    startedAt: {
      type: Date,
      default: new Date(),
    },
    callType: {
      type: String,
      enum: Object.values(CALL_TYPE),
      required: true,
    },
    endedAt: {
      type: Date,
    },
  },
  { timestamps: true, versionKey: false },
);

export const callHistoryModel = mongoose.model(
  DB_NAME.CALLHISTORY,
  callHistorySchema,
);
