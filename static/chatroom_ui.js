var myVideo;

document.addEventListener("DOMContentLoaded", (event) => {
    myVideo = document.getElementById("local_vid");
    myVideo.onloadeddata = () => { console.log("W,H: ", myVideo.videoWidth, ", ", myVideo.videoHeight); };
    // var muteBttn = document.getElementById("bttn_mute");
    // var muteVidBttn = document.getElementById("bttn_vid_mute");
    // var callEndBttn = document.getElementById("call_end");

    // muteBttn.addEventListener("click", (event)=>{
    //     audioIsMuted = !audioIsMuted;
    //     setAudioMuteState(audioIsMuted);        
    // });    
    // muteVidBttn.addEventListener("click", (event)=>{
    //     videoIsMuted = !videoIsMuted;
    //     setVideoMuteState(videoIsMuted);        
    // });    
    // callEndBttn.addEventListener("click", (event)=>{
    //     window.location.replace("/");
    // });

    // document.getElementById("room_link").innerHTML=`or the link: <span class="heading-mark">${window.location.href}</span>`;

});




function addVideoElement(
  element_id,
  display_name,
  audio_muted,
  video_muted,
  admin,
  adminClick,
  adminButtonsClick
) {
  document
    .getElementById("video_grid")
    .appendChild(
      makeVideoElementCustom(
        element_id,
        display_name,
        audio_muted,
        video_muted,
        admin,
        adminClick,
        adminButtonsClick
      )
    );
  checkVideoLayout();
}
function removeVideoElement(element_id) {
    let v = getVideoObj(element_id);
    if (v == null) {
      return;
    }
    v.classList.add("fade-out-zoom-out");
    if (v.srcObject) {
        v.srcObject.getTracks().forEach(track => track.stop());
    }
    v.removeAttribute("srcObject");
    v.removeAttribute("src");

    document.getElementById("vid_" + element_id).remove();
    try {
        document.getElementById("container_" + element_id).remove();
    } catch (error) {
        
    }
    removeMiniVideoElement(element_id);
}

function removeMiniVideoElement(element_id) {
  let v = getMiniVideoObj(element_id);
  if (v == null) {
    return;
  }
  v.classList.add("fade-out-zoom-out");
  if (v.srcObject) {
    v.srcObject.getTracks().forEach((track) => track.stop());
  }
  v.removeAttribute("srcObject");
  v.removeAttribute("src");

  document.getElementById("min_vid_" + element_id).remove();
  document.getElementById("person_card_" + element_id).remove();
   var people_box = document.getElementById("people_box");
   var people_users = document.getElementById("people_users");
   people_box.children[0].innerHTML = `<p class="placeholder-text">Há: ${
     people_users.children.length
   } pessoas na sala</p>`;

   if (people_users.children.length == 0) {
     people_box.children[0].innerHTML = `
        <p class="placeholder-text fade-in-zoom-in">Não há mais ninguém na sala</p>
        <i class="material-icons empty-icon fade-in-zoom-in">group</i>
    `;
     console.log("Added default text and empty icon");
   }
}

function createPersonCard(element_id, display_name) {
  // Create card element
  let card = document.createElement("div");
  card.id = "person_card_" + element_id;
  card.classList.add("person-card");
  card.classList.add("fade-in-zoom-in-delayed");

  // Add person's name to the card
  let nameElement = document.createElement("p");
  nameElement.textContent = display_name;
  card.appendChild(nameElement);

  // Create video element
  let videoElement = document.createElement("video");
  videoElement.classList.add("animvideo");

  videoElement.id = "min_vid_" + element_id;
  videoElement.classList.add("mini-video");
  videoElement.style.borderRadius = "10px";
  videoElement.style.margin = "5px";
  videoElement.autoplay = true;
  card.appendChild(videoElement);
  

  // Append card to people_box div
  var people_box = document.getElementById("people_box");
  var people_users = document.getElementById("people_users");
  people_users.appendChild(card);
  if (people_box.children[0].tagName == "P") {
    people_box.children[0].innerHTML = `<p class="placeholder-text">Há: ${
      people_users.children.length
    } pessoas na sala</p>`;
  } 
  console.log("createPersonCard: ", card);
}

