import { ajax, ajaxMultipart, hideMessage, message } from "../../ajax.js";
import { hideButton, hideModal, showButton, showModal } from "../../modal.js";
import { SUCCESS, NOT_ALLOWED, ERROR, NOT_NUMBER } from "../../codes.js";
import { buttonDisabled, buttonEnabled, isDate, isset, reloadField, reloadForm, verifyForm, verifyImage } from "../../form.js";
import { socket } from "../../socket.js";

const limit = 5;
var doctors, form, title, table, modal, messageForm, countDoctors, inputSeeker, buttonCreate, buttonUpdate, buttonDelete, buttonShowModal, buttonHideModal, template;

document.addEventListener("DOMContentLoaded", function() {
    form = document.getElementById('form-doctors');
    title = document.getElementById('title-doctors');
    table = document.getElementById('table-doctors');
    modal = document.getElementById('modal-doctors');
    messageForm = document.getElementById('message-doctors');
    countDoctors = document.getElementById('count-doctors');
    inputSeeker = document.getElementById('seeker-doctors');
    buttonCreate = document.getElementById('button-create-doctors');
    buttonUpdate = document.getElementById('button-update-doctors');
    buttonDelete = document.getElementById('button-delete-doctors');
    buttonShowModal = document.getElementById('button-show-modal-doctors');
    buttonHideModal = document.getElementById('button-hide-modal-doctors');
    template = document.getElementById('template-doctor');

    if (form && title && modal && table && messageForm && countDoctors && inputSeeker && buttonCreate && buttonUpdate && buttonDelete && buttonShowModal && buttonHideModal && template) {
        skeleton();
        placeImage();
        socket.on('doctor/read', (data) => {;
            if (!(data instanceof Array)) return;    
            doctors = data;
            setTimeout(read, 500);
        });
        
        socket.on('doctor/updated', (id) => {
            if (!isset([id])) return;
            if (!modal.classList.contains('modal-open')) return;
            if (buttonUpdate.classList.contains('button-none')) return;
            if (!isset([buttonUpdate.dataset.id]) || isNaN(buttonUpdate.dataset.id)) return;
        
            if (id.toString() === buttonUpdate.dataset.id.toString()) {
                edit(id);
            }
        });
        
        socket.on('doctor/deleted', (id) => {
            if (!isset([id])) return;
            if (!modal.classList.contains('modal-open')) return;
            if (buttonDelete.classList.contains('button-none')) return;
            if (!isset([buttonDelete.dataset.id]) || isNaN(buttonDelete.dataset.id)) return;
            
            if (id.toString() === buttonDelete.dataset.id.toString()) {
                message( messageForm,
                    `<i class="fa-solid fa-check" style="color: green;"></i>
                    <p>Doctor eliminado exitosamente.</p>`
                );
                buttonDisabled(buttonUpdate);
                buttonDisabled(buttonDelete);
                setTimeout(() => {
                    hideModal(modal);
                    reloadForm(form);
                    buttonEnabled(buttonUpdate);
                    buttonEnabled(buttonDelete);
                    setTimeout(() => {
                        hideMessage(messageForm);
                    }, 300);
                    document.body.style.overflow = 'auto';
                }, 2000);
            }
        });

        socket.emit('doctor/read', false, (error, response) => {});

        buttonShowModal.addEventListener('click', function() {
            document.body.style.overflow = 'hidden';
            showButton(buttonCreate);
            hideButton(buttonDelete);
            hideButton(buttonUpdate);
            reloadForm(form);
            hideMessage(messageForm);
            title.innerHTML = 'Nuevo Doctor';
            const image = form.querySelector('.image-form');
            if (image) image.src = '/images/user-solid.jpg';
            showModal(modal);
        });

        buttonHideModal.addEventListener('click', function() {
            document.body.style.overflow = 'auto';
            hideModal(modal);
            reloadForm(form);
            hideMessage(messageForm);
        });

        buttonCreate.addEventListener('click', function() {
            if (!buttonCreate.classList.contains('is-disabled') && verifyForm(form)) {
                create();
            }
        });

        buttonDelete.addEventListener('click', function() {
            remove(buttonDelete.dataset.id);
        });

        buttonUpdate.addEventListener('click', function() {
            if (!buttonUpdate.classList.contains('is-disabled') && verifyForm(form)) {
                update(buttonUpdate.dataset.id);
            }
        });

        inputSeeker.addEventListener('input', function() {
            read();
        });
    }
});

