import { groupModel } from "../model/group.model.js";

export const createGroup = (data) => {
  return groupModel.create(data);
};
export const findOneGroup = (filter, option) => {
  return groupModel.findOne(filter, option);
};
export const findAllGroup = () => {
  return groupModel.find();
};
export const updateGroup = (id, data) => {
  return groupModel.findByIdAndUpdate(id, data);
};
