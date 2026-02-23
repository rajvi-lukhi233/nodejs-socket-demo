import { userModel } from "../model/user.model.js";

export const findUser = (filter, option) => {
  return userModel.findOne(filter, option);
};

export const createUser = (data) => {
  return userModel.create(data);
};

export const updateUser = (id, data) => {
  return userModel.findByIdAndUpdate(id, data, { new: true });
};
