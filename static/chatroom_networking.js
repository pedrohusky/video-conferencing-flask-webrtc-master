var myID;
var myHand = false;
var myData = null;
var _peer_list = {};
var userList = {};
var originalWebcamStream;
// socketio 
var protocol = window.location.protocol;
var socket = io(protocol + '//' + document.domain + ':' + location.port, {autoConnect: true});

document.addEventListener("DOMContentLoaded", (event)=>{
    startCamera();
});

var camera_allowed=false; 
var mediaConstraints = {
  audio: true,
  video: {
    cursor: "always", // Include cursor when sharing screen
    height: 360,
  },
};

function startCamera()
{
    navigator.mediaDevices.getUserMedia(mediaConstraints)
    .then((stream)=>{
        myVideo.srcObject = stream;
        originalWebcamStream = stream;
        camera_allowed = true;
        setAudioMuteState(audioIsMuted);                
        setVideoMuteState(videoIsMuted);
        //start the socketio connection
        socket.connect();
    })
    .catch((e)=>{
        console.log("getUserMedia Error! ", e);
    });
}

// Step 1: Detect Connection Problems with the Server
var serverConnectionStatus = true; // Initially assume server connection is established

// Event listener for socket connection error
socket.on("connect_error", (error) => {
    console.log("Connection error:", error);
    serverConnectionStatus = false; // Update server connection status
    //show a toaster
    toastr.error("Conexão perdida com o servidor. Tentando conectar de outras formas.\nERRO: " + error.message, "", {
      closeButton: true,
      progressBar: true,
      positionClass: "toast-top-center",
      timeOut: 5000, // Duration of the notification in milliseconds
      extendedTimeOut: 1000, // Additional duration for the notification if hovered
      preventDuplicates: true, // Prevent duplicate notifications
      showDuration: 300, // Animation duration to show the notification
      hideDuration: 1000, // Animation duration to hide the notification
    });
});

socket.on("connect", ()=>{
    console.log("socket connected....");
    socket.emit("join-room", {"room_id": myRoomID});
    toastr.success(
      "Entrou na sala com sucesso.",
      {
        closeButton: true,
        progressBar: true,
        positionClass: "toast-top-center",
        timeOut: 5000, // Duration of the notification in milliseconds
        extendedTimeOut: 1000, // Additional duration for the notification if hovered
        preventDuplicates: true, // Prevent duplicate notifications
        showDuration: 300, // Animation duration to show the notification
        hideDuration: 1000, // Animation duration to hide the notification
      }
    );
});

socket.on("user-connect", (data)=>{
  console.log("user-connect ", data);
  let peer_id = data["sid"];
  let display_name = data["nome"];
  let audioIsMuted = data["audio_muted"];
  let videoIsMuted = data["video_muted"];
  let admin = data["admin"];
  _peer_list[peer_id] = undefined; // add new user to user list
  userList[peer_id] = {
    sid: peer_id,
    nome: display_name,
    audioIsMuted: audioIsMuted,
    videoIsMuted: videoIsMuted,
    admin: admin,
    ip: data["ip"],
  };

  createPersonCard(peer_id, display_name);

  addVideoElement(
    peer_id,
    display_name,
    audioIsMuted,
    videoIsMuted,
    admin,
    adminClick,
    adminButtonsClick
  );

  toastr.info("Participante: " + display_name + " entrou na sala.", {
    closeButton: true,
    timeOut: 5000, // Duration of the notification in milliseconds
    extendedTimeOut: 1000, // Additional duration for the notification if hovered
    preventDuplicates: true, // Prevent duplicate notifications
    showDuration: 300, // Animation duration to show the notification
    hideDuration: 1000, // Animation duration to hide the notification
  });
});

socket.on("change", (data) => {
  let sender_id = data["sender_id"];
  let type = data["type"]; // Changed from data["actionType"] to data["type"]
  let enabled = data["enabled"];
  updateIndicatorStatus(type, sender_id, enabled);
  
});


