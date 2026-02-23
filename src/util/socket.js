import { findOneGroup } from "../service/group.service.js";
import { createMessage, updateMessage } from "../service/message.service.js";
import { createRoom, findOneRoom } from "../service/room.service.js";
import { CHAT_TYPE, MSG_TYPE } from "./constant.js";

export const initSocket = (io) => {
  // connect socket
  let onlineUsers = {};
  io.on("connection", async (socket) => {
    console.log("socket join:", socket.id);
    const userId = socket.handshake.query.userId;
    if (!userId) {
      console.log("userId not provide");
    }
    onlineUsers[userId] = socket.id;
    io.emit("onlineUsers", {
      users: Object.keys(onlineUsers),
    });

    //  join room
    socket.on("roomJoin", async (data) => {
      const { roomId, receiverId, chatType } = data;
      let newRoomId = roomId;

      if (!receiverId) {
        return errorEmit(socket, "roomJoin", "receiverId is required");
      }
      // 1. if group then checking group existing and required roomId
      if (chatType == CHAT_TYPE.GROUP) {
        const group = await findOneGroup({ _id: roomId }, { _id: 1 });
        if (!roomId) {
          return errorEmit(socket, "roomJoin", "roomId is required");
        }
        if (!group) {
          return errorEmit(socket, "roomJoin", "This group not found");
        }
      }
      // 2. checking room is existing
      if (roomId) {
        const room = await findOneRoom({ roomId });
        if (!room) {
          return errorEmit(socket, "roomJoin", "Room is not found");
        }
        if (!room.users.includes(userId)) {
          return errorEmit(socket, "roomJoin", "You do not has this room");
        }
      } else {
        newRoomId = await createRoomFn(userId, receiverId);
      }
      // 3. join room
      if (!socket.rooms.has(roomId)) {
        socket.join(newRoomId);
      }
      socket.emit("roomJoin", { success: true, roomId: newRoomId });
    });

    //  send message
    socket.on("sendMessage", async (data) => {
      try {
        const {
          message,
          chatType,
          senderId,
          receiverId,
          roomId,
          msgType,
          mediaFile,
        } = data;
        if (!chatType || !senderId || !receiverId || !roomId || !msgType) {
          return errorEmit(
            socket,
            "receiveMessage",
            "required field is missing",
          );
        }
        if (
          (msgType == MSG_TYPE.IMAGE || msgType == MSG_TYPE.VIDEO) &&
          !mediaFile
        ) {
          return errorEmit(socket, "receiveMessage", "mediaFile is required");
        }
        const room = await findOneRoom({ roomId }, { _id: 1 });
        const newMessage = await createMessage({
          mediaFile,
          message,
          chatType,
          senderId,
          receiverId,
          msgType,
          roomId: room._id,
        });

        io.to(roomId).emit("receiveMessage", {
          success: true,
          data: newMessage,
        });
      } catch (error) {
        console.log("send message error", error);
      }
    });

    // typing start
    socket.on("typing", (data) => {
      const { roomId } = data;
      if (!roomId) {
        return errorEmit(socket, "userTyping", "roomId is required");
      }
      // send to others except sender
      socket.to(roomId).emit("userTyping", {
        success: true,
        senderId: userId,
        isTyping: true,
      });
    });

    // stop typing
    socket.on("stopTyping", (data) => {
      const { roomId } = data;
      if (!roomId) {
        return errorEmit(socket, "userTyping", "roomId is required");
      }
      // send to others except sender
      socket.to(roomId).emit("userTyping", {
        success: true,
        senderId: userId,
        isTyping: false,
      });
    });

    //message read
    socket.on("readMessage", async (data) => {
      const { msgReaderId, roomId } = data;
      if (!msgReaderId || !roomId) {
        return errorEmit(socket, "readMessage", "required field is missing");
      }
      await updateMessage(
        { receiverId: msgReaderId, senderId: userId, isRead: false },
        { isRead: true },
      );
      socket
        .to(roomId)
        .emit("readMessage", { success: true, msgReaderId, isRead: true });
    });

    //  disconnect socket
    socket.on("disconnect", () => {
      delete onlineUsers[userId];
      io.emit("onlineUsers", {
        users: Object.keys(onlineUsers),
      });
      console.log("Disconnect socket");
    });
  });
};

// function for create room
async function createRoomFn(userId, receiverId) {
  const roomId1 = userId + "_" + receiverId;
  const roomId2 = receiverId + "_" + userId;
  let room = await findOneRoom(
    {
      $or: [{ roomId: roomId1 }, { roomId: roomId2 }],
    },
    { _id: 1, roomId: 1 },
  );
  if (!room) {
    room = await createRoom({ roomId: roomId1, users: [userId, receiverId] });
  }
  return room.roomId;
}
function errorEmit(socket, event, message) {
  socket.emit(event, { success: false, message });
  console.log(`${event} Error:`, message);
}
//error emit function

//io.emit() : send to all connected client
//io.to().emit() : send to all client in room
//socket.emit() : send event to this socket
//socket.to().emit() : send all room join client except sender (sender not get)
//socket.broadcast.emit() : send event to all othere except sender
//socket.join(room) : join room
//socket.leave(room) : leave room
//socket.rooms : set of rooms
