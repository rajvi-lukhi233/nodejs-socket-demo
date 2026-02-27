import {
  createCallHistory,
  findCallHistoryById,
  updateCallHistory,
} from "../service/callHistory.service.js";
import { findOneGroup } from "../service/group.service.js";
import { createMessage, updateMessage } from "../service/message.service.js";
import { createRoom, findOneRoom } from "../service/room.service.js";
import { CALL_STATUS, CHAT_TYPE, MSG_TYPE } from "./constant.js";

export const initSocket = (io) => {
  // connect socket
  let onlineUsers = {};
  io.on("connection", async (socket) => {
    console.log("socket join:", socket.id);
    const userId = socket.handshake.query.userId;
    if (!userId) {
      console.log("userId not provide");
    }
    console.log("user join socket:", userId);
    onlineUsers[userId] = socket.id;
    io.emit("onlineUsers", {
      users: Object.keys(onlineUsers),
    });

    //  join room
    socket.on("roomJoin", async (data) => {
      const { roomId, receiverId, chatType } = data;
      let newRoomId = roomId;

      if (!receiverId || !chatType) {
        return errorEmit(
          socket,
          "roomJoin",
          "receiverId or chatType is required",
        );
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
          return errorEmit(
            socket,
            "roomJoin",
            "You are not a member of this room",
          );
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

    // video calling history
    socket.on("callUser", async (data) => {
      const { roomId, receiverId, callType } = data;
      if (!roomId || !receiverId || !callType) {
        console.log("callUser required field missing");
        return;
      }
      const call = await createCallHistory({
        callerId: userId,
        receiverId,
        status: CALL_STATUS.RINGING,
        callType,
      });
      const findCall = await findCallHistoryById(call._id, {
        _id: 1,
        callerId: 1,
      });
      io.to(roomId).emit("callUser", {
        callerId: userId,
        roomId,
        callId: call._id,
        callerName: findCall.callerId.name,
        callType,
      });
    });
    // accepte call
    socket.on("callAccept", async (data) => {
      const { roomId, callId } = data;
      if (!roomId || !callId) {
        console.log("callId or roomId is required at call accept");
        return;
      }
      const call = await updateCallHistory(
        { _id: callId },
        {
          status: CALL_STATUS.ACCEPTED,
          startedAt: new Date(),
        },
      );
      io.to(roomId).emit("callAccept", {
        callId,
        callerId: call.callerId,
      });
    });
    // reject call
    socket.on("callReject", async (data) => {
      const { callId, roomId } = data;
      if (!callId) {
        console.log("callId or roomId is required at call reject");
        return;
      }
      const call = await updateCallHistory(
        { _id: callId },
        {
          status: CALL_STATUS.REJECTED,
          endedAt: new Date(),
        },
      );
      io.to(roomId).emit("callReject", { callId, callerId: call.callerId });
    });
    //ended call
    socket.on("callEnded", async (data) => {
      const { callId, roomId } = data;
      if (!callId || !roomId) {
        console.log("callId or roomId is required at call accept");
        return;
      }
      const call = await findCallHistoryById(callId, {
        _id: 1,
        callerId: 1,
        receiverId: 1,
        startedAt: 1,
      });
      const endTime = new Date();
      const duration = call.startedAt ? (endTime - call.startedAt) / 1000 : 0;

      // update call history
      await updateCallHistory(
        { _id: callId },
        {
          status: CALL_STATUS.ENDED,
          endedAt: endTime,
          duration,
        },
      );

      io.to(roomId).emit("callEnded", {
        callId,
        callerId: call.callerId,
        receiverId: call.receiverId,
      });
    });
    // video calling webRTC
    socket.on("offer", (data) => {
      const { roomId, offer } = data;
      if (!roomId || !offer) {
        return;
      }
      socket.to(roomId).emit("offer", { userId, offer });
    });
    socket.on("answer", (data) => {
      const { roomId, answer } = data;
      if (!roomId || !answer) {
        return;
      }
      socket.to(roomId).emit("answer", { userId, answer });
    });
    socket.on("ice-candidate", (data) => {
      const { roomId, candidate } = data;
      if (!roomId || !candidate) {
        return;
      }
      socket.to(roomId).emit("ice-candidate", { userId, candidate });
    });
    socket.on("screen-share-stopped", ({ roomId }) => {
      socket.to(roomId).emit("screen-share-stopped");
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

//error emit function
function errorEmit(socket, event, message) {
  socket.emit(event, { success: false, message });
  console.log(`${event} Error:`, message);
}
