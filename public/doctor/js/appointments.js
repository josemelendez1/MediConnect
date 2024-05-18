import { socket } from "../../socket.js";
import { isset, reloadForm, verifyForm, isDate } from "../../form.js";
import { hideButton, hideModal, showButton, showModal } from "../../modal.js";
import { edit as editRecord, form as formRecord, save as saveRecord, buttonPrint as buttonPrintRecord } from "./record-medical.js";
import { edit as editRecipe, form as formRecipe, save as saveRecipe, buttonPrint as buttonPrintRecipe } from './recipe.js';

var appointments, diseases, medicines, doctor, patientCall, table, inputSeeker, dateSeeker, modal, modalCall, video, templateVideo, hideCall, selectDiseases, selectMedicines, buttonsHideModal, buttonPrint;
var buttonToggleMicrophone, buttonToggleCamera; 
export var buttonSaveRecord, buttonSaveRecipe; 

document.addEventListener("DOMContentLoaded", function() {
    table = document.getElementById("table-appointments");
    inputSeeker = document.getElementById("seeker-appointments");
    dateSeeker = document.getElementById("seeker-date-appointments");
    buttonPrint = document.getElementById("button-print-table");
    modal = document.getElementById("modal-record-recipe");
    modalCall = document.getElementById("modal-call");
    video = document.getElementById('video-data');
    templateVideo = modalCall.querySelector('.template-video');
    hideCall = document.getElementById('hide-call');
    buttonsHideModal = document.querySelectorAll('.close-modal-record-recipe');
    buttonToggleMicrophone = document.getElementById("toggle-microphone");
    buttonToggleCamera = document.getElementById("toggle-camera");
    selectDiseases = document.getElementById('select-diseases');
    selectMedicines = document.getElementById('select-medicines');
    buttonSaveRecord = document.getElementById('button-save-record');
    buttonSaveRecipe = document.getElementById('button-save-recipe');

    if (isset([table, inputSeeker, dateSeeker, modal, buttonsHideModal, selectDiseases, selectMedicines])) {
        skeleton();
        socket.on('appointment-eager/read', (data) => {
            appointments = data;
            read();
        });

        socket.on('doctor/session/read', (data) => {
            if (!(data instanceof Object)) return;
            doctor = data;
            read();
        });

        socket.on('reconnect-call', (patient) => {
            if (!(patient instanceof Object)) return;
            if (!(patientCall instanceof Object)) return;
            if (Number(patient._id) === Number(patientCall._id)) socket.timeout(2000).emit('call', patientCall, doctor, (error, response) => {});
        });
        
        socket.on('doctor/updated', (id) => {
            if (!isset([id]) || isNaN(doctor)) return;
            if (Number(id) === Number(doctor._id)) {
                socket.emit('doctor/session/read');
            }
        });

        socket.on('disease/read', (data) => {
            if (!isset([data])) return;
            diseases = data;
            optionsSelect();
        });

        socket.on('medicine/read', (data) => {
            if (!isset([data])) return;
            medicines = data;
            optionsSelect();
        });

        socket.emit('appointment-eager/read', false, (error, response) => {});
        socket.emit('doctor/session/read');
        socket.emit('disease/read', false, (error, response) =>{});
        socket.emit('medicine/read', false, (error, response) => {});

        inputSeeker.addEventListener("input", read);
        dateSeeker.addEventListener("input", read);
        if (buttonPrint) buttonPrint.addEventListener("click", function() {
            if (isset([dateSeeker.value])) {
                print();
            } else {
                alert("Seleccione una fecha en el campo de fechas.");
            }
        });

        buttonsHideModal.forEach(buttonHideModal => {
            buttonHideModal.addEventListener('click', function() {
                hideModal(modal);
                reloadForm(formRecord);
                reloadForm(formRecipe);
                document.body.style.overflow = "auto";
            });
        });

        if (buttonSaveRecord) buttonSaveRecord.addEventListener('click', function() {
            saveRecord(buttonSaveRecord.dataset.id);
        });

        if (buttonSaveRecipe) buttonSaveRecipe.addEventListener('click', function() {
            saveRecipe(buttonSaveRecipe.dataset.id);
        });
    }
})

