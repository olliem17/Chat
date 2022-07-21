///////////////////////////////////
// Exoress & Socket Server Setup //
///////////////////////////////////

const express = require("express");
const cookieParser = require("cookie-parser");
const sessions = require("express-session");
const favicon = require("serve-favicon");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const multer = require("multer");
const upload = multer({ dest: "public/" });
const app = express();
const http = require("http");
const https = require("https");
const key = fs.readFileSync("key.pem");
const cert = fs.readFileSync("cert.pem");
const credentials = {
  key: key,
  cert: cert
};
const server = https.createServer(credentials, app);
const io = require("socket.io")(server, {
    cors: {
      origin: "*",
    },
  });
const PORT = 3000;
const sessionAge = 1000 * 60 * 60;

////////////////////////
// Peer Server Config //
////////////////////////

const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});

app.use("/peerjs", peerServer);
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/public", express.static("public"));
app.use(favicon(path.join(__dirname, "public", "favicon.ico")));
app.use(cookieParser());
app.use(
  sessions({
    secret: "zw34xy246fhrgfgrfrty84fwir767",
    secure: true,
    saveUninitialized: true,
    cookie: { maxAge: sessionAge, httpOnly: true},
    resave: false,
  })
);

/////////////////////
//     Globals     //
/////////////////////

var session;
var activeUsers = new Set();
var messages = [];
var privateMessages = [];

//////////////////////
//      Routes      //
//////////////////////

app.get("/", function (req, res) {
  session = req.session;
  //session.roomid = uuidv4();

  if (session.userid) {
    res.send(
      "Welcome " + session.userid + "<a href='/logout'> click to logout</a>"
    );
  } else {
    res.render("login");
  }
});

app.post("/user/login", function (req, res) {
  if (req.body.username) {
    console.log("username: " + req.body.username);
    session = req.session;
    session.userid = req.body.username;
    console.log(req.session);
    console.log(session.userid + ` session started`);

    res.redirect("/chat");
  }
});

app.get("/chat", (req, res) => {
  session = req.session;
  if (session.userid) {
    res.render("chat", { data: { userId: session.userid } });
  } else {
    res.send("Error not logged in. <a href='/logout'> Click to login</a>");
  }
});

// app.get("/chat/:room", (req, res) => {
//   res.render("chat", { data: { userId: session.userid, roomId: req.params.room }});
// });

app.post("/upload", upload.single("image"), function (req, res, next) {
  console.log("file upload: " + JSON.stringify(req.file));
  console.log("file upload: " + req.file.filename);
  res.sendStatus(200);
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

/////////////////////
// Socket Handling //
/////////////////////

io.on("connection", function (socket) {

  const version = socket.conn.protocol;

  console.log("Socket Connection Established - Version: "+version);
  

  socket.on("new user", function (data) {
    console.log("new user\n ------------------------------------");
    socket.userId = data.userId;
    socket.peerId = data.peerId;
    console.log("socket id: " + socket.id);
    console.log("socket peerId: " + socket.peerId);
    const sockets = io.sockets.sockets;
    console.log("number of sockets: " + sockets.size);
    console.log("getSocketId: " + getSocketId(sockets, data.userId));
    activeUsers.add(data.userId);
    console.log("user connected: " + socket.userId);
    io.emit("new user", [...activeUsers]);
    io.to(socket.id).emit("messages", [...messages]);
  });

  socket.on("disconnect", function () {
    activeUsers.delete(socket.userId);
    io.emit("user disconnected", socket.userId);
    console.log("user disconnected: " + socket.userId);
  });

  socket.on("message", function (data) {
    console.log("message: " + data.message);
    messages.push(data);
    console.log("messages: " + JSON.stringify(messages));
    io.emit("message", data);
  });

  socket.on("private message", function (data) {
    console.log("private message: " + data.message);
    privateMessages.push(data);
    console.log("messages: " + JSON.stringify(privateMessages));
    const sockets = io.sockets.sockets;
    const to = getSocketId(sockets, data.to);
    const from = getSocketId(sockets, data.from);
    io.to(to).emit("private message", data);
    io.to(from).emit("private message", data);
  });

  socket.on("video call", function (data) {
    const sockets = io.sockets.sockets;
    const to = getSocketId(sockets, data.to);
    const peerId = getPeerId(sockets, data.to);
    console.log("video call - peer: " + data.to);
    io.to(to).emit("video call", peerId);
  });

   socket.on("connect_error", (err) => {
     console.log(`connect_error due to ${err.message}`);
   });

});

server.listen(PORT, function () {
  console.log(`listening on https://localhost:${PORT}`);
});

// Return socket id
function getSocketId(sockets, username) {
  for (const [socketid, object] of sockets) {
    console.log("key: " + socketid);
    console.log("userId: " + object.userId);
    console.log("Id: " + object.id);
    if (object.userId === username) {
      return socketid;
    }
  }
}

function getPeerId(sockets, username) {
  for (const [socketid, object] of sockets) {
    console.log("key: " + socketid);
    console.log("userId: " + object.userId);
    console.log("peerId: " + object.peerId);
    if (object.userId === username) {
      return object.peerId;
    }
  }
}
