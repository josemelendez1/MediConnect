import { socket } from "../../socket.js";
import { ajax, hideMessage, message } from "../../ajax.js";
import { NOT_ALLOWED, SUCCESS, ERROR, NOT_VERIFIED } from "../../codes.js";
import { isDate, isset, reloadForm, verifyForm } from "../../form.js"

var header, dates, navs, prev, next, elementDateSelected, form, messageForm, buttonCreate, buttonCancel, content;
const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
var date = new Date(), dateSelected;
var month = date.getMonth();
var year = date.getFullYear();
var patient, patientEagle, appointment;

document.addEventListener('DOMContentLoaded', () => {
    header = document.getElementById('title-calendar');
    dates = document.querySelector('.dates-month');
    prev = document.getElementById('prev-calendar');
    next = document.getElementById('next-calendar');
    elementDateSelected = document.getElementById('date-selected');
    buttonCreate = document.getElementById('button-create-data');
    buttonCancel = document.getElementById('button-cancel-appointment');
    form = document.getElementById('form-appointment');
    messageForm = document.getElementById('message-form');
    content = document.getElementById('content-appointment-patient');

    if (header && dates && prev && next && isset([months, date, month, year])) {
        initCalendar();

        socket.on('patient/session/read', (data) => {
            if (data instanceof Object) {
                patient = data;
                socket.emit('appointment-patient-eager/read', patient._id, false, (error, response) => {});
            }
        });

        socket.on('appointment-patient-eager/read', (data) => {
            if (data instanceof Object) {
                patientEagle = data;
                edit();
            }
        });

        socket.on('appointment/updated', (id) => {
            if (!isset([id]) || isNaN(id)) return;
            if (!(appointment instanceof Object)) return;
            if (!(patient instanceof Object)) return;
            if (Number(appointment._id) === Number(id)) socket.emit('appointment-patient-eager/read', patient._id, false, (error, response) => {});
        });

        socket.on('appointment/deleted', (id) => {
            if (!isset([id]) || isNaN(id)) return;
            if (!(appointment instanceof Object)) return;
            if (Number(appointment._id) === Number(id)) {
                const container = document.querySelector('.container-appointment');
                if (container && container.classList.contains('active')) container.classList.remove('active');
            }
        });
    
        prev.addEventListener('click', () => {
            if (month === 0) {
                year--;
                month = 11;
            } else {
                month--;
            }
            
            initCalendar();
        });

        next.addEventListener('click', () => {
            if (month === 11) {
                year++;
                month = 0;
            } else {
                month++;
            }

            initCalendar();
        });

        if (buttonCreate) buttonCreate.addEventListener('click', function () {
            if (verifyForm(form)) create();
        });

        if (buttonCancel) buttonCancel.addEventListener('click', function () {
            remove();
        });
    }
});

function initCalendar() {
    const start = new Date(year, month, 1).getDay();
    const endDate = new Date(year, month + 1, 0).getDate();
    const end = new Date(year, month, endDate).getDay();
    const endDatePrev = new Date(year, month, 0).getDate();
    

    let content = '';
    for (let i = start; i > 0; i--) {
        content += `<li class="inactive">${endDatePrev - i + 1}</li>`
    }

    for (let i = 1; i <= endDate; i++) {
        let className = '';

        if (i === date.getDate() && month === new Date().getMonth() && year === new Date().getFullYear()) {
            className = 'today';
        } else if (year < new Date().getFullYear() || (month < new Date().getMonth() && year <= new Date().getFullYear()) || (i < new Date().getDate() && month <= new Date().getMonth() && year <= new Date().getFullYear())) {
            className = 'inactive';
        }

        content += `<li class="${className}">${i}</li>`
    }

    for (let i = end; i < 6; i++) {
        content += `<li class="inactive">${i - end + 1}</li>`   
    }

    dates.innerHTML = content;
    header.textContent = `${months[month]} ${year}`;
    initDays();
}

function initDays() {
    if (!dates) return;
    const days = dates.querySelectorAll('li:not(.inactive)');
    if (days) days.forEach(element => {
        element.addEventListener('click', function() {
            if (!isset([element.textContent]) || isNaN(element.textContent)) return;
            dateSelected = new Date();
            dateSelected.setFullYear(year);
            dateSelected.setMonth(month);
            dateSelected.setDate(Number(element.textContent));
            elementDateSelected.textContent = `Fecha seleccionada: ${dateSelected.toLocaleDateString()}`;

            days.forEach(element => { if (element.classList.contains('selected')) element.classList.remove('selected') });
            element.classList.add('selected');
        }); 
    });
}

