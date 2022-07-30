const socket = io();

const form = document.getElementById("form");
const input = document.getElementById("input");
const displayUsers = document.getElementById("users");
const messages = document.getElementById("Group_messages");
const videosMain = document.getElementById("video_main");
const videosGroup = document.getElementById("videos_group");
const video_call = document.getElementById("video_call");
const endCallBtn = document.getElementById("endCallBtn");
const expandViewBtn = document.getElementById("expandViewBtn")

var messageView = document.getElementById("Group_messages").id;
var userName;

////////////////////////////////
// Get the EJS Passed User ID //
////////////////////////////////

const jsonElement = document.getElementById("userId");
var username = JSON.parse(jsonElement.innerText);
jsonElement.remove();

/////////////////
// Setup Peers //
/////////////////

var peerCon;
var peerId = "";
var call;

var peer = new Peer(username, {
  path: "/peerjs",
  host: "/",
  secure: true,
  port: 3000,
});

peer.on("connection", (conn) => {
  peerCon = conn
  console.log("peer connected " + peerCon)
  conn.on("close", () => {
    console.log("conn close event");
    //handlePeerDisconnect();
  });
});

peer.on("open", (id) => {
  peerId = id;
  console.log("peer_on_open: " + peerId);
  newUserConnected(username);
});


/////////////////////
// Event Listeners //
/////////////////////

form.addEventListener("submit", function (e) {
  e.preventDefault();
  if (input.value) {
    if (messageView == "Group_messages") {
      socket.emit("message", {
        message: input.value,
        user: userName,
      });
    } else {
      let sendTo = messageView.split("_")[0];
      console.log("sendTo: " + sendTo);
      socket.emit("private message", {
        message: input.value,
        to: sendTo,
        from: username,
      });
    }
    input.value = "";
  }
});

video_call.addEventListener("click", function (e) {
  e.preventDefault();
  const sendStreamTo = messageView.split("_")[0];
  console.log("sendStreamTo: " + sendStreamTo + " from: " + username);
  startVideoCall(sendStreamTo);
});

endCallBtn.addEventListener("click", function (e) {
  e.preventDefault();
  console.log("closing video call");
  peerCon.close();
  endCall(myStream);
});

expandViewBtn.addEventListener("click", function (e) {
  e.preventDefault();
  console.log("switching view");
  switchVideoView();
});

///////////////////////////////////
// Manage Client Side Socket Con //
///////////////////////////////////

socket.on("message", function (data) {
  addMessage(data, "group");
});

socket.on("new user", function (data) {
  console.log("new user: " + data);
  data.map((user) => addUser(user));
});

socket.on("messages", function (data) {
  console.log("socket on messages");
  addMessages(data);
});

socket.on("private message", function (data) {
  console.log("private message: " + data);
  addMessage(data, "private");
});

socket.on("user disconnected", function (userName) {
  document.querySelector(`.${userName}-userlist`).remove();
});

////////////////////////
// New User Connected //
////////////////////////

const newUserConnected = function (user) {
  userName = user || `User${Math.floor(Math.random() * 1000000)}`;
  console.log("New User Peer Id: " + peerId);
  socket.emit("new user", {
    userId: userName,
    peerId: peerId,
  });
  addUser(userName);
};

////////////////////////////
// Dsiplay Connected User //
////////////////////////////

function addUser(userName) {
  if (!!document.querySelector(`.${userName}-userlist`)) {
    return;
  }
  const userBox = `<div class="chat_user ${userName}-userlist" id="${userName}" onclick="selectUser(this.id)">
                      <div class="msg_status"></div>
                      <h5>${userName}</h5>
                   </div>`;
  displayUsers.innerHTML += userBox;
  attachPrivateMessageView(userName);
}

///////////////////
// Add a Message //
///////////////////

