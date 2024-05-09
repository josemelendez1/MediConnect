import { ajax, ajaxMultipart, hideMessage, message } from "../../ajax.js";
import { isDate, isset, reloadHelper, verifyForm, verifyImage } from "../../form.js";
import { SUCCESS, ERROR } from "../../codes.js"; 
import { socket } from "../../socket.js";

var form, elements, informationDates, buttonUpdateData, formMessage, formImage;
var data = {};

socket.on('administrator/session/read', (administrator) => {
    if (!(administrator instanceof Object)) return;
    data = administrator;
    edit(elements, administrator);
    asignDates(informationDates, administrator);
});

socket.on('administrator/read', (administrator) => {
    if (!(administrator instanceof Object)) return;
    if (!(data instanceof Object)) return;
    if (data._id === administrator._id) {
        data = administrator;   
        edit(elements, administrator);
        asignDates(informationDates, administrator);
    } 
});

document.addEventListener('DOMContentLoaded', function() {
    form = document.getElementById('profile-administrator');
    elements = document.forms.namedItem(form.id).elements;
    informationDates = document.querySelector('.information-dates');
    buttonUpdateData = document.getElementById('button-update-data');
    formMessage = document.getElementById('form-message');
    formImage = document.getElementById('form-image-administrator');

    if (!isset([form, formMessage, elements, informationDates, buttonUpdateData, formImage])) return;

    socket.emit('administrator/session/read');

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

function edit(elements, administrator) {
    if (!isset([administrator._id, administrator._name, administrator._email, administrator._pass, administrator._telephone, administrator._area])) return;

    elements.namedItem('name').value = administrator._name;
    elements.namedItem('email').value = administrator._email;
    elements.namedItem('telephone').value = administrator._telephone;
    elements.namedItem('area').value = administrator._area;
    elements.namedItem('pass').value = administrator._pass;

    buttonUpdateData.dataset.id = administrator._id;
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
        'name': elements.namedItem('name').value,
        'email': elements.namedItem('email').value,
        'telephone': elements.namedItem('telephone').value,
        'area': elements.namedItem('area').value,
        'pass': elements.namedItem('pass').value,
    };
    
    const code = ajax(form.method, '/solicitud/administrador/actualizar', data);

    if (isNaN(code)) return;

    switch (Number(code)) {
        case SUCCESS: {
            message (formMessage, 
            `<div class="content">
                <i class="fa-solid fa-user-check" style="color: green;"></i>
                <h3>Actualizado!</h3>
                <p>Administrador actualizado correctamente.</p>
                <button class="button-close">OK</button>
            </div>`);
            document.body.style.overflow = 'hidden';
            reloadHelper(form);
            socket.emit('administrator/read', Number(id), true);
            socket.timeout(2000).emit('administrators/read', true, (error, response) => {});
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
        formData.append('image', files[0]);
        const code = ajaxMultipart('POST', 'http://localhost:5000/solicitud/administrador/imagen/subir', formData);
        
        if (isNaN(code)) {
            return;
        }

        switch (code) {
            case SUCCESS:
                socket.emit('administrator/read', Number(data._id), true);
                socket.timeout(2000).emit('administrators/read', true, (error, response) => {});
                break;
        }
    }
}

function deleteImage() {
    if (!(data instanceof Object) || !isset([data._id])) return;
    const code = ajax('POST', 'http://localhost:5000/solicitud/administrador/imagen/eliminar', {});
    if (isNaN(code)) return;
    switch (code) {
        case SUCCESS:
            socket.emit('administrator/read', Number(data._id), true);
            socket.timeout(2000).emit('administrators/read', true, (error, response) => {});
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