function create() {
    if (!form || !isset([form.id])) return;
    if (!isset([dateSelected]) || !isDate(dateSelected)) {
        message(messageForm, 
        `<i class="fa-regular fa-calendar-xmark" style="color: red;"></i>
        <p>Seleccione una fecha en el calendario</p>`);
        return;
    } else {
        hideMessage(messageForm);
    }
    
    const elements = document.forms.namedItem(form.id).elements;
    const dateAppointment = `${dateSelected.getFullYear()}-${('0' + (dateSelected.getMonth() + 1)).slice(-2)}-${('0' + (dateSelected.getDate())).slice(-2)}T${elements.namedItem('time').value}`;
    const data = {
        'idPatient': patient._id,
        'type': elements.namedItem('type').value,
        'date': dateAppointment,
        'reason': elements.namedItem('reason').value
    };

    const code = ajax('post', 'http://localhost:5000/solicitud/citas/crear', data);

    if (isNaN(code)) return;
    switch (code) {
        case SUCCESS:
            message(messageForm, 
            `<i class="fa-solid fa-check" style="color: green;"></i>
            <p>Cita creada exitosamente.</p>`);
            setTimeout(async () => {
                hideMessage(messageForm);
                reloadForm(form);
                await socket.timeout(2000).emit('appointment-patient-eager/read', patient._id, true, (error, response) => {});
                socket.emit('appointment-eager/read', true, (error, response) => {});
            }, 3000);
            break;

        case NOT_VERIFIED:
            message(messageForm, 
            `<i class="fa-regular fa-calendar-xmark" style="color: red;"></i>
            <p>Solo se permite una cita por paciente.</p>`);
            break;

        case NOT_ALLOWED:
            message(messageForm, 
            `<i class="fa-regular fa-calendar-xmark" style="color: red;"></i>
            <p>Seleccione una fecha mayor o igual que la actual.</p>`);
            break;

        case ERROR:
            message (messageForm, 
            `<i class="fa-solid fa-triangle-exclamation" style="color: red;"></i>
            <p>Error en el servidor. Contáctenos si este persiste.</p>`);
            break;
    }
}

function remove() {
    if (!isset([buttonCancel, buttonCancel.dataset.id]) || isNaN(buttonCancel.dataset.id)) return;
    const code = ajax('post', 'http://localhost:5000/solicitud/citas/eliminar', {'id': buttonCancel.dataset.id});
    if (isNaN(code)) return;
    switch (code) {
        case SUCCESS:
            const container = document.querySelector('.container-appointment');
            if (container && container.classList.contains('active')) container.classList.remove('active');
            socket.emit('appointment-eager/read', true, (error, response) => {});
            break;
        case ERROR:
            alert('Error en el servidor. Contáctenos si este persiste.');
            break;
    }
}

function edit() {
    if (!(patientEagle instanceof Object)) return;
    if (!(patientEagle._appointments instanceof Array)) return;

    let appointments = patientEagle._appointments.filter(a => (a instanceof Object) && new Date(a._date) >= new Date());
    appointments.sort((a, b) => {return new Date(b._date).getTime() - new Date(a._date).getTime()})
    appointment = appointments[0];
    if (!(appointment instanceof Object)) return;

    buttonCancel.dataset.id = appointment._id;
     
    const profilePatient = content.querySelector('.profile-patient');
    if (profilePatient) {
        const img = profilePatient.querySelector('img');
        if (img) {
            img.src = (isset([patientEagle._imageURL])) ? patientEagle._imageURL : '/images/user-solid.jpg';
            img.title = patientEagle._name;
        }

        const name = profilePatient.querySelector('.name');
        if (name) name.textContent = patientEagle._name;

        const email = profilePatient.querySelector('.email');
        if (email) email.textContent = patientEagle._email;
    }

    let doctor = appointment._doctor;
    if (doctor instanceof Object) {
        const profileDoctor = content.querySelector('.profile-doctor');
        if (profileDoctor) {
            const img = profileDoctor.querySelector('img');
            if (img) {
                img.src = (isset([doctor._imageURL])) ? doctor._imageURL : '/images/user-solid.jpg';
                img.title = doctor._name;
            }

            const name = profileDoctor.querySelector('.name');
            if (name) name.textContent = doctor._name;

            const email = profileDoctor.querySelector('.email');
            if (email) email.textContent = doctor._email;
        }
    }

    const type = content.querySelector('#type-appointment');
    if (type) type.textContent = appointment._type;

    const state = content.querySelector('#state-appointment');
    if (state) state.textContent = (appointment._admission) ? 'Activo' : 'En espera';

    const date = content.querySelector('#date-appointment');
    if (date) date.textContent = (isDate(appointment._date)) ? new Date(appointment._date).toLocaleDateString() : 'Fecha desconocida';

    const time = content.querySelector('#time-appointment');
    if (time) time.textContent = (isDate(appointment._date)) ? new Date(appointment._date).toLocaleTimeString() : 'Tiempo desconocido';

    const description = content.querySelector('#description-appointment');
    if (description) description.textContent = appointment._reason;

    const container = document.querySelector('.container-appointment');
    if (container && !container.classList.contains('active')) container.classList.add('active');
}