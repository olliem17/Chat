const socket = io();
                      const form = document.getElementById("form");
                      const input = document.getElementById("input");
                      const displayUsers = document.getElementById("users");
                      const messages = document.getElementById("group_messages");
                      //const attach_btn = document.getElementById("attach_btn");
                      const attach = document.getElementById("attach");
                      attach.style.display = "none";

                     
                      
                      const newUserConnected = function (user) {
                        userName = user || `User${Math.floor(Math.random() * 1000000)}`;
                        socket.emit("new user", userName);
                        addUser(userName);
                      };

                      form.addEventListener("submit", function (e) {
                        e.preventDefault();
                        if (input.value) {
                          socket.emit("message", {
                            message: input.value,
                            user: userName,
                          });
                          //socket.emit("message", input.value);
                          input.value = "";
                        }
                      });

                      // attach_btn.addEventListener("click", function (e) {
                      //   console.log("style: "+attach.style.display)
                      //   if (attach.style.display == "none") {
                      //       attach.style.display = "block";
                      //   } else {
                      //       attach.style.display = "none";
                      //   }

                      // });


                      socket.on("message", function (data) {
                        // window.scrollTo(0, document.body.scrollHeight);
                        addNewMessage({ user: data.user, message: data.message });
                      });

                      socket.on("new user", function (data) {
                        console.log("new user: "+data)
                        data.map((user) => addUser(user));
                      });

                      socket.on("messages", function (data) {
                          console.log("socket on messages");
                        addMessages(data)
                      });

                      socket.on("user disconnected", function (userName) {
                        document.querySelector(`.${userName}-userlist`).remove();
                      });

                      function addUser(userName) {
                        if (!!document.querySelector(`.${userName}-userlist`)) {
                          return;
                        }
                        const userBox = `
                                            <div class="chat_user ${userName}-userlist" id="${userName}" onclick="selectUser(this.id)">
                                              <div class="msg_status"></div>
                                              <h5>${userName}</h5>
                                            </div>
                                          `;
                        displayUsers.innerHTML += userBox;
                      }

                      function addNewMessage({ user, message }) {
                        const time = new Date();
                        const formattedTime = time.toLocaleString("en-US", {
                          hour: "numeric",
                          minute: "numeric",
                        });
                        console.log("username: "+userName);
                        var msg = '';
                        if (user === userName) {
                          console.log("match: "+userName);
                          msg = `
                          <div class="message_row">
                        <div class="outgoing_message">
                          <div class="sent_message">
                            <p>${message}</p>
                            <div class="message_info">
                              <span class="time_date">${formattedTime}</span>
                            </div>
                          </div>
                        </div>
                        </div>`;


                        } else {
                          console.log("no match: "+userName);
                              msg = `
                              <div class="message_row">
                                  <div class="incoming_message">
                                    <div class="received_message">
                                      <p>${message}</p>
                                      <div class="message_info">
                                        <span class="message_author">${user}</span>
                                        <span class="time_date">${formattedTime}</span>
                                      </div>
                                    </div>
                                  </div>
                                  </div>`;
                      }

                          console.log("msg: "+msg);
                        messages.innerHTML += msg;
                        window.scrollTo(0, document.body.scrollHeight);
                      }

                      function addMessages(data) {
                          console.log("addMessages: "+JSON.stringify(data));
                          data.forEach((element) => {
                              addNewMessage({ user: element.user, message: element.message });
                          });
                      }

                     
                      function selectUser(id) {
                        console.log("selectUser: "+id)
                      }

                      function displayUserMsg(id) {

                      }
                      var username = <%- JSON.stringify(userId) %> 
                      newUserConnected(username);