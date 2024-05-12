var myPeer, peers = {}, user;
var col1, col2;
var users = new Array(), containerUsers, containerMessages, inputMessage, buttonSendMessage;

document.addEventListener('DOMContentLoaded', function() {
    const socket = io('/');
    col1 = document.querySelector('.col-1');
    col2 = document.querySelector('.col-2');
    containerUsers = document.getElementById('users-chat');
    containerMessages = document.getElementById('messages-chat');
    inputMessage = document.getElementById('text-message-chat');
    buttonSendMessage = document.getElementById('button-send-message');
    const buttonToggleCam = document.getElementById('button-toggle-cam');
    const buttonToggleAudio = document.getElementById('button-toggle-audio');
    const buttonEndCall = document.getElementById('button-end-call');
    const toggleNav = document.getElementById('toggle-nav');

    if (!isJson(USER)) window.close();
    user = JSON.parse(USER);
    
    myPeer = new Peer(undefined, { host: '/', port: '5001'});

    const myVideo = document.createElement('video');
    myVideo.muted = true;

    myPeer.on('open', async id => {
        let media = navigator.mediaDevices;
        const devices = await media.enumerateDevices();
        const mics = devices.filter(device => device.kind == "audioinput")
        const cams = devices.filter(device => device.kind == "videoinput")
        const allowedMicPermission = mics.some(device => device.label != '')
        const allowedWebcamPermission = cams.some(device => device.label != '')
        const hasMic = mics.length > 0
        const hasCam = cams.length > 0
        const constraints = { audio: allowedMicPermission || hasMic, video: allowedWebcamPermission && hasCam }

        if (!allowedMicPermission || !hasMic) {
            buttonToggleAudio.innerHTML = '<i class="fa-solid fa-microphone-slash"></i>';
        }

        if (!allowedWebcamPermission || !hasCam) {
            buttonToggleCam.innerHTML = '<i class="fa-solid fa-video-slash"></i>';
        }
    
        media.getUserMedia(constraints).then(stream => {
            addVideoStream(myVideo, stream, user);

            if (
                stream.getTracks().find(track => track.kind === "audio") &&
                stream.getTracks().find(track => track.kind === "audio").enabled
            ) {
                buttonToggleAudio.innerHTML = '<i class="fa-solid fa-microphone" style="color: #22c55e;"></i>';
                initToggle(myVideo, stream, 'audio', buttonToggleAudio, '<i class="fa-solid fa-microphone" style="color: #22c55e;"></i>', '<i class="fa-solid fa-microphone-slash"></i>');
            }

            if (
                stream.getTracks().find(track => track.kind === "video") &&
                stream.getTracks().find(track => track.kind === "video").enabled 
            ) {
                buttonToggleCam.innerHTML = '<i class="fa-solid fa-video" style="color: #22c55e;"></i>';
                initToggle(myVideo, stream, 'video', buttonToggleCam, '<i class="fa-solid fa-video" style="color: #22c55e;"></i>', '<i class="fa-solid fa-video-slash"></i>');
            }
    
            myPeer.on('connection', function (conn) {
                conn.on('open', function() {
                    user.peerID = id;
                    conn.send({user: user});
                    conn.on('data', function(data) {
                        const call = myPeer.call(data.peerID, stream);
                        const video = document.createElement('video');

                        call.once('stream', userVideoStream => {
                            addVideoStream(video, userVideoStream, data.user);
                        });
                        call.once('close', () => {
                            video.remove();
                        });
            
                        peers[call.peer] = call;
                    });
                });
            });
            socket.on('user-connected', userId => {
                connectToNewUser(id, userId, stream);
            });
            socket.emit('join-room', ROOM_ID, id);
        }).catch(error => {
            const stream = () => {
                return new MediaStream([createEmptyAudioTrack(), createEmptyVideoTrack({ width:640, height:480 })]);
            }
          
            const createEmptyAudioTrack = () => {
                const ctx = new AudioContext();
                const oscillator = ctx.createOscillator();
                const dst = oscillator.connect(ctx.createMediaStreamDestination());
                oscillator.start();
                window.onload = function() {ctx.resume()}
                const track = dst.stream.getAudioTracks()[0];
                return Object.assign(track, { enabled: false });
            }
          
            const createEmptyVideoTrack = ({ width, height }) => {
                const canvas = Object.assign(document.createElement('canvas'), { width, height });
                canvas.getContext('2d').fillRect(0, 0, width, height);
                
                const stream = canvas.captureStream();
                const track = stream.getVideoTracks()[0];
                
                return Object.assign(track, { enabled: false });
            };

            addVideoStream(myVideo, stream(), user);

            myPeer.on('connection', function (conn) {
                conn.on('open', function() {
                    user.peerID = id;
                    conn.send({user: user});
                    conn.on('data', function(data) {
                        const call = myPeer.call(data.peerID, stream());
                        const video = document.createElement('video');

                        call.once('stream', userVideoStream => {
                            addVideoStream(video, userVideoStream, data.user);
                        });
                        call.once('close', () => {
                            video.remove();
                        });
            
                        peers[call.peer] = call;
                    });
                });
            });

            socket.on('user-connected', userId => {
                connectToNewUser(id, userId, stream());
            });

            socket.emit('join-room', ROOM_ID, id);
        
        });
    });

    socket.on('user-disconnected', userId => {
        if (peers[userId]) peers[userId].close();
        let index = users.findIndex(user => {return user.peerID === userId});
        if (index > -1) {
            users.splice(index, 1);
            showUsers();
        }
    });

    socket.on('end-call', userId => {
        if (peers[userId]) window.close();
    });

    socket.on('chat-message', (msg, userSocket) => {
        newMessage(msg, userSocket);
    });
    
    buttonEndCall.addEventListener('click', function() {
        socket.emit('end-call');
        window.close();
    });

    if (toggleNav) toggleNav.addEventListener('change', () => {
        const label = document.querySelector(`label[for=${toggleNav.id}]`);
        if (toggleNav.checked) label.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        else label.innerHTML = '<i class="fa-solid fa-bars"></i>';
    });

    if (inputMessage && buttonSendMessage) buttonSendMessage.addEventListener('click', () => {
        let msg = inputMessage.value;
        if (msg.trim().length > 0 && user instanceof Object) socket.emit('chat-message', msg, user);
        inputMessage.value = '';
    });
});

