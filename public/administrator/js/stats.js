import { isset } from "../../form.js";
import { socket } from "../../socket.js";

const idUser = 'count-users-stat';
const idMedicine = 'count-medicines-stat';
const idDisease = 'count-diseases-stat';
const idAppointment = 'count-appointments-stat';
var cards;

socket.on('users/length', (length) => {
    if (!isset([length]) || isNaN(length)) return;
    let countUsers = document.getElementById(idUser);
    if (countUsers) countUsers.textContent = length;
});

socket.on('medicines/length', (length) => {
    if (!isset([length]) || isNaN(length)) return;
    let countMedicines = document.getElementById(idMedicine);
    if (countMedicines) countMedicines.textContent = length;
});

socket.on('diseases/length', (length) => {
    if (!isset([length]) || isNaN(length)) return;
    let countDiseases = document.getElementById(idDisease);
    if (countDiseases) countDiseases.textContent = length;
});

socket.on('appointments/length', (length) => {
    if (!isset([length]) || isNaN(length)) return;
    let countAppointments = document.getElementById(idAppointment);
    if (countAppointments) countAppointments.textContent = length;
});

document.addEventListener('DOMContentLoaded', function() {
    cards = document.querySelectorAll('.card-stats');
    toogleSkeleton(true);
    setTimeout(() => {toogleSkeleton(false)}, 500);

    socket.emit('users/length', false);
    socket.emit('medicines/length', false);
    socket.emit('diseases/length', false);
    socket.emit('appointments/length', false);
});

function toogleSkeleton(showSkeleton) {
    for(let i = 0; i < cards.length; i++) {
        if (showSkeleton) {
            if (cards[i].classList.contains('visible')) cards[i].classList.remove('visible');
            if (!cards[i].classList.contains('skeleton')) cards[i].classList.add('skeleton');
        } else {
            if (cards[i].classList.contains('skeleton')) cards[i].classList.remove('skeleton');
            if (!cards[i].classList.contains('visible')) cards[i].classList.add('visible');
        }
    }
}