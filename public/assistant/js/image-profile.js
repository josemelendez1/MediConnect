import { isset } from "../../form.js";
import { socket } from '../../socket.js';

var id;

document.addEventListener('DOMContentLoaded', function() {
    socket.on('assistant/session/read', (assistant) => {
        if (!(assistant instanceof Object)) return;
        id = assistant._id;
        syncProfile(assistant);
    });
    
    socket.on('assistant/updated', (idAssistant) => {
        if (!isset([idAssistant]) || isNaN(idAssistant)) return;
        if (Number(idAssistant) === Number(id)) {
            socket.emit('assistant/session/read');
        }
    });

    socket.emit('assistant/session/read');
});

function syncProfile(assistant) {
    const imageURL = assistant._imageURL;
    const images = document.querySelectorAll('.image-profile');
    const emails = document.querySelectorAll('.email-profile');
    if (isset([imageURL])) {
        images.forEach(image => {
            image.src = imageURL;
        });
    } else {
        images.forEach(image => {
            image.src = '/images/user-solid.jpg';
        });
    }

    if (emails) emails.forEach(email => {
        email.textContent = assistant._email;
    });
}