function read() {
    if (!isset([appointments, doctor, table])) return;
    let data;
    let patient;
    const textSeeker = inputSeeker.value.trim().toLowerCase();
    const textDateSeeker = dateSeeker.value;
    data = appointments.filter(x => x._admission === true && (x._doctor instanceof Object) && Number(x._doctor._id) === Number(doctor._id));
    data.sort((a, b) => {return new Date(a._date).getHours() - new Date(b._date).getHours()});

    if (textSeeker.length > 0) {
        data = data.filter(x => x._type.toLowerCase().includes(textSeeker));
    }

    if (textDateSeeker.length > 0) {
        data = data.filter(x => x._date.includes(textDateSeeker));
    }

    table.innerHTML = '';
    
    for (let i = 0; i < data.length; i++) {
        if (!(data[i] instanceof Object)) continue; 
        
        patient = data[i]._patient;
        if (!(patient instanceof Object)) continue;

        let tr = document.createElement('tr');
        let td;
        let div, containerImage;
        let span;
        let img;
        let icon;
        let p;

        td = document.createElement('td');
        span = document.createElement('span');
        span.textContent = i + 1;
        td.appendChild(span);
        tr.appendChild(td);

        td = document.createElement('td');
        containerImage = document.createElement('div');
        img = document.createElement('img');

        containerImage.classList.add('image', 'skeleton');
        img.onload = function () {
            containerImage.classList.remove('skeleton');
            containerImage.appendChild(img);
        }

        img.src = (isset([patient._imageURL])) ? patient._imageURL : '/images/user-solid.jpg';
        img.title = (isset([patient._name])) ? patient._name : 'No hay información';
        img.alt = 'Imagen de Perfil';

        td.appendChild(containerImage);

        div = document.createElement('div');
        div.classList.add('profile-text');

        p = document.createElement('p');
        p.classList.add('name');
        p.textContent = (isset([patient._name])) ? patient._name : 'No hay información';
        div.appendChild(p);

        p = document.createElement('p');
        p.classList.add('email');
        p.textContent = (isset([patient._email])) ? patient._email : 'No hay información';
        div.appendChild(p);

        td.appendChild(div);
        tr.appendChild(td);

        td = document.createElement('td');
        span = document.createElement('span');
        span.classList.add('bg-gray');
        span.textContent = (isset([patient._telephone, patient._extensionTelephone])) ? `+${patient._extensionTelephone} ${patient._telephone}` : 'No hay información';
        td.appendChild(span);
        tr.appendChild(td);

        td = document.createElement('td');
        td.textContent = (isDate(data[i]._date)) ? new Date(data[i]._date).toLocaleDateString() : 'No especificada.';
        tr.appendChild(td);

        td = document.createElement('td');
        td.textContent = (isDate(data[i]._date)) ? new Date(data[i]._date).toLocaleTimeString() : 'No especificada.';
        tr.appendChild(td);

        td = document.createElement('td');
        span = document.createElement('span');
        span.classList.add('bg-green');
        span.textContent = (isset([data[i]._type])) ? data[i]._type : 'No especificada.';
        td.appendChild(span);
        tr.appendChild(td);

        td = document.createElement('td');
        icon = document.createElement('i');
        icon.classList.add('fa-solid', 'fa-ellipsis', 'show-record');
        icon.dataset.id = data[i]._id;
        td.appendChild(icon);
        tr.appendChild(td);

        td = document.createElement('td');
        icon = document.createElement('i');
        icon.classList.add('fa-solid', 'fa-phone', 'show-call');
        icon.dataset.id = data[i]._id;
        td.appendChild(icon);
        tr.appendChild(td);

        table.append(tr);
    }
    if (data.length > 0) {
        initClicksRecord();
        initClicksCall();
    }
}

function initClicksRecord() {
    const appointmentsElements = document.querySelectorAll('.show-record');
    appointmentsElements.forEach(element => {
        element.addEventListener('click', async () => {
            let id = element.dataset.id;
            buttonSaveRecord.dataset.id = id;
            buttonSaveRecipe.dataset.id = id;
            buttonPrintRecord.dataset.id = id;
            buttonPrintRecipe.dataset.id = id;
            showModal(modal);
            showProfiles(id);
            await editRecord(id);
            await editRecipe(id);
            document.body.style.overflow = "hidden";
        });
    });
}

