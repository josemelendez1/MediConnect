import { socket } from "../../socket.js";
import { ajax, hideMessage, message } from "../../ajax.js";
import { isset, reloadForm, verifyForm, isDate } from "../../form.js";
import { hideButton, hideModal, showButton, showModal } from "../../modal.js";
import { ERROR, NOT_ALLOWED, NOT_VERIFIED, SUCCESS } from "../../codes.js";

var appointments, patients, doctors, containerDays, containerRequests, tableDays, tableRequests, inputSeeker, dateSeeker, modal, form, messageForm, title, listPatients, listDoctors, buttonShowModal, buttonShowDays, buttonShowRequests, buttonHideModal, buttonCreate, buttonUpdate, buttonDelete;

document.addEventListener('DOMContentLoaded', function() {
    containerDays = document.querySelector('.table-days');
    containerRequests = document.querySelector('.table-requests');
    tableDays = document.getElementById('table-appointments-days');
    tableRequests = document.getElementById('table-appointments-requests');
    inputSeeker = document.getElementById('seeker-appointments');
    dateSeeker = document.getElementById('date-appointments');
    modal = document.getElementById('modal-appointments');
    form = document.getElementById('form-appointments');
    title = document.getElementById('title-appointments');
    buttonShowDays = document.getElementById('show-tab-days');
    buttonShowRequests = document.getElementById('show-tab-requests');
    buttonShowModal = document.getElementById('button-show-modal');
    buttonHideModal = document.getElementById('button-hide-modal');
    messageForm = document.getElementById('message-appointments');
    listPatients = document.getElementById('patient-list');
    listDoctors = document.getElementById('doctor-list');
    buttonCreate = document.getElementById('button-create-appointments');
    buttonUpdate = document.getElementById('button-update-appointments');
    buttonDelete = document.getElementById('button-delete-appointments');

    if (isset([containerDays, containerRequests, tableDays, tableRequests, inputSeeker, dateSeeker, modal, form, title, listPatients, listDoctors, buttonShowModal, buttonShowDays, buttonShowRequests, buttonShowRequests, buttonHideModal, buttonCreate, buttonDelete, buttonUpdate])) {
        socket.on('appointment-eager/read', (data) => {
            if (data instanceof Array) {
                appointments = data;
                read();
                list('doctor')
            }
        });

        socket.on('patient/read', (data) => {
            if (data instanceof Array) {
                patients = data;
                list('patient');
            }
        });

        socket.on('doctor/read', (data) => {
            if (data instanceof Array) {
                doctors = data;
                list('doctor');
            }
        });

        socket.emit('appointment-eager/read', false, (error, response) => {});
        socket.emit('patient/read', false, (error, response) => {});
        socket.emit('doctor/read', false, (error, response) => {})

        buttonShowDays.addEventListener('click', function () {
            if (buttonShowDays.classList.contains('active')) return;
            buttonShowDays.classList.add('active');
            buttonShowRequests.classList.remove('active');
            containerDays.classList.add('active');
            containerRequests.classList.remove('active');
            skeleton(tableDays);
            read();
        });

        buttonShowRequests.addEventListener('click', function () {
            if (buttonShowRequests.classList.contains('active')) return;
            buttonShowDays.classList.remove('active');
            buttonShowRequests.classList.add('active');
            containerDays.classList.remove('active');
            containerRequests.classList.add('active');
            skeleton(tableRequests);
            read();
        });

        buttonShowDays.click();

        buttonShowModal.addEventListener('click', function() {
            let elements = document.forms.namedItem(form.id).elements;
            elements.namedItem('patient').disabled =  false;
            elements.namedItem('type').disabled =  false;
            reloadForm(form);
            hideButton(buttonUpdate);
            hideButton(buttonDelete);
            showButton(buttonCreate);
            showModal(modal);
            document.body.style.overflow = 'hidden';
        });

        buttonHideModal.addEventListener('click', function() {
            hideModal(modal);
            reloadForm(form);
            hideMessage(messageForm);
            document.body.style.overflow = 'auto';
        });

        buttonCreate.addEventListener('click', function() {
            if (verifyForm(form)) create();
        });

        buttonUpdate.addEventListener('click', function() {
            if (verifyForm(form)) update(buttonUpdate.dataset.id);
        });

        buttonDelete.addEventListener('click', function() {
            remove(buttonDelete.dataset.id);
        });

        inputSeeker.addEventListener('input', function () {
            read();
        });

        dateSeeker.addEventListener('input', function () {
            read();
        });
    }
});

