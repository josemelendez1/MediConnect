import { isset } from "../../form.js";
import { socket } from '../../socket.js';

var id;

socket.on('doctor/session/read', (doctor) => {
    if (!(doctor instanceof Object)) return;
    id = doctor._id;
    syncProfile(doctor);
});

socket.on('doctor/updated', (idDoctor) => {
    if (!isset([idDoctor]) || isNaN(idDoctor)) return;
    if (Number(idDoctor) === Number(id)) {
        socket.emit('doctor/session/read');
    }
});

document.addEventListener('DOMContentLoaded', function() {
    socket.emit('doctor/session/read');
});

function syncProfile(doctor) {
    const imageURL = doctor._imageURL;
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
        email.textContent = doctor._email;
    });
}