import { ajax, ajaxMultipart, hideMessage, message } from "../../ajax.js";
import { isDate, isset, reloadHelper, verifyForm, verifyImage } from "../../form.js";
import { SUCCESS, ERROR, NOT_ALLOWED } from "../../codes.js"; 
import { socket } from "../../socket.js";

var form, elements, informationDates, buttonUpdateData, formMessage, formImage;
var data = {};

socket.on('doctor/session/read', (doctor) => {
    if (!(doctor instanceof Object)) return;
    data = doctor;
    edit();
    asignDates(informationDates, doctor);
});

socket.on('doctor/updated', (id) => {
    if (!isset([id])) return;
    if (!(data instanceof Object)) return;
    if (id === data._id) socket.emit('doctor/session/read');
});

document.addEventListener('DOMContentLoaded', function() {
    form = document.getElementById('profile-doctor');
    elements = document.forms.namedItem(form.id).elements;
    informationDates = document.querySelector('.information-dates');
    buttonUpdateData = document.getElementById('button-update-data');
    formMessage = document.getElementById('form-message');
    formImage = document.getElementById('form-image-doctor');

    if (!isset([form, formMessage, elements, informationDates, buttonUpdateData, formImage])) return;

    socket.emit('doctor/session/read');

    if (buttonUpdateData) {
        buttonUpdateData.addEventListener('click', function() {
            if (verifyForm(form)) {
                update(buttonUpdateData.dataset.id);
            }
        });
    }

    if (formImage) {
        renovateImage();

        const buttonUpload = document.getElementById('button-upload-image');
        const buttonDelete = document.getElementById('button-delete-image');

        if (buttonUpload) {
            buttonUpload.addEventListener('click', function() {
                uploadImage();
            });
        }

        if (buttonDelete) {
            buttonDelete.addEventListener('click', function() {
                deleteImage();
            });
        }
    }
});

function edit() {
    if (!isset([elements, data])) return;
    if (!(data instanceof Object)) return;
    if (!isset([data._id, data._idNumber, data._idType, data._name, data._email, data._pass, data._telephone, data._address])) return;

    elements.namedItem('idNumber').value = data._idNumber;
    elements.namedItem('idType').value = data._idType;
    elements.namedItem('name').value = data._name;
    elements.namedItem('email').value = data._email;
    elements.namedItem('telephone').value = data._telephone;
    elements.namedItem('address').value = data._address;
    elements.namedItem('pass').value = data._pass;

    buttonUpdateData.dataset.id = data._id;
}

function asignDates(container, administrator) {
    if (!isset([administrator._createdAt, administrator._updatedAt])) return;
    if (!isDate(administrator._createdAt) || !isDate(administrator._updatedAt)) return;

    const created = container.querySelectorAll('p')[0];
    const updated = container.querySelectorAll('p')[1];

    created.innerHTML = `Cuenta creada el <b>${new Date(administrator._createdAt).toLocaleString()}</b>.`;
    updated.innerHTML = `Ultima actualización: <b>${new Date(administrator._updatedAt).toLocaleString()}</b>.`;
}

function update(id) {
    if (!isset([id]) || isNaN(id)) return;
    const elements = document.forms.namedItem(form.id).elements;
    const data = {
        'id': id,
        'idNumber': elements.namedItem('idNumber').value,
        'idType': elements.namedItem('idType').value,
        'name': elements.namedItem('name').value,
        'email': elements.namedItem('email').value,
        'telephone': elements.namedItem('telephone').value,
        'address': elements.namedItem('address').value,
        'pass': elements.namedItem('pass').value,
    };
    
    const code = ajax(form.method, '/solicitud/doctores/actualizar', data);

    if (isNaN(code)) return;

    switch (Number(code)) {
        case SUCCESS: {
            message (formMessage, 
            `<div class="content">
                <i class="fa-solid fa-user-check" style="color: green;"></i>
                <h3>Actualizado!</h3>
                <p>Doctor actualizado correctamente.</p>
                <button class="button-close">OK</button>
            </div>`);
            document.body.style.overflow = 'hidden';
            reloadHelper(form);
            socket.timeout(2000).emit('doctor/read', true, (error, response) => {
                if (!error) socket.emit('doctor/updated', Number(id));
            });
            break;
        }

        case NOT_ALLOWED: {
            message (formMessage, 
            `<div class="content">
                <i class="fa-solid fa-triangle-exclamation" style="color: red;"></i>
                <h3>Correo y/o contraseña en uso.</h3>
                <p>Correo y/o contraseña ya utilizados, Inténtelo nuevamente.</p>
                <button class="button-close">OK</button>
            </div>`);
            document.body.style.overflow = 'hidden';
            reloadHelper(form);
            break;
        }

        case ERROR: {
            message (formMessage, 
            `<div class="content">
                <i class="fa-solid fa-triangle-exclamation" style="color: red;"></i>
                <h3>Error!</h3>
                <p>Error en el servidor. Contáctenos si este persiste.</p>
                <button class="button-close">OK</button>
            </div>`);
            document.body.style.overflow = 'hidden';
            reloadHelper(form);
            break;
        }
    }

    const buttonClose = formMessage.querySelector('.button-close');
    if (buttonClose) {
        buttonClose.addEventListener('click', function() {
            hideMessage(formMessage);
            document.body.style.overflow = 'auto';
        });
    }
}

function uploadImage() {
    const elements = document.forms.namedItem(formImage.id).elements;
    const files = elements.namedItem('image').files;
    const formData = new FormData();

    if (!(data instanceof Object) || !isset([data._id])) return;
    if (!files || !files[0]) return;

    if (verifyImage(formImage.id, elements.namedItem('image'))) {
        formData.append('id', data._id);
        formData.append('image', files[0]);
        const code = ajaxMultipart('post', 'http://localhost:5000/solicitud/doctor/subir/imagen', formData);
        
        if (isNaN(code)) return;

        switch (code) {
            case SUCCESS:
                socket.timeout(2000).emit('doctor/read', true, (error, response) => {
                    if (!error) socket.emit('doctor/updated', Number(data._id));
                });
                break;
        }
    }
}

function deleteImage() {
    if (!(data instanceof Object) || !isset([data._id])) return;
    const code = ajax('POST', 'http://localhost:5000/solicitud/doctor/eliminar/imagen', {'id': data._id});

    if (isNaN(code)) return;
    switch (code) {
        case SUCCESS:
            socket.timeout(2000).emit('doctor/read', true, (error, response) => {
                if (!error) socket.emit('doctor/updated', Number(data._id)); 
            });
            break;
    }
}

function renovateImage() {
    const input = document.forms.namedItem(formImage.id).elements.namedItem('image');
    const image = formImage.querySelector('.image-form');

    if (input && image) {
        input.addEventListener('change', function() {
            if (input.files && input.files[0] && verifyImage(formImage.id, input)) {
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