function create() {
    if (!isset([form])) return;
    const elements = document.forms.namedItem(form.id).elements;

    if (!isset([elements])) return;
    if (!isset([elements.namedItem('patient'), elements.namedItem('doctor'), elements.namedItem('type'), elements.namedItem('reason'), elements.namedItem('date'), elements.namedItem('time')])) return;
    if (isNaN(elements.namedItem('patient').value) || isNaN(elements.namedItem('doctor').value)) return;
    if (!isDate(elements.namedItem('date').value)) return;

    const date = new Date(elements.namedItem('date').value);
    const dateAppointment = `${date.getFullYear()}-${('0' + (date.getMonth() + 1)).slice(-2)}-${('0' + (date.getDate())).slice(-2)}T${elements.namedItem('time').value}`;

    const data = {
        'idPatient': elements.namedItem('patient').value,
        'idDoctor': elements.namedItem('doctor').value,
        'type': elements.namedItem('type').value,
        'date': dateAppointment,
        'reason': elements.namedItem('reason').value,
        'admission': elements.namedItem('permission').checked,
    };

    const code = ajax('post', 'http://localhost:5000/solicitud/citas/crear', data);
    if (isNaN(code)) return;
    switch (code) {
        case SUCCESS:
            message(messageForm, 
            `<i class="fa-solid fa-check" style="color: green;"></i>
            <p>Cita creada exitosamente.</p>`);
            setTimeout(() => {
                hideMessage(messageForm);
                reloadForm(form);
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

function read() {
    if (!isset([appointments])) return;
    let data;
    let patient;
    let doctor;
    const textSeeker = inputSeeker.value.trim().toLowerCase();
    const textDateSeeker = dateSeeker.value;

    if (containerDays.classList.contains('active')) {
        if (!isset([tableDays])) return;
        data = appointments.filter(x => x._admission === true);
        data.sort((a, b) => {return new Date(a._date).getHours() - new Date(b._date).getHours()});

        if (textSeeker.length > 0) {
            data = data.filter(x => x._type.toLowerCase().includes(textSeeker));
        }

        if (textDateSeeker.length > 0) {
            data = data.filter(x => x._date.includes(textDateSeeker));
        } else {
            data = data.filter(x => new Date(x._date) > new Date());
        }

        if (buttonShowDays) {
            const count = buttonShowDays.querySelector('.appointments-count');
            if (count) count.textContent = `${data.length} citas`;

            const dateTab = buttonShowDays.querySelector('.appointments-date');
            if (dateTab) dateTab.textContent = (dateSeeker && dateSeeker.value.length > 0) ? dateSeeker.value : 'Todas las citas';
        }

        tableDays.innerHTML = '';

        for (let i = 0; i < data.length; i++) {
            if (!(data[i] instanceof Object)) continue;
            
            patient = data[i]._patient;
            doctor = data[i]._doctor;

            if (!(patient instanceof Object) || !(doctor instanceof Object)) continue;

            let tr = document.createElement('tr');
            let td;
            let div, containerImagePatient, containerImageDoctor;
            let span;
            let imgPatient, imgDoctor;
            let icon;
            let p;

            td = document.createElement('td');
            span = document.createElement('span');
            span.textContent = i + 1;
            td.appendChild(span);
            tr.appendChild(td);

            td = document.createElement('td');
            containerImagePatient = document.createElement('div');
            imgPatient = document.createElement('img');

            containerImagePatient.classList.add('image', 'skeleton');
            imgPatient.onload = function () {
                containerImagePatient.classList.remove('skeleton');
                containerImagePatient.appendChild(imgPatient);
            }

            imgPatient.src = (isset([patient._imageURL])) ? patient._imageURL : '/images/user-solid.jpg';
            imgPatient.title = (isset([patient._name])) ? patient._name : 'No hay información';
            imgPatient.alt = 'Imagen de Perfil';

            td.appendChild(containerImagePatient);

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

            td =  document.createElement('td');
            containerImageDoctor = document.createElement('div');
            imgDoctor = document.createElement('img');

            containerImageDoctor.classList.add('image', 'skeleton');
            imgDoctor.onload = function () {
                containerImageDoctor.classList.remove('skeleton');
                containerImageDoctor.appendChild(imgDoctor);
            }

            imgDoctor.src = (isset([doctor._imageURL])) ? doctor._imageURL : '/images/user-solid.jpg';
            imgDoctor.title = (isset([doctor._name])) ? doctor._name : 'No hay información';
            imgDoctor.alt = 'Imagen de Perfil';

            td.appendChild(containerImageDoctor);

            div = document.createElement('div');
            div.classList.add('profile-text');

            p = document.createElement('p');
            p.classList.add('name');
            p.textContent = (isset([doctor._name])) ? doctor._name : 'No hay información';
            div.appendChild(p);

            p = document.createElement('p');
            p.classList.add('email');
            p.textContent = (isset([doctor._email])) ? doctor._email : 'No hay información';
            div.appendChild(p);

            td.appendChild(div);
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
            icon.classList.add('fa-solid', 'fa-ellipsis', 'show-appointment');
            icon.dataset.id = data[i]._id;
            td.appendChild(icon);
            tr.appendChild(td);

            tableDays.append(tr);
        }
        if (data.length > 0) initClicksEdit();
    } else if (containerRequests.classList.contains('active')) {
        if (!isset([tableRequests])) return;
        data = appointments.toReversed().filter(x => x._admission === false);

        if (textSeeker.length > 0) {
            data = data.filter(x => x._type.toLowerCase().includes(textSeeker));
        }

        if (textDateSeeker.length > 0) {
            data = data.filter(x => x._date.includes(textDateSeeker));
        }

        if (buttonShowRequests) {
            const count = buttonShowRequests.querySelector('.appointments-count');
            if (count) count.textContent = `${data.length} citas`;
        }

        tableRequests.innerHTML = '';
        
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
            icon.classList.add('fa-solid', 'fa-ellipsis', 'show-appointment');
            icon.dataset.id = data[i]._id;
            td.appendChild(icon);
            tr.appendChild(td);

            tableRequests.append(tr);
        }
        if (data.length > 0) initClicksEdit();
    }
}

function update(id) {
    if (!isset([form])) return;
    if (!isset([id]) || isNaN(id)) return;

    const elements = document.forms.namedItem(form.id).elements;

    if (!isset([elements])) return;
    if (!isset([elements.namedItem('patient'), elements.namedItem('doctor'), elements.namedItem('type'), elements.namedItem('reason'), elements.namedItem('date'), elements.namedItem('time')])) return;
    if (isNaN(elements.namedItem('patient').value) || isNaN(elements.namedItem('doctor').value)) return;
    if (!isDate(elements.namedItem('date').value)) return;

    const date = new Date(elements.namedItem('date').value.replace(/-/g, '\/'));
    const dateAppointment = `${date.getFullYear()}-${('0' + (date.getMonth() + 1)).slice(-2)}-${('0' + (date.getDate())).slice(-2)}T${elements.namedItem('time').value}`;

    const data = {
        'id': id,
        'idDoctor': elements.namedItem('doctor').value,
        'date': dateAppointment,
        'reason': elements.namedItem('reason').value,
        'admission': elements.namedItem('permission').checked,
    };

    const code = ajax('post', 'http://localhost:5000/solicitud/citas/actualizar', data);
    if (isNaN(code)) return;
    switch (code) {
        case SUCCESS:
            message(messageForm, 
            `<i class="fa-solid fa-check" style="color: green;"></i>
            <p>Cita actualizada exitosamente.</p>`);
            setTimeout(async () => {
                hideMessage(messageForm);
                await socket.timeout(2000).emit('appointment-eager/read', true, (error, response) => {
                    socket.emit('appointment/updated', (Number(id)));
                });
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

function remove(id) {
    if (!isset([id]) || isNaN(id)) return;
    const code = ajax('post', 'http://localhost:5000/solicitud/citas/eliminar', {'id': id});
    if (isNaN(code)) return;
    switch (code) {
        case SUCCESS:
            message(messageForm, 
                `<i class="fa-solid fa-check" style="color: green;"></i>
                <p>Cita eliminada exitosamente.</p>`);
            setTimeout(async () => {
                hideModal(modal);
                hideMessage(messageForm);
                reloadForm(form);
                document.body.style.overflow = 'auto';
                await socket.timeout(2000).emit('appointment-eager/read', true, (error, response) => {
                    socket.emit('appointment/deleted', (Number(id)));
                });
            }, 3000);
            break;

        case ERROR:
            message (messageForm, 
            `<i class="fa-solid fa-triangle-exclamation" style="color: red;"></i>
            <p>Error en el servidor. Contáctenos si este persiste.</p>`);
            setTimeout(() => { hideMessage(messageForm); }, 3000);
            break;
    }
}

function edit(id) {
    if (!isset([id, modal, form, form.id]) || isNaN(id)) return;

    const elements = document.forms.namedItem(form.id).elements;
    const appointment = appointments.find(x => Number(x._id) === Number(id));

    if (!(appointment instanceof Object)) return;
    if (!(appointment._patient instanceof Object)) return;
    if (!isset([appointment._id, appointment._type, appointment._date, appointment._reason])) return;
    if (isNaN(appointment._id) || isNaN(appointment._patient._id)) return;
    if (!isDate(appointment._date)) return;

    const date = new Date(appointment._date);

    elements.namedItem('patient').value = appointment._patient._id;
    elements.namedItem('patient').disabled =  true;
    elements.namedItem('doctor').value = ((appointment._doctor instanceof Object) && !isNaN(appointment._doctor._id)) ? appointment._doctor._id : '';
    elements.namedItem('type').value = appointment._type;
    elements.namedItem('type').disabled =  true;
    elements.namedItem('date').value = date.getFullYear() + '-' + ("0" + (date.getMonth() + 1)).slice(-2) + '-' + ("0" + date.getDate()).slice(-2);
    elements.namedItem('time').value = `${('0' + (date.getHours())).slice(-2)}:00`;
    elements.namedItem('reason').value = appointment._reason;
    elements.namedItem('permission').checked = appointment._admission;

    buttonUpdate.dataset.id = id;
    buttonDelete.dataset.id = id;

    showButton(buttonUpdate);
    showButton(buttonDelete);
    hideButton(buttonCreate);

    showModal(modal);
    document.body.style.overflow = 'hidden';
}

function initClicksEdit() {
    const appointmentsElements = document.querySelectorAll('.show-appointment');
    appointmentsElements.forEach(element => {
        element.addEventListener('click', () => { edit(element.dataset.id); });
    });
}

function skeleton(tbdoy) {
    if (!isset([tbdoy])) return;
    tbdoy.innerHTML = '';

    for (let i = 0; i < 10; i++) {
        let tr = document.createElement('tr');

        for (let j = 0; j < 7; j++) {
            let td = document.createElement('td');
            let div = document.createElement('div');

            td.append(div);
            tr.append(td);
        }
        
        tr.classList.add('skeleton');
        tbdoy.append(tr);
    }
}

function list(target) {
    if (!isset([target])) return;
    let option;
    switch (target) {
        case 'patient':
            if (!isset([patients]) || !(patients instanceof Array)) return;

            option = document.createElement('option');
            option.value = '';
            option.textContent = 'Selecciona un paciente';
            option.selected = true;
            option.disabled = true;
            option.hidden = true;
            listPatients.appendChild(option);

            for (let i = 0; i < patients.length; i++) {
                if (!(patients[i] instanceof Object)) continue;
                if (!isset([patients[i]._id, patients[i]._name, patients[i]._telephone])) continue;
                option = document.createElement('option');
                option.value = patients[i]._id;
                option.textContent = `${patients[i]._name} - ${patients[i]._telephone}`;
                listPatients.appendChild(option);
            }
            break;
        case 'doctor':
            if (!isset([doctors]) || !(doctors instanceof Array)) return;
            
            option = document.createElement('option');
            option.value = '';
            option.textContent = 'Selecciona un doctor';
            option.selected = true;
            option.disabled = true;
            option.hidden = true;
            listDoctors.appendChild(option);

            for (let i = 0; i < doctors.length; i++) {
                if (!(doctors[i] instanceof Object)) continue;
                if (!isset([doctors[i]._id, doctors[i]._name, doctors[i]._idNumber])) continue;
                option = document.createElement('option');
                option.value = doctors[i]._id;
                option.textContent = `${doctors[i]._name} - ${doctors[i]._idNumber}`;
                listDoctors.appendChild(option);
            }
            break; 
    }
}