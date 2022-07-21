var express = require('express');
var router = express.Router();
const sessions = require("express-session");


router.get("/", function (req, res) {
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
  
  router.post("/user/login", function (req, res) {
    if (req.body.username) {
      console.log("username: " + req.body.username);
      session = req.session;
      session.userid = req.body.username;
      console.log(req.session);
      console.log(session.userid + ` session started`);
  
      res.redirect("/chat");
    }
  });
  
  router.get("/chat", (req, res) => {
    session = req.session;
    if (session.userid) {
      res.render("chat", { data: { userId: session.userid } });
    } else {
      res.send("Error not logged in. <a href='/logout'> Click to login</a>");
    }
  });
  
  // router.get("/chat/:room", (req, res) => {
  //   res.render("chat", { data: { userId: session.userid, roomId: req.params.room }});
  // });
  
  /*router.post("/upload", upload.single("image"), function (req, res, next) {
    console.log("file upload: " + JSON.stringify(req.file));
    console.log("file upload: " + req.file.filename);
    res.sendStatus(200);
  });*/
  
  router.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/");
  });

module.exports = router;