function addMessage(data, msgType) {
  const time = new Date();
  const formattedTime = time.toLocaleString("en-US", {
    hour: "numeric",
    minute: "numeric",
  });
  console.log("username: " + userName);
  var msg = "";
  if (data.user === userName || data.from == userName) {
    console.log("match: " + userName);
    console.log("from: " + data.from);
    msg = `<div class="message_row">
            <div class="outgoing_message">
              <div class="sent_message">
                <p>${data.message}</p>
                <div class="message_info">
                  <span class="time_date">${formattedTime}</span>
                </div>
              </div>
            </div>
          </div>`;
  } else {
    console.log("no match: " + userName);
    msg = `<div class="message_row">
              <div class="incoming_message">
                <div class="received_message">
                  <p>${data.message}</p>
                  <div class="message_info">
                    <span class="message_author">${msgType == "group" ? data.user : data.from
      }</span>
                    <span class="time_date">${formattedTime}</span>
                  </div>
                </div>
              </div>
            </div>`;
  }
  console.log("msg: " + msg);
  if (msgType == "group") {
    messages.innerHTML += msg;
    addMessageNotification("Group");
  } else {
    console.log("add private message: to: " + data.to + " from: " + data.from);
    if (username == data.from) {
      const senderView = document.getElementById(data.to + "_messages");
      senderView.innerHTML += msg;
    } else {
      const recieverView = document.getElementById(data.from + "_messages");
      console.log("attach to: " + recieverView);
      recieverView.innerHTML += msg;
      // add notifcation
      addMessageNotification(data.from);
    }
  }
  window.scrollTo(0, document.body.scrollHeight);
}

function addMessageNotification(from) {
  const userView = from + "_messages";
  if (userView != messageView) {
    const sfx = new Audio("/public/Notification.mp3");
    sfx.play();
    const target = document
      .getElementById(from)
      .getElementsByClassName("msg_status")[0];
    console.log("target notification: " + target);
    target.style.display = "grid";
    if (!target.innerText) {
      target.innerText = 1;
    } else {
      let notificationNum = parseInt(target.innerText);
      notificationNum++;
      target.innerText = notificationNum;
    }
  }
}

//////////////////////
// Add All Messages //
//////////////////////

function addMessages(data) {
  console.log("addMessages: " + JSON.stringify(data));
  data.forEach((element) => {
    addMessage(element, "group");
  });
}

/////////////////////////////
// Select a Connected User //
/////////////////////////////

function selectUser(id) {
  console.log("selectUser: " + id);
  const elements = document.getElementsByClassName("selected");
  for (const element of elements) {
    element.classList.remove("selected");
  }
  const user = document.getElementById(id);
  user.classList.add("selected");
  const target = document
    .getElementById(id)
    .getElementsByClassName("msg_status")[0];
  target.innerText = null;
  target.style.display = "none";
  displayUserMessages(id);
}

////////////////////////////////////
// Display Users Private Messages //
////////////////////////////////////

function displayUserMessages(id, messages) {
  msg_heading.innerHTML = id;
  const currentView = document.getElementById(messageView);
  console.log("xxxxxxxxx: " + currentView);
  console.log("x display: " + currentView.style.display);
  currentView.style.display = "none";
  console.log("xxxxxxxx: " + currentView);
  messageView = id + "_messages";
  console.log("current View: " + messageView);
  let checkElementExists = document.getElementById(messageView);
  console.log("checkViewExists: " + checkElementExists);
  if (checkElementExists) {
    console.log("View Exists ");
    document.getElementById(messageView).style.display = "block";
  } else {
    console.log("View Doesn't Exists ");
    const attachTo = document.getElementById("message_display");
    const insertElement = `<div id="${id}_messages" class="messages"></div>`;
    attachTo.insertAdjacentHTML("beforeend", insertElement);
  }
  console.log("currentView: " + messageView);
}

///////////////////////////////////
// Show/Hide Group Messaqge View //
///////////////////////////////////

