import { ajax, ajaxMultipart, hideMessage, message } from "../../ajax.js";
import { isDate, isset, reloadHelper, verifyForm, verifyImage } from "../../form.js";
import { SUCCESS, ERROR, NOT_ALLOWED } from "../../codes.js"; 
import { socket } from "../../socket.js";
import dataPhones from "../../codes-phone.json" assert {type: 'json'};

var form, elements, informationDates, buttonUpdateData, formMessage, formImage;
var data = {};
var date = new Date();

socket.on('patient/session/read', (patient) => {
    if (!(patient instanceof Object)) return;
    data = patient;
    edit();
    asignDates();
});

socket.on('patient/updated', (id) => {
    if (!isset([id])) return;
    if (!(data instanceof Object)) return;
    if (id === data._id) socket.emit('patient/session/read');
});

document.addEventListener('DOMContentLoaded', function() {
    form = document.getElementById('profile-patient');
    if (form) elements = document.forms.namedItem(form.id).elements;
    informationDates = document.querySelector('.information-dates');
    buttonUpdateData = document.getElementById('button-update-data');
    formMessage = document.getElementById('form-message');
    formImage = document.getElementById('form-image-patient');

    if (!isset([form, formMessage, elements, informationDates, buttonUpdateData, formImage])) return;

    socket.emit('patient/session/read');

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

    if (dataPhones instanceof Array) {
        const fieldsExtension = document.querySelectorAll('.extension-phone-number');
        if (fieldsExtension) for (let i = 0; i < fieldsExtension.length; i++) {
            let option = document.createElement('option');
            option.value = "";
            option.selected = true;
            option.disabled = true;
            option.hidden = true;
            option.textContent = "Selecciona un pais";
            fieldsExtension[i].appendChild(option);
            for (let j = 0; j < dataPhones.length; j++) {
                option = document.createElement('option');
                option.value = dataPhones[j]['Phone Code'];
                option.textContent = `+${dataPhones[j]['Phone Code']} - ${dataPhones[j]['Country Name']}`
                fieldsExtension[i].appendChild(option);
            }
        }
    }

    let dateField = document.forms.namedItem(form.id).elements.namedItem('birthdate');
    if (dateField) {
        date.setFullYear(date.getFullYear() - 1);
        dateField.max = date.toISOString().split("T")[0];
    }
});

function edit() {
    if (!isset([data._id, data._name, data._email, data._pass, data._telephone, data._birthdate, elements])) return;
    if (!isDate(data._birthdate)) return;
    const birthdate = new Date(data._birthdate);

    elements.namedItem('name').value = data._name;
    elements.namedItem('email').value = data._email;
    elements.namedItem('extension').value = data._extensionTelephone;
    elements.namedItem('telephone').value = data._telephone;
    elements.namedItem('birthdate').value = birthdate.getFullYear() + '-' + ("0" + (birthdate.getMonth() + 1)).slice(-2) + '-' + ("0" + birthdate.getDate()).slice(-2);
    elements.namedItem('pass').value = data._pass;

    buttonUpdateData.dataset.id = data._id;
}

function asignDates() {
    if (!isset([data._createdAt, data._updatedAt])) return;
    if (!isDate(data._createdAt) || !isDate(data._updatedAt)) return;

    const created = informationDates.querySelectorAll('p')[0];
    const updated = informationDates.querySelectorAll('p')[1];

    created.innerHTML = `Cuenta creada el <b>${new Date(data._createdAt).toLocaleString()}</b>.`;
    updated.innerHTML = `Ultima actualización: <b>${new Date(data._updatedAt).toLocaleString()}</b>.`;
}

function update(id) {
    if (!isset([id]) || isNaN(id)) return;
    const elements = document.forms.namedItem(form.id).elements;
    const data = {
        'id': id,
        'name': elements.namedItem('name').value,
        'email': elements.namedItem('email').value,
        'extension': elements.namedItem('extension').value,
        'telephone': elements.namedItem('telephone').value,
        'birthdate': elements.namedItem('birthdate').value.replace(/-/g, '\/'),
        'pass': elements.namedItem('pass').value,
    };
    
    const code = ajax(form.method, 'http://localhost:5000/solicitud/pacientes/actualizar', data);

    if (isNaN(code)) return;

    switch (Number(code)) {
        case SUCCESS: {
            message (formMessage, 
            `<div class="content">
                <i class="fa-solid fa-user-check" style="color: green;"></i>
                <h3>Actualizado!</h3>
                <p>Paciente actualizado correctamente.</p>
                <button class="button-close">OK</button>
            </div>`);
            document.body.style.overflow = 'hidden';
            reloadHelper(form);
            socket.timeout(2000).emit('patient/read', true, (error, response) => {
                if (!error) socket.emit('patient/updated', Number(id));
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
        const code = ajaxMultipart('POST', 'http://localhost:5000/solicitud/paciente/imagen/subir', formData);
        
        if (isNaN(code)) return;
        switch (code) {
            case SUCCESS:
                socket.timeout(2000).emit('patient/read', true, (error, response) => {
                    if (!error) socket.emit('patient/updated', Number(data._id));
                });
                break;
        }
    }
}

function deleteImage() {
    if (!(data instanceof Object) || !isset([data._id])) return;
    const code = ajax('POST', 'http://localhost:5000/solicitud/paciente/imagen/eliminar', {'id': data._id});
    
    if (isNaN(code)) return;
    switch (code) {
        case SUCCESS:
            socket.timeout(2000).emit('patient/read', true, (error, response) => {
                if (!error) socket.emit('patient/updated', Number(data._id));
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