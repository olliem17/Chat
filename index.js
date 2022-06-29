const express = require("express");
const cookieParser = require("cookie-parser");
const sessions = require("express-session");
const multer  = require('multer')
const upload = multer({ dest: 'public/' })
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const PORT = 3000;
const sessionAge = 1000 * 60 * 60;

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/public", express.static("public"));
app.use(cookieParser());
app.use(
  sessions({
    secret: "zw34xy246fhrgfgrfrty84fwir767",
    saveUninitialized: true,
    cookie: { maxAge: sessionAge },
    resave: false,
  })
);

var session;
var user;
var activeUsers = new Set();
var messages = [];

app.get("/", function (req, res) {
  session = req.session;

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

    //res.render("chat", { userId: session.userid });
    res.redirect("/chat");
  }
});

app.get("/chat", (req, res) => {
  session = req.session;
  if (session.userid) {
    res.render("chat", { userId: session.userid });
  }
    else
  {
    res.send("Error not logged in. <a href='/logout'> Click to login</a>"
    );
  }
});

app.post('/upload', upload.single('image'), function (req, res, next) {
  // req.file is the `avatar` file
  // req.body will hold the text fields, if there were any
  console.log("file upload: "+JSON.stringify(req.file));
  console.log("file upload: "+req.file.filename);
  res.sendStatus(200);
})

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

// Socket Handling
io.on("connection", function (socket) {
  console.log("Socket Connection Established");

  socket.on("new user", function (data) {
    socket.userId = data;
    console.log("socket id: "+socket.id);
    const sockets = Array.from(io.sockets.sockets).map(socket => socket[0]);
    console.log("sockets: "+sockets);
    activeUsers.add(data);
    console.log("user connected: " + socket.userId);
    io.emit("new user", [...activeUsers]);
    io.to(socket.id).emit('messages', [...messages]);
  });

  socket.on("disconnect", function () {
    activeUsers.delete(socket.userId);
    io.emit("user disconnected", socket.userId);
    console.log("user disconnected: " + socket.userId);
  });

  socket.on("message", function (data) {
    console.log("message: " + data.message);
    messages.push(data);
    console.log("messages: "+JSON.stringify(messages))
    io.emit("message", data);
  });
});

server.listen(PORT, function () {
  console.log(`listening on http://localhost:${PORT}`);
});