function initClicksCall() {
    const calls = document.querySelectorAll('.show-call');
    if (calls) calls.forEach(element => {
        element.addEventListener('click', async () => {
            let id = element.dataset.id;
            call(id);
        });
    });
}

function skeleton() {
    if (!isset([table])) return;
    table.innerHTML = '';

    for (let i = 0; i < 10; i++) {
        let tr = document.createElement('tr');

        for (let j = 0; j < 8; j++) {
            let td = document.createElement('td');
            let div = document.createElement('div');

            td.append(div);
            tr.append(td);
        }
        
        tr.classList.add('skeleton');
        table.append(tr);
    }
}

function print() {
    if (!(doctor instanceof Object) || !isset([dateSeeker])) return;
    if (!isset([doctor._id, dateSeeker.value]) || isNaN(doctor._id) || !isDate(dateSeeker.value)) return;
    const container = document.getElementById('form-hidden');
    if (!container) return;

    const form = document.createElement('form');
    let input;

    form.method = 'post';
    form.action = '/citas/imprimir';
    form.target = '_blank';
    
    input = document.createElement('input');
    input.type = 'date';
    input.name = 'date';
    input.value = dateSeeker.value;

    form.appendChild(input);

    input = document.createElement('input');
    input.type = 'number';
    input.name = 'idDoctor';
    input.value = doctor._id;

    form.appendChild(input);
    
    container.innerHTML = '';
    container.appendChild(form);
    form.submit();
}

export function optionsSelect(diseasesSelected, medicinesSeleted) {
    let option;
    const selects = document.querySelectorAll(".mult-select-tag");
    if (selects) selects.forEach(select => {select.remove()});

    if ((diseases instanceof Array) && isset([selectDiseases])) {
        selectDiseases.innerHTML = '';
        for (let i = 0; i < diseases.length; i++) {
            option = document.createElement('option');
            option.value = diseases[i]._id;
            option.textContent = diseases[i]._name;
            selectDiseases.appendChild(option);
            if (diseasesSelected instanceof Array && diseasesSelected.some(x => Number(x) === Number(option.value))) option.selected = true;
        }

        new MultiSelectTag(selectDiseases.id, {placeholder: 'Buscar Enfermedad',rounded: true,});
    }
    
    if ((medicines instanceof Array) && isset([selectMedicines])) {
        selectMedicines.innerHTML = '';
        for (let i = 0; i < medicines.length; i++) {
            option = document.createElement('option');
            option.value = medicines[i]._id;
            option.textContent = medicines[i]._name;
            selectMedicines.appendChild(option);
            if (medicinesSeleted instanceof Array && medicinesSeleted.some(x => Number(x) === Number(option.value))) option.selected = true;
        }

        new MultiSelectTag(selectMedicines.id, {placeholder: 'Buscar Medicina',rounded: true});
    }
}