function groupChat() {
  var x = document.getElementById("Group_messages");
  if (x.style.display === "none") {
    x.style.display = "block";
  } else {
    x.style.display = "none";
  }
}

/////////////////////////////////////
// Attach the Private Message View //
/////////////////////////////////////

function attachPrivateMessageView(user) {
  if (user != username) {
    let view = user + "_messages";
    console.log("current View: " + view);
    let checkViewExists = document.getElementById(view);
    console.log("checkViewExists: " + checkViewExists);
    if (!checkViewExists) {
      console.log("View Doesn't Exists ");
      const attachTo = document.getElementById("message_display");
      const insertElement = `<div id="${user}_messages" class="messages"></div>`;
      attachTo.insertAdjacentHTML("beforeend", insertElement);
      document.getElementById(view).style.display = "none";
    }
  }
}

///////////////////////////
// Video Stream Handling //
///////////////////////////
var myStream;
var myVideo;
var peerVideo;

function startVideoCall(sendTo) {

  console.log("videosGroup: " + videosGroup);

  videosMain.style.display = "block";

  myVideo = document.createElement("video");
  peerVideo = document.createElement("video");

  myVideo.muted = false;

  peerCon = peer.connect(sendTo);

  const getUserMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia;
  getUserMedia(
    { video: true, audio: true },
    function (stream) {
      myStream = stream;
      addVideoStream(myVideo, stream);
      call = peer.call(sendTo, stream);

      call.on("stream", function (remoteStream) {
        console.log("DISPLAY MY STREAM");
        addVideoStream(peerVideo, remoteStream);
      });

      peerCon.on("close", function () {
        endCall(stream);
      });
    },
    function (err) {
      console.log("Failed to get local stream", err);
    }
  );
}

function addVideoStream(video, stream, user) {
  video.srcObject = stream;
  const videoGrid = document.getElementById("video_grid");
  video.addEventListener("loadedmetadata", function () {
    video.play();
    videoGrid.appendChild(video);
    if (user == username) {
      var content = document.createTextNode(username);
      videoGrid.appendChild(content);
    }
  });
}

peer.on("call", function (call) {
  videosMain.style.display = "block";
  myVideo = document.createElement("video");
  peerVideo = document.createElement("video");

  console.log("CALL STREAM");
  const getUserMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia;
  getUserMedia(
    { video: true, audio: false },
    function (stream) {
      call.answer(stream); // Answer the call with an A/V stream.

      call.on("stream", function (remoteStream) {
        console.log("ADD REMOTE STREAM");

        addVideoStream(myVideo, stream);
        addVideoStream(peerVideo, remoteStream);
      });

      peerCon.on("close", function () {
        console.log("End stream for remote");
        endCall(stream);
      });
    },
    function (err) {
      console.log("Failed to get local stream", err);
    }
  );
});

// End Call
function endCall(stream) {
  videosMain.style.display = "none";
  const videoGrid = document.getElementById("video_grid");
  while (videoGrid.hasChildNodes()) {
    videoGrid.removeChild(videoGrid.firstChild);
  }
  stream.getTracks().forEach(function (track) {
    if (track.readyState == "live") {
      track.stop();
    }
  });
}

// stop only camera
function stopVideo(stream) {
  stream.getTracks().forEach(function (track) {
    if (track.readyState == "live" && track.kind === "video") {
      track.stop();
    }
  });
}

// stop only mic
function stopAudio(stream) {
  stream.getTracks().forEach(function (track) {
    if (track.readyState == "live" && track.kind === "audio") {
      track.stop();
    }
  });
}

// switch stream view
function switchVideoView() {
  //first check current view
  const videoSmall = document.getElementsByClassName('video_small');
  if (videoSmall.length > 0) {
    myVideo.classList.remove("video_small");
    peerVideo.classList.remove("video_large")
  } else {
    
    myVideo.classList.add("video_small");
    peerVideo.classList.add("video_large")
  }
}