function getVideoObj(element_id) {
    return document.getElementById("vid_" + element_id);
}

function getMiniVideoObj(element_id) {
  return document.getElementById("min_vid_" + element_id);
}

function setAudioMuteState(flag) {
  let local_stream = myVideo.srcObject;
  console.log("setAudioMuteState: ", local_stream);
  local_stream.getAudioTracks().forEach((track) => {
    track.enabled = !flag;
  });
  // switch button icon
  document.getElementById("mute_audio_button").style.backgroundColor = flag
    ? "red"
    : null; // Change colors as needed
}
function setVideoMuteState(flag) {
  let local_stream = myVideo.srcObject;
  local_stream.getVideoTracks().forEach((track) => {
    track.enabled = !flag;
  });
  // switch button icon
  document.getElementById("mute_video_button").style.backgroundColor = flag
    ? "red"
    : null; // Change colors as needed
}

function setOtherVideoMuteState(userId, flag) {
  // Assuming you have access to other users' video elements or stream objects
  let userVideo = getVideoObj(userId); // Assuming each user has a unique video element id

  if (userVideo) {
    let userStream = userVideo.srcObject;
    userStream.getVideoTracks().forEach((track) => {
      track.enabled = !flag;
    });
  }
}

function setOtherAudioMuteState(userId, flag) {
  // Assuming you have access to other users' video elements or stream objects
  let userVideo = getVideoObj(userId); // Assuming each user has a unique video element id

  if (userVideo) {
    let userStream = userVideo.srcObject;
    userStream.getAudioTracks().forEach((track) => {
      track.enabled = !flag;
    });
  }
}



// Button functionalities
$("#mute_video_button").click(function () {
    // Add functionality to mute video
    console.log("Mute Video clicked");
    videoIsMuted = !videoIsMuted;
    setVideoMuteState(videoIsMuted);
    sendActionToServer("video_off", videoIsMuted);
});

$("#mute_audio_button").click(function () {
    // Add functionality to mute audio
    console.log("Mute Audio clicked");
    audioIsMuted = !audioIsMuted;
    setAudioMuteState(audioIsMuted);
    sendActionToServer("mic_off", audioIsMuted);
});

$("#raise_hand_button").click(function () {
  myHand = !myHand;
  // Add functionality to raise hand
  console.log("Raise Hand clicked");
  sendActionToServer("hand", myHand);
  document.getElementById("raise_hand_button").style.backgroundColor = myHand
    ? "blue"
    : null; // Change colors as needed
});

$("#chat_send").click(function () {
    // Add functionality to send message
    socket.emit("chat-message", {
      sid: myID,
      message: $("#chat_input").val(),
      room_id: myRoomID,
    });
    $("#chat_input").val("");
    console.log("Message sent");
});

// Global variable to store original webcam stream
var originalWebcamStream;

// Function to start screen sharing
$("#share_screen_button").click(function () {
    // Check if the browser supports getDisplayMedia
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        // Request screen sharing permission
        navigator.mediaDevices.getDisplayMedia({ video: true })
            .then(function(stream) {
                document.getElementById(
                  "share_screen_button"
                ).style.backgroundColor = "green";
                // Store original webcam stream
                originalWebcamStream = myVideo.srcObject;
                
                // Set screen sharing stream as the source object for video element
                myVideo.srcObject = stream;
                
                // Add screen sharing track to peer connections
                for (let peer_id in _peer_list) {
                    // Get existing sender for video track
                    let senders = _peer_list[peer_id].getSenders();
                    senders.forEach(sender => {
                        if (sender.track && sender.track.kind === 'video') {
                            // Replace existing video track with screen sharing track
                            sender.replaceTrack(stream.getVideoTracks()[0]);
                        }
                    });
                }

                // Listen for screen sharing stream end event
                stream.getVideoTracks()[0].onended = function() {
                    document.getElementById(
                      "share_screen_button"
                    ).style.backgroundColor = null;
                    // Screen sharing stream has ended
                    console.log("Screen sharing stream ended.");
                    // Restore webcam feed
                    restoreWebcamFeed();
                };
            })
            .catch(function(error) {
                console.error("Error sharing screen:", error);
            });
    } else {
        console.error("Screen sharing not supported in this browser.");
    }
});