function addVideoStream(video, stream, user) {
    users.push(user);
    showUsers();
    video.muted = true;
    video.srcObject = stream;

    if (
        !stream.getTracks().find(track => track.kind === "video") ||
        !stream.getTracks().find(track => track.kind === "video").enabled
    ) {
        video.classList.add('opacity-0');
    }

    if (
        !stream.getTracks().find(track => track.kind === "audio") ||
        !stream.getTracks().find(track => track.kind === "audio").enabled) {
        video.muted = true;
    }

    let img = document.createElement('img');
    img.src = (user instanceof Object && user._imageURL !== undefined) ? user._imageURL : '/images/user-solid.jpg';
    img.title = (user instanceof Object && user._name !== undefined) ? user._name : 'Desconocido';
    img.alt = 'Imagen de usuario';

    let div = document.createElement('div');
    div.classList.add('container-video');

    div.appendChild(video);
    div.appendChild(img);

    if (col2.childElementCount === 0) {
        col2.appendChild(div);
    } else {
        col1.innerHTML = '';
        col1.appendChild(div);
    }    

    video.addEventListener('loadedmetadata', () => {
        video.play();
        video.muted = false;
    });
}

function connectToNewUser(myId, userId, stream) {
    const conn = myPeer.connect(userId);
    conn.on('open', function () {
        conn.on('data', function (data) {
            user.peerID = myId;
            conn.send({user: user, peerID: myId});

            myPeer.on('call', function(call) {
                call.answer(stream);
                const video = document.createElement('video');

                call.once('stream', userVideoStream => {
                    addVideoStream(video, userVideoStream, data.user);
                });
                call.once('close', () => {
                    video.remove();
                });
    
                peers[call.peer] = call;
            });
        });
    });
}

function initToggle(video, stream, target, button, innerHTMLenabled, innerHTMLdisabled) {
    if (button) button.addEventListener('click', () => {
        let videoTrack = stream.getTracks().find(track => track.kind === target);
        videoTrack.enabled = !videoTrack.enabled;
        button.innerHTML = (videoTrack.enabled) ? innerHTMLenabled : innerHTMLdisabled;
        
        if (target === 'video') {
            if (videoTrack.enabled) video.classList.remove('opacity-0');
            else video.classList.add('opacity-0');
        }
    });
}

function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

function showUsers() {
    if (!containerUsers) return;
    containerUsers.innerHTML = '';

    if (users instanceof Array) users.forEach((user) => {
        let li = document.createElement('li');
        let containerImage = document.createElement('div');
        let img = document.createElement('img');
        let p = document.createElement('p');

        containerImage.classList.add('image');
        img.onload = function () {containerImage.appendChild(img);}
        img.src = (user._imageURL !== undefined) ? user._imageURL : '/images/user-solid.jpg';
        img.alt = 'Imagen de usuario';
        img.title = (user._name !== undefined) ? user._name : 'Desconocido';

        p.textContent = (user._name !== undefined) ? user._name : 'Desconocido';

        li.appendChild(containerImage);
        li.appendChild(p);

        containerUsers.appendChild(li);
    });
}

function newMessage(msg, userSocket) {
    console.log(user);
    console.log(userSocket);
    if (msg === undefined || msg === null || msg === '' || !(user instanceof Object) || !(userSocket instanceof Object)) return;

    let className = (user.peerID === userSocket.peerID) ? 'right-message' : 'left-message';
    let li = document.createElement('li');
    li.classList.add(className);
    li.textContent = msg;
    containerMessages.appendChild(li);
}