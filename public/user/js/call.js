import { socket } from "../../socket.js";
import { isset } from '../../form.js';
import { hideModal, showModal } from '../../modal.js';

var patient, doctor;
var modalCall, buttonAceptCall, buttonCancelCall;

document.addEventListener('DOMContentLoaded', function() {
    modalCall =  document.querySelector('.modal-call');
    buttonAceptCall = document.getElementById('button-accept-call');
    buttonCancelCall = document.getElementById('button-cancel-call');

    if (modalCall && buttonAceptCall && buttonCancelCall) {
        socket.on('patient/session/read', (data) => {
            if (data instanceof Object) {
                patient = data;
                socket.emit('reconnect-call', patient, (error, response) => {});
            }
        });
    
        socket.on('call', (patientData, doctorData) => {
            if (!(patientData instanceof Object) || !(doctorData instanceof Object) || !(patient instanceof Object)) return;
            if (Number(patient._id) === Number(patientData._id)) {
                doctor = doctorData;
                showCall();
            }
        });

        socket.on('cancel-call', (patientCall, doctorCall) => {
            if (!(patient instanceof Object) || !(doctor instanceof Object)) return;
            if (!(patientCall instanceof Object) || !(doctorCall instanceof Object)) return;
            if (Number(patient._id) === Number(patientCall._id) && Number(doctor._id) === Number(doctorCall._id)) cancelCall();
        });

        socket.on('cancel-call-doctor', (patientCall, doctorCall) => {
            if (!(patient instanceof Object) || !(doctor instanceof Object)) return;
            if (!(patientCall instanceof Object) || !(doctorCall instanceof Object)) return;
            if (Number(patient._id) === Number(patientCall._id) && Number(doctor._id) === Number(doctorCall._id)) cancelCall();
        });

        buttonCancelCall.addEventListener('click', () => {
            if (patient instanceof Object && doctor instanceof Object) socket.emit('cancel-call', patient, doctor, (error, response) => {});
        });
    }
});

function showCall() {
    if (!isset([modalCall])) return;

    let profile = modalCall.querySelector('.profile-user');
    if (!isset([profile])) return;

    profile.innerHTML = '';
    
    let img = document.createElement('img');
    let containerImage = document.createElement('div');
    containerImage.classList.add('image');
    
    img.onload = () => {containerImage.appendChild(img);}
    img.src = ((doctor instanceof Object) && isset([doctor._imageURL])) ? doctor._imageURL : '/images/user-solid.jpg';
    img.alt = 'Imagen de Doctor';
    img.title = ((doctor instanceof Object) && isset([doctor._name])) ? doctor._name : 'Desconocido';
    profile.appendChild(containerImage);

    let p = document.createElement('p');
    p.classList.add('name');
    p.textContent = ((doctor instanceof Object) && isset([doctor._name])) ? doctor._name : 'Desconocido';
    profile.appendChild(p);

    p = document.createElement('p');
    p.classList.add('email');
    p.textContent = ((doctor instanceof Object) && isset([doctor._email])) ? doctor._email : 'Desconocido';
    profile.appendChild(p);

    p = modalCall.querySelector('.date-call');
    p.textContent = new Date().toLocaleTimeString();

    showModal(modalCall);
}

function cancelCall() {
    if (!isset([modalCall])) return;
    hideModal(modalCall);

    let profile = modalCall.querySelector('.profile-user');
    if (isset([profile])) setTimeout(() => {profile.innerHTML = ''}, 500);
}