function showProfiles(id) {
    if (!isset([id]) || isNaN(id)) return;
    let patient, appointment;
    appointment = appointments.find(x => Number(x._id) === Number(id));
    if (appointment instanceof Object) patient = appointment._patient;
    if (!isset([appointment, doctor, patient])) return;

    let p, containerImagePatient, containerImageDoctor, imgPatient, imgDoctor, profile, div;

    const containersPatient = document.querySelectorAll('.group-patient');
    if (containersPatient) containersPatient.forEach(containerPatient => {
        containerPatient.innerHTML = '';
        p = document.createElement('p');
        p.textContent = 'Paciente';
        p.classList.add('legend-profile');
        containerPatient.appendChild(p);
        
        profile = document.createElement('div');
        profile.classList.add('profile');

        imgPatient = document.createElement('img');
        imgPatient.src = (isset([patient._imageURL])) ? patient._imageURL : '/images/user-solid.jpg';
        imgPatient.title = `Imagen de ${patient._name}.`;
        imgPatient.alt = `Imagen de ${patient._name}.`;

        containerImagePatient = document.createElement('div');
        containerImagePatient.classList.add('image');
        containerImagePatient.appendChild(imgPatient);
        profile.appendChild(containerImagePatient);
        
        div = document.createElement('div');
        div.classList.add('profile-text');

        p = document.createElement('p');
        p.textContent = patient._name;
        p.classList.add('name');
        div.appendChild(p);

        p = document.createElement('p');
        p.classList.add('email');
        p.textContent = patient._email;
        div.appendChild(p);

        profile.appendChild(div);
        containerPatient.appendChild(profile);
    });

    const containersDoctor = document.querySelectorAll('.group-doctor');
    if (containersDoctor) containersDoctor.forEach(containerDoctor => {
        containerDoctor.innerHTML = '';
        p = document.createElement('p');
        p.textContent = 'Doctor';
        p.classList.add('legend-profile');
        containerDoctor.appendChild(p);

        profile = document.createElement('div');
        profile.classList.add('profile');

        imgDoctor = document.createElement('img');
        imgDoctor.src = (isset([doctor._imageURL])) ? doctor._imageURL : '/images/user-solid.jpg';
        imgDoctor.title = `Imagen de ${doctor._name}.`;
        imgDoctor.alt = `Imagen de ${doctor._name}.`;

        containerImageDoctor = document.createElement('div');
        containerImageDoctor.classList.add('image');
        containerImageDoctor.appendChild(imgDoctor);
        profile.appendChild(containerImageDoctor);

        div = document.createElement('div');
        div.classList.add('profile-text');

        p = document.createElement('p');
        p.textContent = doctor._name;
        p.classList.add('name');
        div.appendChild(p);

        p = document.createElement('p');
        p.classList.add('email');
        p.textContent = doctor._email;
        div.appendChild(p);

        profile.appendChild(div);
        containerDoctor.appendChild(profile);
    });
}

async function call(id) {
    if (isset([id, modalCall, video, templateVideo, buttonToggleCamera, buttonToggleMicrophone, hideCall])) {
        let appointment = appointments.find(x => Number(x._id) === Number(id));
        if (!(appointment instanceof Object)) return;

        patientCall = appointment._patient;
        if (!(patientCall instanceof Object)) return;

        socket.timeout(2000).emit('call', patientCall, doctor, (error, response) => {});

        showModal(modalCall);
        document.body.style.overflow = "hidden";
        templateVideo.innerHTML = '';
        templateVideo.append(loadImageProfile());
        showPatientVideo(id);

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
            buttonToggleMicrophone.classList.add('disabled');
            buttonToggleMicrophone.innerHTML = '<i class="fa-solid fa-microphone-slash"></i>';
        }

        if (!allowedWebcamPermission || !hasCam) {
            templateVideo.classList.add('open');
            buttonToggleCamera.classList.add('disabled');
            buttonToggleCamera.innerHTML = '<i class="fa-solid fa-video-slash"></i>';
        }

        hideCall.addEventListener('click', () => {
            socket.emit('cancel-call', patientCall, doctor, (error, response) => {});
        });

        await media.getUserMedia(constraints).then(function(stream) {
            video.srcObject = stream;
            video.addEventListener('loadedmetadata', () => {video.play();});

            if (stream.getTracks().find(track => track.kind === "audio").enabled) {
                buttonToggleMicrophone.classList.remove('disabled');
                buttonToggleMicrophone.innerHTML = '<i class="fa-solid fa-microphone"></i>';
            }

            buttonToggleMicrophone.addEventListener('click', function() {
                toggleMultimedia('audio', stream, buttonToggleMicrophone, 
                '<i class="fa-solid fa-microphone"></i>', 
                '<i class="fa-solid fa-microphone-slash"></i>');
            });
            
            buttonToggleCamera.addEventListener('click', function() {
                toggleMultimedia('video', stream, buttonToggleCamera, 
                '<i class="fa-solid fa-video"></i>', 
                '<i class="fa-solid fa-video-slash"></i>');
            });

            socket.on('cancel-call', (patient, doc) => {
                if (!(patient instanceof Object) || !(doc instanceof Object)) return;
                if (!(patientCall instanceof Object) || !(doctor instanceof Object)) return;
                if (Number(patient._id) === Number(patientCall._id) && Number(doc._id) === Number(doctor._id)) {
                    hideModal(modalCall);
                    patientCall = null;
                    document.body.style.overflow = "auto";
                    stream.getTracks().forEach((track) => {track.stop()});
                }
            });
        }).catch((error) => {
            console.error(error);
            socket.on('cancel-call', (patient, doc) => {
                if (!(patient instanceof Object) || !(doc instanceof Object)) return;
                if (!(patientCall instanceof Object) || !(doctor instanceof Object)) return;
                if (Number(patient._id) === Number(patientCall._id) && Number(doc._id) === Number(doctor._id)) {
                    hideModal(modalCall);
                    patientCall = null;
                    document.body.style.overflow = "auto";
                }
            });
        });
        
        socket.on('acept-call', (patient, doctorCall, roomId) => {
            if (!isset([roomId])) return;
            if (!(patient instanceof Object) || !(doctorCall instanceof Object)) return;
            if (!(patientCall instanceof Object) || !(doctor instanceof Object)) return;
            if (Number(patient._id) === Number(patientCall._id) && Number(doctorCall._id) === Number(doctor._id)) {
                redirectCallRoom(roomId);
            }
        });
    }
}