function create() {
    const elements = document.forms.namedItem(form.id).elements;
    const formData = new FormData();
    formData.append('name', elements.namedItem('name').value);
    formData.append('email', elements.namedItem('email').value);
    formData.append('pass', elements.namedItem('pass').value);
    formData.append('idType', elements.namedItem('idType').value);
    formData.append('idNumber', elements.namedItem('idNumber').value);
    formData.append('address', elements.namedItem('address').value);
    formData.append('telephone', elements.namedItem('telephone').value);    
    formData.append('image', elements.namedItem('image-doctor').files[0]);

    const code = ajaxMultipart('post', `http://localhost:5000/solicitud/doctores/crear`, formData);
    if (isNaN(code)) return;

    switch (code) {
        case SUCCESS:
            message (messageForm,
            `<i class="fa-solid fa-check" style="color: green;"></i>
            <p>Doctor creado exitosamente.</p>`);
            buttonDisabled(buttonCreate);
            setTimeout(() => {
                hideModal(modal);
                reloadForm(form);
                buttonEnabled(buttonCreate);
                setTimeout(() => {
                    hideMessage(messageForm);
                }, 300);
                document.body.style.overflow = 'auto';
                socket.timeout(2000).emit('doctor/read', true, (error, response) => {});
                socket.emit('users/length', true);
            }, 2000);
            break;

        case NOT_ALLOWED:
            message (messageForm, 
            `<i class="fa-solid fa-triangle-exclamation" style="color: red;"></i>
            <p>Correo electrónico, contraseña y/o numero de identificación en uso. Intentelo nuevamente.</p>`);
            reloadField(document.forms.namedItem(form.id).elements['pass'], form.id);
            reloadField(document.forms.namedItem(form.id).elements['confirm-pass'], form.id);
            break;

        case ERROR:
            message (messageForm, 
            `<i class="fa-solid fa-triangle-exclamation" style="color: red;"></i>
            <p>Error en el servidor. Contáctenos si este persiste.</p>`);
            break;

        case NOT_NUMBER:
                message (formMessage, 
                `<i class="fa-solid fa-triangle-exclamation" style="color: red;"></i>
                <p>Solo se permiten números en los campos numéricos. Inténtelo nuevamente.</p>`);
                break;    
    }
}

function read() {
    let data = doctors;
    const text = inputSeeker.value.trim(); 

    if (text.length > 0) {
        data = data.filter(doctor => doctor._name.includes(text) || doctor._email.includes(text));
    }
    if (!(data instanceof Array)) return;
    if (countDoctors) countDoctors.innerHTML = data.length;

    table.innerHTML = '';

    for (let i = 0; i < data.length; i++) {
        if (!(data[i] instanceof Object)) continue;
        if (!isset([data[i]._id, data[i]._name, data[i]._telephone, data[i]._updatedAt])) continue;
        if (!isDate(data[i]._updatedAt)) continue;

        let clone = template.content.cloneNode(true);
        let tr = clone.querySelector('tr');
        let cells = clone.querySelectorAll('td');
        let informationDoctor = clone.querySelector('.information-doctor');
        let img;
        let span;
        let profile;
        let imageContent;

        if (!clone || !tr || !cells || !informationDoctor) continue;

        for(let j = 0; j < cells.length; j++) {
            switch(j) {
                case 0:
                    span = cells[j].querySelector('span');
                    if (span) span.textContent = i + 1;
                    break;
                    
                case 1:
                    profile = cells[j].querySelector('.profile');
                    imageContent = profile.querySelector('.image');
                    span = profile.querySelector('span');

                    if (!profile || !imageContent || !span) continue;

                    imageContent.classList.add('skeleton');
                    img = document.createElement('img');
                    img.onload = function () {
                        imageContent.classList.remove('skeleton');
                        imageContent.append(img);
                    };
                    img.src = isset([data[i]._imageURL]) ? data[i]._imageURL : '/images/user-solid.jpg';
                    img.alt = 'Imagen de Perfil';
                
                    span.textContent = data[i]._name;
                    break;
                    
                case 2:
                    span = cells[j].querySelector('span');
                    if (span) span.textContent = data[i]._telephone;
                    break;
                    
                case 3:
                    span = cells[j].querySelector('span');
                    if (span) span.textContent = new Date(data[i]._updatedAt).toLocaleString();
                    break;
            }

            informationDoctor.dataset.id = data[i]._id;
        }

        tr.classList.remove('skeleton');
        table.append(tr);    
    }

    if (data.length > 0) initInformation();
}

