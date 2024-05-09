import { isset } from "../../form.js";
import { socket } from '../../socket.js';

var idAdministrator;

socket.on('administrator/session/read', (administrator) => {
    if (!(administrator instanceof Object)) return;
    idAdministrator = administrator._id;
    syncProfile(administrator);
});

socket.on('administrator/read', (administrator) => {
    if (!(administrator instanceof Object)) return;
    if (administrator._id === idAdministrator) {
        syncProfile(administrator);
    }
});

document.addEventListener('DOMContentLoaded', function() {
    socket.emit('administrator/session/read');
});

function syncProfile(administrator) {
    const imageURL = administrator._imageURL;
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
        email.textContent = administrator._email;
    });
}