socket.on("user-disconnect", (data)=>{
    console.log("user-disconnect ", data);
    let peer_id = data["sid"];
    let display_name = userList[peer_id]["nome"];
    closeConnection(peer_id);
    removeVideoElement(peer_id);
    checkVideoLayout();
    toastr.warning("Participante: " + display_name + " saiu na sala.", {
      closeButton: true,
      timeOut: 5000, // Duration of the notification in milliseconds
      extendedTimeOut: 1000, // Additional duration for the notification if hovered
      preventDuplicates: true, // Prevent duplicate notifications
      showDuration: 300, // Animation duration to show the notification
      hideDuration: 1000, // Animation duration to hide the notification
    });
});

socket.on("user-list", (data)=>{
    myID = data["my_data"]['sid'];
    isAdmin = data["my_data"]['admin'];
    myData = data["my_data"];
    console.log("User List received. MyID: ", myID, "isAdmin: ", isAdmin, "Data: ", data);

    if( "list" in data) // not the first to connect to room, existing user list recieved
    {
        let recvd_list = data["list"];  
        userList = recvd_list;
        console.log("Recvd list: ", recvd_list);
        // add existing users to user list
        for(peer_id in recvd_list)
        {
          let display_name = recvd_list[peer_id]["nome"];
          let audioIsMuted = recvd_list[peer_id]["audio_muted"];
          let videoIsMuted = recvd_list[peer_id]["video_muted"];
          let admin = recvd_list[peer_id]["admin"];
          _peer_list[peer_id] = undefined;

          createPersonCard(peer_id, display_name);

          addVideoElement(
            peer_id,
            display_name,
            audioIsMuted,
            videoIsMuted,
            admin,
            adminClick,
            adminButtonsClick
          );
        }
        start_webrtc();
    }    
});

function adminClick(
  buttonsContainer,
  kickButton,
  banButton,
  muteVideoButton,
  muteAudioButton,
  element_id
) {
  var iAmAdmin = myData["admin"];
  var isAdmin = userList[element_id]["admin"];
  console.log("adminClick: ", "I am ? ", iAmAdmin, "clickedUser is Admin? ",isAdmin, "clickedUser ID: ", element_id);
  if (iAmAdmin === "1") {
    
       buttonsContainer.style.display =
         buttonsContainer.style.display === "none" ? "grid" : "none";
    kickButton.style.display = "block";
    banButton.style.display = "block";
    muteVideoButton.style.display = "block";
    muteAudioButton.style.display = "block";
  } else {
    if (isAdmin !== "1") {
       buttonsContainer.style.display =
      buttonsContainer.style.display === "none" ? "grid" : "none";
      muteVideoButton.style.display = "block";
      muteAudioButton.style.display = "block";
    kickButton.style.display = "none";
    banButton.style.display = "none";
    }
  }
}

socket.on("update-admin", (data) => {
  console.log("update-admin ", data);
  let admin_id = data["sid"];
  if (myID === admin_id) {
    myData["admin"] = "1";
    console.log("I am admin. MyData: ", myData);
  }

  updateIndicatorStatus("admin", admin_id, true);

  
  
});

socket.on("kick-user", (data) => {
  console.log("kick-user ", data);
  let element_id = data["sid"];
  let sender_id = data["sender_id"];
  let type = data["type"];
  //var iAmAdmin = myData["admin"];
  //var isAdmin = userList[sender_id]["admin"];
  if (myID === element_id) {
    switch (type) {
        case "KICK":
            alert("Você foi expulso da sala.");
            window.location.href = "/?errorMessage=Você foi expulso da sala.";
            break;
        case "BAN":
            alert("Você foi banido da sala.");
            window.location.href = "/?errorMessage=Você foi banido da sala.";
            break;
    }
    return;
  }
});