function edit(id) {
    if (!isset([doctors]) || !(doctors instanceof Array)) return;
    if (!isset([id]) || isNaN(id)) return;

    const index = doctors.findIndex(x => x._id === Number(id));
    if (index === -1) return;

    const doctor = doctors[index];
    if (!isset(doctor) || !(doctor instanceof Object)) return;
    if (!isset(doctor._name, doctor._email, doctor._pass, doctor._idType, doctor._idNumber, doctor._address, doctor._telephone)) return;

    if (title) title.innerHTML = doctor._name;
    showButton(buttonDelete);
    showButton(buttonUpdate);
    hideButton(buttonCreate);

    buttonDelete.dataset.id = id;
    buttonUpdate.dataset.id = id;
    
    if (form) reloadForm(form);
    if (messageForm) hideMessage(messageForm);

    const image = form.querySelector('.image-form');
    if (image) image.src = (isset([doctor._imageURL])) ? doctor._imageURL : '/images/user-solid.jpg';

    const elements = document.forms.namedItem(form.id).elements;
    elements.namedItem('name').value = doctor._name;
    elements.namedItem('email').value = doctor._email;
    elements.namedItem('pass').value = doctor._pass;
    elements.namedItem('confirm-pass').value = doctor._pass;
    elements.namedItem('idType').value = doctor._idType;
    elements.namedItem('idNumber').value = doctor._idNumber;
    elements.namedItem('address').value = doctor._address;
    elements.namedItem('telephone').value = doctor._telephone;
    
    if (modal) {
        document.body.style.overflow = 'hidden';
        showModal(modal);
    }
}

function update(id) {
    if (!isset([id]) || isNaN(id)) return;
    const elements = document.forms.namedItem(form.id).elements;
    const formData = new FormData();
    formData.append('id', id);
    formData.append('name', elements.namedItem('name').value);
    formData.append('email', elements.namedItem('email').value);
    formData.append('pass', elements.namedItem('pass').value);
    formData.append('idType', elements.namedItem('idType').value);
    formData.append('idNumber', elements.namedItem('idNumber').value);
    formData.append('address', elements.namedItem('address').value);
    formData.append('telephone', elements.namedItem('telephone').value);    
    formData.append('image', elements.namedItem('image-doctor').files[0]);

    const code = ajaxMultipart('POST', 'http://localhost:5000/solicitud/doctores/actualizar', formData);
    if (isNaN(code)) return;

    switch (code) {
        case SUCCESS:
            message (messageForm,
            `<i class="fa-solid fa-check" style="color: green;"></i>
            <p>Doctor actualizado exitosamente.</p>`);
            buttonDisabled(buttonUpdate);
            buttonDisabled(buttonDelete);
            setTimeout(() => {
                buttonEnabled(buttonUpdate);
                buttonEnabled(buttonDelete);
                hideMessage(messageForm);
                socket.timeout(2000).emit('doctor/read', true, (error, response) => {
                    if (!error) socket.emit('doctor/updated', id);
                });
            }, 2000);
            break;

        case NOT_ALLOWED:
            message (messageForm, 
            `<i class="fa-solid fa-triangle-exclamation" style="color: red;"></i>
            <p>Correo electrónico, contraseña y/o numero de identificación en uso. Intentelo nuevamente.</p>`);
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

    const code = ajax('POST', 'http://localhost:5000/solicitud/doctores/eliminar', {'id' : id});
    if (isNaN(code)) return;

    switch (code) {
        case SUCCESS:
            message (messageForm,
            `<i class="fa-solid fa-check" style="color: green;"></i>
            <p>Doctor eliminado exitosamente.</p>`);
            buttonDisabled(buttonUpdate);
            buttonDisabled(buttonDelete);
            setTimeout(() => {
                hideModal(modal);
                reloadForm(form);
                buttonEnabled(buttonUpdate);
                buttonEnabled(buttonDelete);
                setTimeout(() => {
                    hideMessage(messageForm);
                }, 300);
                document.body.style.overflow = 'auto';
                socket.timeout(2000).emit('doctor/read', true, (error, response) => {
                    if (!error) socket.emit('doctor/deleted', id);
                });
                socket.emit('users/length', true);
            }, 2000);
            break;

        case ERROR:
            message (messageForm, 
            `<i class="fa-solid fa-triangle-exclamation" style="color: red;"></i>
            <p>Error en el servidor. Contáctenos si este persiste.</p>`);
            break;
    }
}

function initInformation() {
    const buttonsView = document.querySelectorAll('.information-doctor');
    buttonsView.forEach(button => {
        button.addEventListener('click', () => {
            if (isset([button.dataset.id]) && !isNaN(button.dataset.id)) edit(button.dataset.id);
        });
    });
}

function placeImage() {
    const input = document.forms.namedItem(form.id).elements.namedItem('image-doctor');
    const image = form.querySelector('.image-form');

    if (input && image) {
        input.addEventListener('change', function() {
            if (input.files && input.files[0] && verifyImage(form.id, input)) {
                try {
                    var reader = new FileReader();
                    reader.onload = function(e) {
                        image.src = e.target.result;   
                    }
                    reader.readAsDataURL(this.files[0]);
                } catch (error) {
                    image.src = '/images/user-solid.jpg';
                }
            } else {
                image.src = '/images/user-solid.jpg';   
            }
        });
    }
}

function skeleton() {
    for (let i = 0; i < limit; i++) {
        let clone = template.content.cloneNode(true);
        table.append(clone);
    }
}