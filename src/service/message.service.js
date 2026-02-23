import { messageModel } from "../model/message.model.js";

export const createMessage = (data) => {
  return messageModel.create(data);
};

export const updateMessage = (filter, data) => {
  return messageModel.updateMany(filter, data);
};
