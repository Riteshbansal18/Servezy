const io = require("socket.io")(8900, {
  cors: {
    origin: "http://localhost:3000",
  },
});

let users = [];

const addUser = (userId, socketId) => {
  !users.some((user) => user.userId === userId) &&
    users.push({ userId, socketId });
};

const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  return users.find((user) => user.userId === userId);
};

io.on("connection", (socket) => {
  // Connected
  console.log("A user connected");

  // Get user id and add it to the users array
  socket.on("addUser", (userId) => {
    addUser(userId, socket.id);
    io.emit("getUsers", users);
  });

  // Get/Send message
  socket.on("sendMessage", ({ senderId, receiverId, text, chatId }) => {
    const receiver = getUser(receiverId);
    if (receiver) {
      io.to(receiver.socketId).emit("getMessage", {
        senderId,
        text,
        chatId,
      });
    }
  });

  // Real-time order notification
  // Client emits this after placing an order; server forwards to the freelancer
  socket.on("sendOrderNotification", ({ freelancerId, clientName, serviceTitle }) => {
    const freelancer = getUser(freelancerId);
    if (freelancer) {
      io.to(freelancer.socketId).emit("getOrderNotification", {
        clientName,
        serviceTitle,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Disconnected
  socket.on("disconnect", () => {
    console.log("A user disconnected");
    removeUser(socket.id);
  });
});
