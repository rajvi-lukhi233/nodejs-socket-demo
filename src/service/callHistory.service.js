import { callHistoryModel } from "../model/callHistory.model.js";

export const createCallHistory = (data) => {
  return callHistoryModel.create(data);
};
export const updateCallHistory = (filter, data) => {
  return callHistoryModel.findOneAndUpdate(filter, data, {
    returnDocument: "after",
  });
};
export const findCallHistoryById = (id, option) => {
  return callHistoryModel.findById(id, option).populate("callerId", "name");
};