function adminButtonsClick(
  element_id,
  action
) {
  var iAmAdmin = myData["admin"];
  var isAdmin = userList[element_id]["admin"];
  console.log(
    "adminButtonsClick: ",
    "I am ? ",
    iAmAdmin,
    "clickedUser is Admin? ",
    isAdmin,
    "clickedUser ID: ",
    element_id
  );

  switch (action) {
    case "KICK":
      
      if (iAmAdmin === "1") {
        Swal.fire({
          title: "Are you sure you want to KICK this user from the room?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: "Yes, kick it!",
        }).then((result) => {
          if (result.isConfirmed) {
            socket.emit("mute-user", {
              user_id: element_id,
              sender_id: myID,
              room_id: myRoomID,
              type: "KICK",
              muted: true,
            });
            console.log("emitted kicked user: ", element_id);
          }
        });
        
      }
      break;
    case "BAN":
      if (iAmAdmin === "1") {
        Swal.fire({
          title: "Are you sure you want to BAN this user from the room?\n\nThey wouldn't be able to join again until this room is excluded.\n\nThe room is automatically excluded when no user is inside it.",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: "Yes, ban it!",
        }).then((result) => {
          if (result.isConfirmed) {
            socket.emit("mute-user", {
              user_id: element_id,
              sender_id: myID,
              room_id: myRoomID,
              type: "BAN",
              muted: true,
            });
            console.log("emitted ban user: ", element_id);
          }
        });
        
      }
      break;
    case "AUDIO":
      // Toggle the audio mute state
      userList[element_id]["audio_muted"] =
        userList[element_id]["audio_muted"] === "1" ? "0" : "1";

      // Emit a socket event to update the audio mute state if the user is an admin
      if (iAmAdmin === "1") {
        socket.emit("mute-user", {
          user_id: element_id,
          type: "AUDIO",
          muted: userList[element_id]["audio_muted"] === "1",
          sender_id: myID,
          room_id: myRoomID,
        });
        updateIndicatorStatus("mic_off", element_id, userList[element_id]["audio_muted"] === "1");
      } else {
        // Update the user's audio muted state locally if not an admin
        setUserAudioMutedState(
          element_id,
          userList[element_id]["audio_muted"] === "1"
        );
        console.log("tried audio muted: ", userList[element_id]["audio_muted"]);
      }
      break;

    case "VIDEO":
      // Toggle the video mute state
      userList[element_id]["video_muted"] =
        userList[element_id]["video_muted"] === "1" ? "0" : "1";

      // Emit a socket event to update the video mute state if the user is an admin
      if (iAmAdmin === "1") {
        socket.emit("mute-user", {
          user_id: element_id,
          type: "VIDEO",
          muted: userList[element_id]["video_muted"] === "1",
          sender_id: myID,
          room_id: myRoomID,
        });
        updateIndicatorStatus("video_off", element_id, userList[element_id]["video_muted"] === "1");
      } else {
        // Update the user's video muted state locally if not an admin
        setUserVideoMutedState(
          element_id,
          userList[element_id]["video_muted"] === "1"
        );
      }
      break;
  }
}

socket.on("update-admin", (data) => {
  console.log("update-admin ", data);
  let admin_id = data["sid"];
  if (myID === admin_id) {
    myData["admin"] = "1";
    console.log("I am admin. MyData: ", myData);
  }

  updateIndicatorStatus("admin", admin_id, true);
});

socket.on("chat-message", (data) => {
  console.log("chat-message ", data);
  let name = data["name"];
  let message = data["message"];
  var chatBox = document.getElementById("chat_messages");
  // Create a <p> element for the chat message
  let chatMessage = document.createElement("p");
  // Set the text content of the chat message
  chatMessage.innerHTML = `<span class="message-sender">${name}</span>: ${message}`;
  // Add a class to the <p> element for styling
  chatMessage.classList.add("chat-message");
  // Append the chat message to the chat box
  chatBox.appendChild(chatMessage);
});



function updateIndicatorStatus(type, sender_id, enabled) {
  // Get the container element for the user
  let container = document.getElementById("container_" + sender_id);
  if (!container) return; // Exit if the container does not exist

  // Update the corresponding indicator based on the action type
  switch (type) {
    case "mic_off":
      updateIndicator(container, "micIsMuted", enabled);
      break;
    case "video_off":
      updateIndicator(container, "videoIsMuted", enabled);
      break;
    case "hand":
      updateIndicator(container, "hand", enabled);
      break;

    case "admin":
      updateIndicator(container, "isAdmin", enabled);
      break;
    default:
      console.log("Unknown action type:", type);
  }
}

function closeConnection(peer_id)
{
    if(peer_id in _peer_list)
    {
        try {
            _peer_list[peer_id].onicecandidate = null;
        } catch {}

        try {
            _peer_list[peer_id].ontrack = null;
        } catch {}
        
        try {
            _peer_list[peer_id].onnegotiationneeded = null;
        } catch {}

        delete _peer_list[peer_id]; // remove user from user list
    }
}

