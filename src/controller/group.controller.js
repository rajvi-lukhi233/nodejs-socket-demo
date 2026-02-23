import mongoose from "mongoose";
import {
  createGroup,
  findAllGroup,
  findOneGroup,
  updateGroup,
} from "../service/group.service.js";
import { createRoom, updateRoom } from "../service/room.service.js";

export const createNewGroup = async (req, res) => {
  try {
    const { groupName, users } = req.body;
    const { userId } = req.user;
    const allusers = [...users, userId];
    const existGroup = await findOneGroup({ groupName });
    if (existGroup) {
      return res.fail(400, "Group is alreday exists");
    }
    const group = await createGroup({ groupName, users: allusers });
    await createRoom({
      roomId: group._id,
      groupId: group._id,
      users: allusers,
    });
    return res.success(201, "Group created successfully", group);
  } catch (error) {
    console.log("CreateNewGroup API Error:", error);
    return res.fail(500, "Internal server error");
  }
};

export const groupList = async (req, res) => {
  try {
    const groups = await findAllGroup();
    return res.success(200, "Group list retrive successfully", groups || []);
  } catch (error) {
    console.log("GroupList API Error:", error);
    return res.fail(500, "Internal server error");
  }
};

export const addOrRemoveMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { users, isRemove } = req.body;
    const group = await findOneGroup({ _id: groupId }, { _id: 1 });
    const userIds = users.map((id) => new mongoose.Types.ObjectId(id));
    if (!group) {
      return res.fail(404, "Group not found");
    }
    if (isRemove) {
      await updateGroup(groupId, { $pull: { users: { $in: userIds } } });
      await updateRoom(
        { roomId: groupId },
        { $pull: { users: { $in: userIds } } },
      );
    } else {
      await updateGroup(groupId, { $addToSet: { users } });
      await updateRoom({ roomId: groupId }, { $addToSet: { users } });
    }

    return res.success(
      200,
      isRemove ? "Users removed from group" : "Users added to group",
    );
  } catch (error) {
    console.log("AddOrRemoveMember API Error:", error);
    return res.fail(500, "Internal server error");
  }
};
