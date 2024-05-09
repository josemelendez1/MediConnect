import { isset } from "../../form.js";
import { socket } from '../../socket.js';

var id;

document.addEventListener('DOMContentLoaded', function() {
    socket.on('patient/session/read', (patient) => {
        if (!(patient instanceof Object)) return;
        if (!isset([patient._id]) || isNaN(patient._id)) return;
        id = patient._id;
        syncProfile(patient);
    });
    
    socket.on('patient/updated', (idPatient) => {
        if (!isset([idPatient, id]) || isNaN(idPatient) || isNaN(id)) return;
        if (Number(idPatient) === Number(id)) {
            socket.emit('patient/session/read');
        }
    });

    socket.emit('patient/session/read');
});

function syncProfile(patient) {
    const imageURL = patient._imageURL;
    const images = document.querySelectorAll('.image-profile');
    const emails = document.querySelectorAll('.email-profile');

    if (isset([imageURL])) {
        if (images) images.forEach(image => {
            image.src = imageURL;
        });
    } else {
        if (images) images.forEach(image => {
            image.src = '/images/user-solid.jpg';
        });
    }

    if (isset([patient._email])) {
        if (emails) emails.forEach(email => {
            email.textContent = patient._email;
        });   
    }
}