// Function to restore webcam feed
function restoreWebcamFeed() {
    // Restore original webcam stream
    myVideo.srcObject = originalWebcamStream;

    // Add webcam track to peer connections
    for (let peer_id in _peer_list) {
        // Get existing sender for video track
        let senders = _peer_list[peer_id].getSenders();
        senders.forEach(sender => {
            if (sender.track && sender.track.kind === 'video') {
                // Replace existing screen sharing track with webcam track
                sender.replaceTrack(originalWebcamStream.getVideoTracks()[0]);
            }
        });
    }
}

function makeVideoElementCustom(
  element_id,
  display_name,
  audio_muted,
  video_muted,
  admin,
  adminClick,
  adminButtonsClick
) {
  // Create container for video and user info
  let container = document.createElement("div");
  container.id = "container_" + element_id;
  container.style.width = "100%";
  container.style.position = "relative";
  container.style.height = "100%";
  container.style.margin = "5px";
  container.style.display = "inline-flex"; // Ensure container adopts the size of its contents
  container.style.justifyContent = "center";
  container.style.alignItems = "center";

  container.classList.add("container");

  // Create video element
  let vid = document.createElement("video");
  vid.classList.add("animvideo");
  vid.id = "vid_" + element_id;
  vid.style.borderRadius = "10px"; // Adjust the border radius to change the roundness
  vid.style.margin = "5px";
  vid.style.width = "100%";
  vid.style.height = "100%";
  vid.style.objectFit = "cover";
  vid.autoplay = true;

  // Create user info box
  let userInfoBox = document.createElement("div");
  userInfoBox.id = "user_info_" + element_id;
  userInfoBox.classList.add("user-info-box");
  userInfoBox.innerText = display_name;

  // Create buttons container
  let buttonsContainer = document.createElement("div");
  buttonsContainer.classList.add("buttons-container");
  buttonsContainer.style.zIndex = "10";
  buttonsContainer.style.position = "absolute";
  buttonsContainer.style.top = "50%";
  buttonsContainer.style.left = "50%";
  buttonsContainer.style.transform = "translate(-50%, -50%)";
  buttonsContainer.style.display = "none"; // initially hidden
  buttonsContainer.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
  buttonsContainer.style.borderRadius = "10px";
  buttonsContainer.style.padding = "10px";
  buttonsContainer.style.margin = "5px";

  // Create mute video button
  let muteVideoButton = document.createElement("button");
  muteVideoButton.innerHTML = "<i class='material-icons'>videocam_off</i>";
  muteVideoButton.title = "Mute Video";
  muteVideoButton.style.backgroundColor = "transparent";
  muteVideoButton.style.color = "#ffffff";
  muteVideoButton.style.border = "none";
  muteVideoButton.style.cursor = "pointer";
  muteVideoButton.style.fontSize = "24px";
  buttonsContainer.appendChild(muteVideoButton);

  // Create mute audio button
  let muteAudioButton = document.createElement("button");
  muteAudioButton.innerHTML = "<i class='material-icons'>mic_off</i>";
  muteAudioButton.title = "Mute Audio";
  muteAudioButton.style.backgroundColor = "transparent";
  muteAudioButton.style.color = "#ffffff";
  muteAudioButton.style.border = "none";
  muteAudioButton.style.cursor = "pointer";
  muteAudioButton.style.fontSize = "24px";
  buttonsContainer.appendChild(muteAudioButton);

  // Create kick button
  let kickButton = document.createElement("button");
  kickButton.innerHTML = "<i class='material-icons'>block</i>"; // Icon for kick button
  kickButton.title = "Kick";
  kickButton.style.backgroundColor = "transparent";
  kickButton.style.color = "#ffffff";
  kickButton.style.border = "none";
  kickButton.style.cursor = "pointer";
  kickButton.style.fontSize = "24px";
  buttonsContainer.appendChild(kickButton);

  // Create ban button
  let banButton = document.createElement("button");
  banButton.innerHTML = "<i class='material-icons'>cancel</i>"; // Icon for ban button
  banButton.title = "Ban";
  banButton.style.backgroundColor = "transparent";
  banButton.style.color = "#ffffff";
  banButton.style.border = "none";
  banButton.style.cursor = "pointer";
  banButton.style.fontSize = "24px";
  buttonsContainer.appendChild(banButton);

  // Add buttons container to user info box
  container.appendChild(buttonsContainer);

  // Create status indicators (mic muted, video muted, hand)
  let statusIndicators = document.createElement("div");
  statusIndicators.style.position = "absolute";
  statusIndicators.style.top = "50px";
  statusIndicators.style.left = "50%";
  statusIndicators.style.transform = "translateX(-50%)";
  statusIndicators.style.display = "flex";
  statusIndicators.style.margin = "5px";

  // Add mic muted indicator
  let micMutedIcon = document.createElement("i");
  micMutedIcon.id = "micIsMuted";
  micMutedIcon.className = "material-icons";
  micMutedIcon.style.margin = "5px";
  micMutedIcon.style.color = "red"; // Customize color as needed
  micMutedIcon.title = "Audio Muted";
  micMutedIcon.innerHTML = "mic_off"; // Material Icons name for audio off
  micMutedIcon.style.display = audio_muted == "1" ? "block" : "none";
  statusIndicators.appendChild(micMutedIcon);

  // Create admin indicator
  let adminIndicator = document.createElement("i");
  adminIndicator.id = "isAdmin";
  adminIndicator.className = "material-icons";
  adminIndicator.style.margin = "5px";
  adminIndicator.style.color = "green"; // Customize color as needed for admin indicator
  adminIndicator.title = "Admin";
  adminIndicator.innerHTML = "verified_user"; // Material Icons name for admin indicator
  adminIndicator.style.display = admin == "1" ? "block" : "none"; // Set display based on whether user is admin or not
  statusIndicators.appendChild(adminIndicator);

  // Add video muted indicator
  let videoMutedIcon = document.createElement("i");
  videoMutedIcon.id = "videoIsMuted";
  videoMutedIcon.className = "material-icons";
  videoMutedIcon.style.margin = "5px";
  videoMutedIcon.style.color = "red"; // Customize color as needed
  videoMutedIcon.title = "Video Muted";
  videoMutedIcon.innerHTML = "videocam_off"; // Material Icons name for video off
  videoMutedIcon.style.display = video_muted == "1" ? "block" : "none";
  statusIndicators.appendChild(videoMutedIcon);

  // Add hand indicator
  let handIcon = document.createElement("i");
  handIcon.id = "hand";
  handIcon.className = "material-icons";
  handIcon.style.margin = "5px";
  handIcon.style.color = "blue"; // Customize color as needed
  handIcon.title = "Raised Hand";
  handIcon.innerHTML = "pan_tool"; // Specify the Material Icons name here
  handIcon.style.display = "none";
  statusIndicators.appendChild(handIcon);

  // Add click event listener to toggle buttons visibility
  vid.addEventListener("click", function () {
    adminClick(
      buttonsContainer,
      kickButton,
      banButton,
      muteVideoButton,
      muteAudioButton,
      element_id
    );
  });

  muteAudioButton.addEventListener("click", function () {
    adminButtonsClick(element_id, "AUDIO");
  });

  muteVideoButton.addEventListener("click", function () {
    adminButtonsClick(element_id, "VIDEO");
  });

  kickButton.addEventListener("click", function () {
    adminButtonsClick(element_id, "KICK");
  });

  banButton.addEventListener("click", function () {
    adminButtonsClick(element_id, "BAN");
  });

  // Append video element, user info box, and buttons container to container
  container.appendChild(vid);
  container.appendChild(userInfoBox);

  // Add status indicators to container
  container.appendChild(statusIndicators);

  return container;
}


