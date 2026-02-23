import { roomModel } from "../model/room.model.js";

export const findRooms = (filter, option) => {
  return roomModel.find(filter, option);
};

export const findOneRoom = (filter, option) => {
  return roomModel.findOne(filter, option);
};

export const createRoom = (data) => {
  return roomModel.create(data);
};

export const updateRoom = (filter, data) => {
  return roomModel.findOneAndUpdate(filter, data);
};
