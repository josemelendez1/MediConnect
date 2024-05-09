const socket = io('/');
const videoMainContainer = document.getElementById('video-main');
const videoContainer = document.getElementById('video-container');
const buttonToggleCam = document.getElementById('button-toggle-cam');
const buttonToggleAudio = document.getElementById('button-toggle-audio');
const myPeer = new Peer(undefined, {
    host: '/',
    port: '5001'
});

const myVideo = document.createElement('video');
myVideo.muted = true;
const peers = {};

myPeer.on('open', async id => {
    var getUserMedia = await navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    getUserMedia({video: true, audio: true}, function(stream) {
        addVideoStream(myVideo, stream);

        myPeer.on('call', call => {
            call.answer(stream);
            const video = document.createElement('video');
            call.once('stream', userVideoStream => {
                console.log(1);
                addVideoStream(video, userVideoStream);
            });
            call.once('close', () => {
                video.remove();
            });

            peers[call.peer] = call;
        });

        socket.on('user-connected', userId => {
            connectToNewUser(userId, stream);
        });

        socket.emit('join-room', ROOM_ID, id);
        initToggle(stream, 'video', buttonToggleCam, '<i class="fa-solid fa-video" style="color: #22c55e;"></i>', '<i class="fa-solid fa-video-slash"></i>');
        initToggle(stream, 'audio', buttonToggleAudio, '<i class="fa-solid fa-microphone" style="color: #22c55e;"></i>', '<i class="fa-solid fa-microphone-slash"></i>');

    }, function(err) {
        console.log('Failed to get local stream' ,err);
    });
});

socket.on('user-disconnected', userId => {
    console.log('User disconnected:' + userId);
    if (peers[userId]) peers[userId].close(); 
});

function addVideoStream(video, stream) {
    video.srcObject = stream;
    if (videoContainer.childElementCount === 2 && videoMainContainer.childElementCount === 0) videoMainContainer.append(video);
    else videoContainer.append(video);

    video.addEventListener('loadedmetadata', () => {
        video.play();
    });

    video.addEventListener('click', () => {
        if (video.parentNode !== videoContainer) return;  
        video.classList.add('selected');
        setTimeout(() => {
            video.classList.remove('selected');
            if (videoMainContainer.childElementCount > 0) {
                let childrens = videoMainContainer.children;
                for (let i = 0; i < childrens.length; i++) {
                    videoContainer.append(childrens[i]);
                }
            }
            videoMainContainer.innerHTML = '';
            videoMainContainer.appendChild(video);
        }, 100);
    });
}

function connectToNewUser(userId, stream) {
    const call = myPeer.call(userId, stream);
    const video = document.createElement('video');

    call.once('stream', userVideoStream => {
        console.log(2);
        addVideoStream(video, userVideoStream);
    });

    call.once('close', () => {
        video.remove();
    });

    peers[userId] = call;
}

function initToggle(stream, target, button, innerHTMLenabled, innerHTMLdisabled) {
    if (button) button.addEventListener('click', () => {
        let videoTrack = stream.getTracks().find(track => track.kind === target);
        videoTrack.enabled = !videoTrack.enabled;
        button.innerHTML = (videoTrack.enabled) ? innerHTMLenabled : innerHTMLdisabled;
    });
}