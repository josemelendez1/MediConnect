import { ajaxMultipart, hideMessage, message } from "../../ajax.js";
import { ERROR, NOT_ALLOWED, SUCCESS } from "../../codes.js";
import { buttonDisabled, buttonEnabled, isDate, isset, reloadForm, verifyForm, verifyImage } from "../../form.js";
import { hideButton, hideModal, showButton, showModal } from "../../modal.js";
import { socket } from "../../socket.js";

const limit = 5;
var administrators = [];
var template, table, modal, form, title, messageForm, seeker, countAdministrators;
var buttonShowModal, buttonHideModal, buttonCreate, buttonDelete, buttonUpdate;

document.addEventListener('DOMContentLoaded', function() {
    template = document.getElementById('template-administrator');
    table = document.getElementById('table-administrator');
    form = document.getElementById('form-administrators');
    seeker = document.getElementById('seeker-administrator');
    modal = document.getElementById('modal-administrators');
    title = document.getElementById('title-administrator');
    messageForm = document.getElementById('message-administrator');
    countAdministrators = document.getElementById('count-administrators');

    buttonShowModal = document.getElementById('button-show-modal-administrators');
    buttonHideModal = document.getElementById('button-hide-modal-administrators');
    buttonCreate = document.getElementById('button-create-administrator');
    buttonUpdate = document.getElementById('button-update-administrator');
    buttonDelete = document.getElementById('button-delete-administrator');

    if (isset([template, table, modal, form, title, messageForm, seeker, countAdministrators, buttonShowModal, buttonHideModal, buttonCreate, buttonDelete, buttonUpdate])) {
        skeleton();
        initImage();
        socket.emit('administrators/read', false, (error, response) => {});

        buttonShowModal.addEventListener('click', () => {
            showButton(buttonCreate);
            hideButton(buttonDelete);
            hideButton(buttonUpdate);
            reloadForm(form);
            hideMessage(messageForm);
            title.innerHTML = 'Nuevo Administrador';
            document.body.style.overflow = 'hidden';
            const image = form.querySelector('.image-form');
            if (image) image.src = '/images/user-solid.jpg';
            showModal(modal);
        });

        buttonHideModal.addEventListener('click', () => {
            hideModal(modal);
            reloadForm(form);
            hideMessage(messageForm);
            document.body.style.overflow = 'auto';
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

        seeker.addEventListener('input', read);
    }
});

socket.on('administrators/read', (data) => {
    if (!(data instanceof Array)) return;
    administrators = data;
    setTimeout(read, 500);
});

socket.on('administrator/updated', (id) => {
    if (!isset([id])) return;
    if (!modal.classList.contains('modal-open')) return;
    if (buttonUpdate.classList.contains('button-none')) return;
    if (!isset([buttonUpdate.dataset.id]) || isNaN(buttonUpdate.dataset.id)) return;

    if (id.toString() === buttonUpdate.dataset.id.toString()) {
        edit(id);
    }
});

socket.on('administrator/deleted', (id) => {
    if (!isset([id])) return;
    if (!modal.classList.contains('modal-open')) return;
    if (buttonDelete.classList.contains('button-none')) return;
    if (!isset([buttonDelete.dataset.id]) || isNaN(buttonDelete.dataset.id)) return;
    
    if (id.toString() === buttonDelete.dataset.id.toString()) {
        message( messageForm,
            `<i class="fa-solid fa-check" style="color: green;"></i>
            <p>Administrador eliminado exitosamente.</p>`
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
            document.body.style.overflowY = 'auto';
        }, 2000);
    }
});

function create() {
    const elements = document.forms.namedItem(form.id).elements;
    const formData = new FormData();
    formData.append('name', elements.namedItem('name').value);
    formData.append('email', elements.namedItem('email').value);
    formData.append('pass', elements.namedItem('pass').value);
    formData.append('telephone', elements.namedItem('telephone').value);
    formData.append('area', elements.namedItem('area').value);
    formData.append('image', elements.namedItem('image').files[0]);

    const code = ajaxMultipart('post', 'http://localhost:5000/solicitud/administrador/crear', formData);

    if (isNaN(code)) return;

    switch (Number(code)) {
        case SUCCESS:
            message (messageForm,
                `<i class="fa-solid fa-check" style="color: green;"></i>
                <p>Administrador creado exitosamente.</p>`);
            buttonDisabled(buttonCreate);
            setTimeout(() => {
                hideModal(modal);
                reloadForm(form);
                buttonEnabled(buttonCreate);
                setTimeout(() => {
                    hideMessage(messageForm);
                }, 300);
                socket.timeout(2000).emit('administrators/read', true, (error, response) => {});
                socket.emit('users/length', true);
            }, 2000);
            break;

        case NOT_ALLOWED:
            message (messageForm, 
            `<i class="fa-solid fa-triangle-exclamation" style="color: red;"></i>
            <p>Correo electrónico y/o contraseña no disponibles. Inserte nuevos datos.</p>`);
            reloadField(document.forms.namedItem(form.id).elements['pass'], form.id);
            reloadField(document.forms.namedItem(form.id).elements['confirm-pass'], form.id);
            break;

        case ERROR:
            message (messageForm, 
            `<i class="fa-solid fa-triangle-exclamation" style="color: red;"></i>
            <p>Error en el servidor. Contáctenos si este persiste.</p>`);
            break;
    }
}

function read() {
    let data = administrators;
    const text = seeker.value.trim();
    if (text.length > 0) data = data.filter(user => user._name.includes(text) || user._email.includes(text));
    if (!(data instanceof Array)) return;
    if (countAdministrators) countAdministrators.innerHTML = data.length;
    table.innerHTML = '';

    for (let i = 0; i < data.length; i++) {
        if (!(data[i] instanceof Object)) continue;
        if (!isset([data[i]._id, data[i]._name, data[i]._email, data[i]._telephone])) continue;
        if (!isDate(data[i]._updatedAt)) continue;

        let clone = template.content.cloneNode(true);
        let tr = clone.querySelector('tr');
        let cells = clone.querySelectorAll('td');
        let information = clone.querySelector('.information-administrator');
        let img;
        let span;
        let profile;
        let imageContent;

        if (!isset([clone, tr, cells, information])) continue;

        for(let j = 0; j < cells.length; j++) {
            switch(j) {
                case 0:
                    span = cells[j].querySelector('span');
                    if (span) span.textContent = i + 1;
                    break;
                    
                case 1:
                    profile = cells[j].querySelector('.profile');
                    imageContent = cells[j].querySelector('.image');
                    span = cells[j].querySelector('span');

                    if (!isset([profile, imageContent, span])) continue;

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
                    if (span) span.textContent = data[i]._email;
                    break;
                    
                case 3:
                    span = cells[j].querySelector('span');
                    if (span) span.textContent = data[i]._telephone;
                    break;
            }
            information.dataset.id = data[i]._id;
        }

        tr.classList.remove('skeleton');
        table.append(tr);
    }

    if (data.length > 0) initAdministrators();
}

function update(id) {
    if (!isset([id]) || isNaN(id)) return;
    const elements = document.forms.namedItem(form.id).elements;
    const formData = new FormData();
    formData.append('id', id);
    formData.append('name', elements.namedItem('name').value);
    formData.append('email', elements.namedItem('email').value);
    formData.append('pass', elements.namedItem('pass').value);
    formData.append('telephone', elements.namedItem('telephone').value);
    formData.append('area', elements.namedItem('area').value);
    formData.append('image', elements.namedItem('image').files[0]);

    const code = ajaxMultipart('post', 'http://localhost:5000/solicitud/administrador/actualizar', formData);
    if (isNaN(code)) return;
    switch (Number(code)) {
        case SUCCESS:
            message (messageForm,
            `<i class="fa-solid fa-check" style="color: green;"></i>
            <p>Administrador actualizado exitosamente.</p>`);
            buttonDisabled(buttonUpdate);
            buttonDisabled(buttonDelete);
            setTimeout(() => {
                buttonEnabled(buttonUpdate);
                buttonEnabled(buttonDelete);
                hideMessage(messageForm);
                socket.timeout(2000).emit('administrators/read', true, (error, response) => {
                    if (!error) socket.emit('administrator/updated', Number(id));
                });
                socket.emit('administrator/read', Number(id), true);
            }, 2000);
            break;

        case NOT_ALLOWED:
            message (messageForm, 
            `<i class="fa-solid fa-triangle-exclamation" style="color: red;"></i>
            <p>Correo electrónico y/o contraseña en uso. Intentelo nuevamente.</p>`);
            break;
            
        case ERROR:
            message (messageForm, 
            `<i class="fa-solid fa-triangle-exclamation" style="color: red;"></i>
            <p>Error en el servidor. Contáctenos si este persiste.</p>`);
            break;
    }
}

function remove(id) {
    if (!isset([id]) && isNaN(id)) return;
    const code = ajax('post', 'http://localhost:5000/solicitud/administrador/eliminar', {'id': id});
    if (isNaN(code)) return;
    switch (Number(code)) {
        case SUCCESS:
            message (messageForm,
                `<i class="fa-solid fa-check" style="color: green;"></i>
                <p>Administrador eliminado exitosamente.</p>`);
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
                    socket.timeout(2000).emit('administrators/read', true, (error, response) => {
                        if (!error) socket.emit('administrator/deleted', id);
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

function edit(id) {
    if (!isset([id]) || isNaN(id)) return;
    if (!(administrators instanceof Array)) return;
    if (!isset([form, messageForm, title, buttonCreate, buttonDelete, buttonUpdate])) return;

    const index = administrators.findIndex(x => x._id === Number(id));
    if (index === -1) return;

    const administrator = administrators[index];
    if (!(administrator instanceof Object)) return;
    if (!isset([administrator._id, administrator._name, administrator._email, administrator._telephone, administrator._area, administrator._pass])) return;

    title.textContent = administrator._name;
    hideButton(buttonCreate);
    showButton(buttonUpdate);
    showButton(buttonDelete);

    buttonDelete.dataset.id = id;
    buttonUpdate.dataset.id = id;
 
    reloadForm(form);
    hideMessage(messageForm);

    const image = form.querySelector('.image-form');
    if (image) image.src = (isset([administrator._imageURL])) ? administrator._imageURL : '/images/user-solid.jpg';

    const elements = document.forms.namedItem(form.id).elements;
    elements.namedItem('name').value = administrator._name;
    elements.namedItem('email').value = administrator._email;
    elements.namedItem('telephone').value = administrator._telephone;
    elements.namedItem('area').value = administrator._area;
    elements.namedItem('pass').value = administrator._pass;
    elements.namedItem('confirm-pass').value = administrator._pass;
    
    if (modal) {
        document.body.style.overflow = 'hidden';
        showModal(modal);
    }
}

function skeleton() {
    for (let i = 0; i < limit; i++) {
        let clone = template.content.cloneNode(true);
        table.append(clone);
    }
}

function initImage() {
    const input = document.forms.namedItem(form.id).elements.namedItem('image');
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

function initAdministrators() {
    const buttonsView = document.querySelectorAll('.information-administrator');
    buttonsView.forEach(button => {
        button.addEventListener('click', () => {
            edit(button.dataset.id);
        });
    });
}