function log_user_list()
{
    for(let key in _peer_list)
    {
        console.log(`${key}: ${_peer_list[key]}`);
    }
}

//---------------[ webrtc ]--------------------    

var PC_CONFIG = {
    iceServers: [
        {
            urls: ['stun:stun.l.google.com:19302', 
                    'stun:stun1.l.google.com:19302',
                    'stun:stun2.l.google.com:19302',
                    'stun:stun3.l.google.com:19302',
                    'stun:stun4.l.google.com:19302'
                ]
        },
    ]
};

function log_error(e){console.log("[ERROR] ", e);}
function sendViaServer(data){socket.emit("data", data);}

socket.on("data", (msg)=>{
    switch(msg["type"])
    {
        case "offer":
            handleOfferMsg(msg);
            break;
        case "answer":
            handleAnswerMsg(msg);
            break;
        case "new-ice-candidate":
            handleNewICECandidateMsg(msg);
            break;
    }
});

function start_webrtc()
{
    // send offer to all other members
    for(let peer_id in _peer_list)
    {
        invite(peer_id);
    }
}

async function invite(peer_id) {
  if (_peer_list[peer_id]) {
    console.log(
      "[Not supposed to happen!] Attempting to start a connection that already exists!"
    );
  } else if (peer_id === myID) {
    console.log("[Not supposed to happen!] Trying to connect to self!");
  } else {
    console.log(`Creating peer connection for <${peer_id}> ...`);
    createPeerConnection(peer_id);
  }

  // Ensure that the local stream is available before adding tracks
  let local_stream;
  try {
    local_stream = await waitForLocalStream();
    console.log(myVideo.srcObject);
    local_stream.getTracks().forEach((track) => {
      _peer_list[peer_id].addTrack(track, local_stream);
    });
    console.log(myVideo.srcObject);
  } catch (error) {
    console.error("Error accessing local stream:", error);
    // Retry after a delay
    setTimeout(() => {
      invite(peer_id);
    }, 1000); // Adjust the delay as needed
  }
}

async function waitForLocalStream() {
  return new Promise((resolve, reject) => {
    const maxAttempts = 3;
    let attempts = 0;

    function checkStream() {
      const local_stream = myVideo.srcObject;
      if (local_stream) {
        resolve(local_stream);
      } else {
        attempts++;
        if (attempts >= maxAttempts) {
          reject(
            new Error("Unable to access local stream after multiple attempts")
          );
        } else {
          setTimeout(checkStream, 500); // Retry after a short delay
        }
      }
    }

    checkStream();
  });
}


function createPeerConnection(peer_id)
{
    _peer_list[peer_id] = new RTCPeerConnection(PC_CONFIG);

    _peer_list[peer_id].onicecandidate = (event) => {handleICECandidateEvent(event, peer_id)};
    _peer_list[peer_id].ontrack = (event) => {handleTrackEvent(event, peer_id)};
    _peer_list[peer_id].onnegotiationneeded = () => {handleNegotiationNeededEvent(peer_id)};
}


function handleNegotiationNeededEvent(peer_id)
{
    _peer_list[peer_id].createOffer()
    .then((offer)=>{return _peer_list[peer_id].setLocalDescription(offer);})
    .then(()=>{
        console.log(`sending offer to <${peer_id}> ...`);
        sendViaServer({
            "sender_id": myID,
            "target_id": peer_id,
            "type": "offer",
            "sdp": _peer_list[peer_id].localDescription
        });
    })
    .catch(log_error);
} 

function handleOfferMsg(msg)
{   
    peer_id = msg['sender_id'];

    console.log(`offer recieved from <${peer_id}>`);
    
    createPeerConnection(peer_id);
    let desc = new RTCSessionDescription(msg['sdp']);
    _peer_list[peer_id].setRemoteDescription(desc)
    .then(()=>{
        let local_stream = myVideo.srcObject;
        local_stream.getTracks().forEach((track)=>{_peer_list[peer_id].addTrack(track, local_stream);});
    })
    .then(()=>{return _peer_list[peer_id].createAnswer();})
    .then((answer)=>{return _peer_list[peer_id].setLocalDescription(answer);})
    .then(()=>{
        console.log(`sending answer to <${peer_id}> ...`);
        sendViaServer({
            "sender_id": myID,
            "target_id": peer_id,
            "type": "answer",
            "sdp": _peer_list[peer_id].localDescription
        });
    })
    .catch(log_error);
}