$("#end_call_button").click(function () {
  // Handle the received data, and trigger a SweetAlert
  Swal.fire({
    title: "Are you sure you want to end the call?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, end it!",
  }).then((result) => {
    if (result.isConfirmed) {
      // Navigate to index.html
      window.location.href = `/?errorMessage=Você saiu da sala ${myRoomID}.`;
    }
  })
});




$("#toggle_chat_button").click(function () {
    // Toggle chat visibility
    var chatBox = $("#chat_box");
    var vid = $("#local_vid");
    if ($(window).width() <= 768) {
        if (chatBox.width() === 0) {
          document.getElementById("toggle_chat_button").style.backgroundColor =
            "orange";
          chatBox.animate(
            {
              width: "95%",
              opacity: 1,
            },
            300
          );
          vid.animate(
            {
              width: "0px",
            },
            300
          );
        } else {
          document.getElementById("toggle_chat_button").style.backgroundColor =
            null;
          chatBox.animate(
            {
              width: "0%",
              opacity: 0,
            },
            300
          );
          vid.animate(
            {
              width: "150px",
            },
            300
          );
        }
    } else {
        if (chatBox.width() === 0) {
          document.getElementById("toggle_chat_button").style.backgroundColor =
            "orange";
          chatBox.animate(
            {
              width: "30%",
              opacity: 1,
            },
            300
          );
          vid.animate(
            {
              width: "0px",
            },
            300
          );
        } else {
          document.getElementById("toggle_chat_button").style.backgroundColor =
            null;
          chatBox.animate(
            {
              width: "0%",
              opacity: 0,
            },
            300
          );
          vid.animate(
            {
              width: "150px",
            },
            300
          );
        }
    }
    
});

