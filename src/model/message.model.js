import mongoose from "mongoose";
import { CHAT_TYPE, DB_NAME, MSG_TYPE } from "../util/constant.js";

const messageSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: DB_NAME.ROOM,
      default: null,
    },
    message: {
      type: String,
      default: null,
    },
    mediaFile: {
      type: String,
      default: null,
    },
    msgType: {
      type: String,
      enum: Object.values(MSG_TYPE),
      default: MSG_TYPE.TEXT,
    },
    groupId: {
      type: String,
      default: null,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: DB_NAME.USER,
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: DB_NAME.USER,
      required: true,
    },
    chatType: {
      type: String,
      enum: Object.values(CHAT_TYPE),
      default: CHAT_TYPE.PERSONAL,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

messageSchema.virtual("mediaUrl").get(function () {
  if (!this.mediaFile) {
    return null;
  }
  return `${process.env.BASE_URL}/public/${this.mediaFile}`;
});
export const messageModel = mongoose.model(DB_NAME.MESSAGE, messageSchema);