function toggleMultimedia(target, stream, button, innerHTMLenabled, innerHTMLdisabled) {
    let track = stream.getTracks().find(track => track.kind === target);
    track.enabled = !track.enabled;
    button.innerHTML = (track.enabled) ? innerHTMLenabled : innerHTMLdisabled;

    if (track.enabled) {
        if (target === 'video') {
            video.style.opacity = 1;
            templateVideo.classList.remove('open');
        }
        button.classList.remove('disabled');
    } else {
        if (target === 'video') {
            video.style.opacity = 0;
            templateVideo.classList.add('open');
        }
        button.classList.add('disabled');
    }
}

function loadImageProfile() {
    let containerImage = document.createElement('div');
    let img = document.createElement('img');
    
    img.onload = function () {
        containerImage.classList.remove('skeleton-loading');
        containerImage.appendChild(img);
    }

    containerImage.classList.add('image', 'skeleton-loading');
    img.src = (doctor instanceof Object && isset([doctor._imageURL])) ? doctor._imageURL : '/images/user-solid.jpg';
    img.alt = 'Imagen de Doctor';
    img.title = (doctor instanceof Object && isset([doctor._name])) ? doctor._name : 'Desconocido';

    return containerImage;
}

function showPatientVideo(id) {
    if (!isset([id]) || isNaN(id)) return;
    if (!(appointments instanceof Array)) return;
    
    let appointment = appointments.find(x => Number(x._id) === Number(id));
    if (!(appointment instanceof Object)) return;
    
    let patient = appointment._patient;
    if (!(patient instanceof Object)) return;
    
    let profilePatient = modalCall.querySelector('.profile-call-person');
    if (profilePatient && modalCall) {
        profilePatient.innerHTML = '';
        let containerImage = document.createElement('div');
        let img = document.createElement('img');

        containerImage.classList.add('image', 'skeleton-loading');

        img.onload = function () {
            containerImage.classList.remove('skeleton-loading');
            containerImage.appendChild(img);
        }
        img.src = (isset([patient._imageURL])) ? patient._imageURL : '/images/user-solid.jpg';
        img.title = (isset([patient._name])) ? patient._name : 'Desconocido';
        img.alt = 'Imagen de usuario';

        profilePatient.appendChild(containerImage);

        let name = document.createElement('p');
        name.textContent = (isset([patient._name])) ? patient._name : 'Desconocido';
        name.classList.add('name');

        profilePatient.appendChild(name);
    }

    let dateCall = modalCall.querySelector('.date-call');
    if (dateCall) dateCall.textContent = `Fecha de llamada: ${new Date().toLocaleString()}`;
}

function redirectCallRoom(roomId) {
    const container = document.getElementById('form-hidden');
    const form = document.createElement('form');
    form.target = '_blank';
    form.method = 'POST';
    form.action = 'http://localhost:5000/sala';

    let input = document.createElement('input');
    input.type = 'hidden';
    input.value = roomId;
    input.name = 'room';
    form.appendChild(input);

    input = document.createElement('input');
    input.type = 'hidden';
    input.value = (doctor instanceof Object) ? JSON.stringify(doctor) : null;
    input.name = 'user';
    form.appendChild(input);

    container.innerHTML = '';
    container.appendChild(form);

    form.submit();
    input.value = '';
}

export { diseases, appointments };