$("#toggle_people_button").click(function () {
  // Toggle chat visibility
  var chatBox = $("#people_box");
  var vid = $("#local_vid");
  console.log(chatBox.width());

  // Check if it's a mobile device (viewport width less than or equal to 768 pixels)
  if ($(window).width() <= 768) {
    if (chatBox.width() === 0) {
      // Mobile mode animation
      var people_box = document.getElementById("people_box");
      var people_users = document.getElementById("people_users");
      people_box.children[0].innerHTML = `<p class="placeholder-text">Há: ${people_users.children.length} pessoas na sala</p>`;

      if (people_users.children.length == 0) {
        people_box.children[0].innerHTML = `
                    <p class="placeholder-text animvideo fade-in-zoom-in-delayed">Não há mais ninguém na sala</p>
                    <i class="material-icons empty-icon fade-in-zoom-in-delayed">group</i>
                `;
        console.log("Added default text and empty icon");
      }
      document.getElementById("toggle_people_button").style.backgroundColor =
        "purple";
      chatBox.animate(
        {
          width: "95%",
          opacity: 1,
        },
        300
      );
      vid.animate(
        {
          height: "0px",
        },
        300
      );
    } else {
      document.getElementById("toggle_people_button").style.backgroundColor =
        null;
      chatBox.animate(
        {
          width: "0%",
          opacity: 0,
        },
        300
      );
      vid.animate(
        {
          height: "240px",
        },
        300
      );
    }
  } else {
    // Desktop mode animation
    if (chatBox.width() === 0) {
      document.getElementById("toggle_people_button").style.backgroundColor =
        "purple";
      chatBox.animate(
        {
          width: "20%", // Adjusted width for desktop mode
          opacity: 1,
        },
        300
      );
      vid.animate(
        {
          height: "0px",
        },
        300
      );
    } else {
      document.getElementById("toggle_people_button").style.backgroundColor =
        null;
      chatBox.animate(
        {
          width: "0%",
          opacity: 0,
        },
        300
      );
      vid.animate(
        {
          height: "240px",
        },
        300
      );
    }
  }
});