function handleAnswerMsg(msg)
{
    peer_id = msg['sender_id'];
    console.log(`answer recieved from <${peer_id}>`);
    let desc = new RTCSessionDescription(msg['sdp']);
    _peer_list[peer_id].setRemoteDescription(desc)
}


function handleICECandidateEvent(event, peer_id)
{
    if(event.candidate){
        sendViaServer({
            "sender_id": myID,
            "target_id": peer_id,
            "type": "new-ice-candidate",
            "candidate": event.candidate
        });
    }
}

function handleNewICECandidateMsg(msg)
{
    console.log(`ICE candidate recieved from <${peer_id}>`);
    var candidate = new RTCIceCandidate(msg.candidate);
    _peer_list[msg["sender_id"]].addIceCandidate(candidate)
    .catch(log_error);
}


function handleTrackEvent(event, peer_id)
{
    console.log(`track event recieved from <${peer_id}>`);
    
    if(event.streams)
    {
      let mainVideo = getVideoObj(peer_id);
      let miniVideo = getMiniVideoObj(peer_id);
      mainVideo.srcObject = event.streams[0];
      miniVideo.srcObject = event.streams[0];
      // Trigger reflow to apply initial styles before animation
      void mainVideo.offsetWidth;
      // Trigger reflow to apply initial styles before animation
      void miniVideo.offsetWidth;
      mainVideo.classList.add("fade-in-zoom-in");
      miniVideo.classList.add("fade-in-zoom-in");
    }
}

// Function to send action data to server
function sendActionToServer(actionType, enabled) {
    socket.emit("change", {
        type: actionType,
        enabled: enabled,
        sender_id: myID, // Include user ID if needed
        room_id: myRoomID
    });
}

socket.on("mute-user", (data) => {
    console.log("mute-user ", data);
    let peer_id = data["sid"];
    let sender_id = data["sender_id"];
    let type = data["type"];
    let muted = data["muted"];
    
    switch (type) {
        case "AUDIO":
            setUserAudioMutedState(peer_id, muted);
            break;
        case "VIDEO":
            setUserVideoMutedState(peer_id, muted);
            break;
        default:
            console.log("Unknown action type:", type);
    }
});

socket.on("change", (data) => {
  console.log("change ", data);
  let sender_id = data["sender_id"];
  let type = data["type"]; // Changed from data["actionType"] to data["type"]
  let enabled = data["enabled"];

  // Get the container element for the user
  let container = document.getElementById("container_" + sender_id);
  if (!container) return; // Exit if the container does not exist

  // Update the corresponding indicator based on the action type
  switch (type) {
    case "mic_off":
      updateIndicator(container, "micIsMuted", enabled);
      break;
    case "video_off":
      updateIndicator(container, "videoMuted", enabled);
      break;
    case "hand":
      updateIndicator(container, "hand", enabled);
      break;
    default:
      console.log("Unknown action type:", type);
  }
});

function updateIndicator(container, id, enabled) {
    console.log("Updating indicator", id, enabled);
  // Find the corresponding icon element
  let icon = container.querySelector(`#${id}`);
  if (!icon) return; // Exit if the icon element does not exist

  // Update the display based on the enabled status
  icon.style.display = enabled ? "block" : "none";
}

function setUserAudioMutedState(element_id, flag) {
  try {
    var v = getVideoObj(element_id).srcObject;
  } catch {
    var v = myVideo.srcObject;
  }
  console.log("setAudioMuteState: ", !flag);
  v.getAudioTracks().forEach((track) => {
    track.enabled = !flag;
  });

  updateIndicatorStatus("mic_off", element_id, flag);
}

function setUserVideoMutedState(element_id, flag) {
  try {
    var v = getVideoObj(element_id).srcObject;
  } catch {
    var v = myVideo.srcObject;
  }
  console.log("element_id: ", element_id, " flag: ", flag);
  console.log("setVideoMuteState: ", !flag);
  v.getVideoTracks().forEach((track) => {
    track.enabled = !flag;
  });
  updateIndicatorStatus("video_off", element_id, flag);
}