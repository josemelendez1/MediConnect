import { isDate, isset } from "../../form.js";
import { socket } from '../../socket.js';
import { ajax, isJson } from '../../ajax.js';
import { ERROR, NOT_ALLOWED, SUCCESS } from "../../codes.js";

var patient, patientEagle, appointments;
var template, container, containerHidden; //DOM

document.addEventListener("DOMContentLoaded", async function() {
    template = document.getElementById('template-medical-records');
    container = document.getElementById('container-medical-records');
    containerHidden = document.getElementById('container-hidden');

    if (isset([template, container, containerHidden])) {
        socket.on('patient/session/read', async (data) => {
            if (data instanceof Object) patient = data;
            socket.emit("appointment-patient-eager/read", patient._id, false, (error, response) => {});
        });
        
        socket.on('patient/updated', (id) => {
            if (patient instanceof Object && Number(patient._id) === Number(id)) socket.emit('patient/session/read');
        });

        socket.on('appointment-patient-eager/read', (data) => {
            if (
                data instanceof Object && 
                patient instanceof Object &&
                Number(patient._id) === (data._id)
            ) {
                patientEagle = data;
                read();
            }
        });
    }
});

function read() {
    if (!isset([template, container])) return;
    if (!(patientEagle instanceof Object)) return;
    if (!(patientEagle._appointments instanceof Array)) return;

    appointments = patientEagle._appointments;
    appointments.sort(function(a, b) {return b._medicalRecord._id - a._medicalRecord._id});

    container.innerHTML = '';
    let img, name, email;

    for (let i = 0; i < appointments.length; i++) {
        let doctor = appointments[i]._doctor;
        let medicalRecord = appointments[i]._medicalRecord;
        let clone = template.content.cloneNode(true);
        let content = clone.querySelector('.medical-record');
        
        let subtitle = content.querySelector('.subtitle');
        if (subtitle) subtitle.textContent = `N° ${medicalRecord._id}`;

        let riskText = '';
        switch (medicalRecord._risk) {
            case 1: riskText = 'Bajo Riesgo'; break;
            case 2: riskText = 'Riesgo Moderado'; break;
            case 3: riskText = 'Riesgo Alto'; break; 
            case 4: riskText = 'Muy Alto Riesgo'; break;
        }

        let risk = content.querySelector('.risk');
        if (risk) risk.innerHTML = `Severidad: <span>${riskText}</span>.`;

        let reason = content.querySelector('.reason');
        if (reason) reason.textContent = medicalRecord._reason;

        let createdAt = content.querySelector('.created-at');
        if (createdAt) createdAt.innerHTML = `Fecha de Creación: <span>${(isDate(medicalRecord.createdAt)) ? new Date(medicalRecord.createdAt).toLocaleDateString() : ''}</span>`;

        let profileDoctor = content.querySelector('.doctor');
        
        img = profileDoctor.querySelector('.image-profile');
        if (img) {
            img.src = (isset([doctor._imageURL])) ? doctor._imageURL : '/images/user-solid.jpg';
            img.alt = "Imagen de doctor";
            img.title = (isset([doctor._name]) ? doctor._name: "Desconocido");
        }

        name = profileDoctor.querySelector('.name');
        if (name) name.textContent = (isset([doctor._name]) ? doctor._name: "Desconocido");
        
        email = profileDoctor.querySelector('.email');
        if (email) email.textContent = (isset([doctor._email]) ? doctor._email: "Desconocido");;
        
        let profilePatient = content.querySelector('.patient');
        img = profilePatient.querySelector('.image-profile');
        if (img) {
            img.src = (isset([patient._imageURL]) ? patient._imageURL : '/images/user-solid.jpg');
            img.alt = 'Imagen de Paciente';
            img.title = (isset([patient._name])) ? patient._name : 'Desconocido';
        }

        name = profilePatient.querySelector('.name');
        if (name) name.textContent = (isset([patient._name])) ? patient._name : 'Desconocido';

        email = profilePatient.querySelector('.email');
        if (email) email.textContent = (isset([patient._email])) ? patient._email : 'Desconocido';

        let buttonPrintMedicalRecord = content.querySelector('.button-print-medical-record');
        if (buttonPrintMedicalRecord) {
            buttonPrintMedicalRecord.dataset.id = medicalRecord._id;
            buttonPrintMedicalRecord.addEventListener('click', () => {printMedicalRecord(buttonPrintMedicalRecord.dataset.id)});
        }

        let buttonPrintRecipe = content.querySelector('.button-print-recipe');
        if (buttonPrintRecipe) {
            buttonPrintRecipe.dataset.id = appointments[i]._id;
            buttonPrintRecipe.addEventListener('click', () => {printRecipe(buttonPrintRecipe.dataset.id)});
        }

        const iframe = content.querySelector('iframe');
        if (iframe) {
            iframe.classList.add('skeleton');
            const xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (this.readyState != 4 && this.status != 200) return;
        
                if (!isJson(this.responseText)) {
                    return;
                }

                let data = JSON.parse(this.responseText);
                if (data && isset([data])) {
                    iframe.onload = function() {
                        iframe.classList.remove('skeleton');
                    };
                    iframe.src = `data:application/pdf;base64,${data}#zoom=FitH`;
                }
            }
            xhttp.open('post', 'http://localhost:5000/solicitud/registro-medico/obtener', true);
            xhttp.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            xhttp.setRequestHeader('Content-Type', 'application/json');
            xhttp.send(JSON.stringify({id: medicalRecord._id}));
        }

        container.appendChild(content);
    }
}

function printMedicalRecord(id) {
    if (!isset([id, containerHidden]) || isNaN(id)) return;

    const input = document.createElement('input');
    input.value = id;
    input.type = 'hidden';
    input.name = 'id';

    const form = document.createElement('form');
    form.method = 'post';
    form.target = '_blank';
    form.action = 'http://localhost:5000/solicitud/registro-medico/imprimir';

    containerHidden.innerHTML = '';
    containerHidden.appendChild(form);
    form.appendChild(input);
    form.submit();
    input.value = '';
}

function printRecipe(id) {
    if (!isset([id, containerHidden]) || isNaN(id)) return;
    if (!(appointments instanceof Array)) return;
    let appointment = appointments.find(appointment => Number(appointment._id) === Number(id));
    let recipe = ((appointment instanceof Object) && (appointment._medicalRecord instanceof Object)) ? appointment._medicalRecord._recipe : null;

    if (!(recipe instanceof Object)) {
        alert('Este registro medico no cuenta con receta medica.')
        return;
    }

    const input = document.createElement('input');
    input.name = 'id';
    input.type = 'hidden';
    input.value = recipe._id;
    
    const form = document.createElement('form');
    form.action = 'http://localhost:5000/solicitud/recetas/imprimir';
    form.method = 'post';
    form.target = '_blank';

    containerHidden.innerHTML = '';
    containerHidden.appendChild(form);
    form.appendChild(input);
    form.submit();
    input.value = '';
}