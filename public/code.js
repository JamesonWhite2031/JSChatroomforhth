(function() {

    const app = document.querySelector(".app");
    const socket = io();

    let uname;
    let currentChannel = "general";

    // Join user
    app.querySelector(".join-screen #join-user").addEventListener("click", function() {
        let username = app.querySelector(".join-screen #username").value;
        if(username.length == 0) {
            return;
        }
        socket.emit("newuser", username);
        uname = username;
        app.querySelector(".join-screen").classList.remove("active");
        app.querySelector(".chat-screen").classList.add("active");
    });

    // Send message (button)
    app.querySelector(".chat-screen #send-message").addEventListener("click", sendMessage);

    // Send message (Enter key)
    app.querySelector(".chat-screen #message-input").addEventListener("keydown", function(e){
        if(e.key === "Enter"){
            e.preventDefault();
            sendMessage();
        }
    });

    // Channel switching
    document.querySelectorAll('.channel-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            currentChannel = btn.getAttribute('data-channel');
            app.querySelector(".chat-screen .messages").innerHTML = "";
            socket.emit("switchChannel", currentChannel);
            renderMessage("update", `Switched to ${btn.textContent}`);
        });
    });

    // Send file
    app.querySelector(".chat-screen #file-input").addEventListener("change", function(e) {
        let file = e.target.files[0];
        if(file){
            let reader = new FileReader();
            reader.onload = function(evt){
                socket.emit("file", {
                    username: uname,
                    channel: currentChannel,
                    filename: file.name,
                    filedata: evt.target.result
                });
                renderMessage("file", {
                    username: uname,
                    filename: file.name,
                    filedata: evt.target.result,
                    myfile: true
                });
            };
            reader.readAsDataURL(file);
        }
    });

    // Exit chat
    app.querySelector(".chat-screen #exit-chat").addEventListener("click", function() {
        socket.emit("exituser", uname);
        window.location.href = window.location.href;
    });

    // Socket listeners
    socket.on("update", function(update) {
        renderMessage("update", update);
    });

    socket.on("chat", function(message) {
        if(message.channel === currentChannel){
            renderMessage("other", message);
        }
    });

    socket.on("file", function(fileMsg) {
        if(fileMsg.channel === currentChannel){
            renderMessage("file", {
                username: fileMsg.username,
                filename: fileMsg.filename,
                filedata: fileMsg.filedata,
                myfile: false
            });
        }
    });

    // Helper: send message
    function sendMessage() {
        let message = app.querySelector(".chat-screen #message-input").value;
        if(message.length == 0) {
            return;
        }
        renderMessage("my",{
            username:uname,
            text:message
        });
        socket.emit("chat",{
            username:uname,
            text:message,
            channel: currentChannel
        });
        app.querySelector(".chat-screen #message-input").value = "";
    }

    // Helper: render message
    function renderMessage(type, message) {
        let messageContainer = app.querySelector(".chat-screen .messages");
        if(type == "my") {
            let el = document.createElement("div");
            el.setAttribute("class", "message my-message");
            el.innerHTML = `
            <div>
                <div class="name">You</div>
                <div class="text">${message.text}</div>
            </div>
            `;
            messageContainer.appendChild(el);
        } else if(type == "other") {
            let el = document.createElement("div");
            el.setAttribute("class", "message other-message");
            el.innerHTML = `
            <div>
                <div class="name">${message.username}</div>
                <div class="text">${message.text}</div>
            </div>
            `;
            messageContainer.appendChild(el);
        } else if(type == "update") {
            let el = document.createElement("div");
            el.setAttribute("class", "update");
            el.innerText = message;
            messageContainer.appendChild(el);
        } else if(type == "file") {
            let el = document.createElement("div");
            el.setAttribute("class", "message file-message");
            let userLabel = message.myfile ? "You" : message.username;
            el.innerHTML = `
            <div>
                <div class="name">${userLabel}</div>
                <div class="text">Sent a file: <a href="${message.filedata}" download="${message.filename}">${message.filename}</a></div>
            </div>
            `;
            messageContainer.appendChild(el);
        }
        // scroll chat to end
        messageContainer.scrollTop = messageContainer.scrollHeight - messageContainer.clientHeight;
    }

})();
