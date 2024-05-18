import { ajax, ajaxMultipart, hideMessage, message } from "../../ajax.js";
import { hideButton, hideModal, showButton, showModal } from "../../modal.js";
import { SUCCESS, NOT_ALLOWED, NOT_VERIFIED, ERROR } from "../../codes.js";
import { buttonDisabled, buttonEnabled, isDate, isset, reloadField, reloadForm, verifyForm, verifyImage } from "../../form.js";
import { socket } from "../../socket.js";
import dataPhones from "../../codes-phone.json" with {type: 'json'};

const limit = 5;
var users, form, title, table, modal, messageForm, countUsers, inputSeeker, buttonCreate, buttonUpdate, buttonDelete, buttonShowModal, buttonHideModal, templatePatient; 
var date = new Date();
socket.on('patient/read', (data) => {
    if (!(data instanceof Array)) return;
    users = data;
    setTimeout(read, 500);
});

socket.on('patient/updated', (id) => {
    if (!isset([id])) return;
    if (!modal.classList.contains('modal-open')) return;
    if (buttonUpdate.classList.contains('button-none')) return;
    if (!isset([buttonUpdate.dataset.id]) || isNaN(buttonUpdate.dataset.id)) return;

    if (id.toString() === buttonUpdate.dataset.id.toString()) {
        edit(id);
    }
});

socket.on('patient/deleted', (id) => {
    if (!isset([id])) return;
    if (!modal.classList.contains('modal-open')) return;
    if (buttonDelete.classList.contains('button-none')) return;
    if (!isset([buttonDelete.dataset.id]) || isNaN(buttonDelete.dataset.id)) return;
    
    if (id.toString() === buttonDelete.dataset.id.toString()) {
        message( messageForm,
            `<i class="fa-solid fa-check" style="color: green;"></i>
            <p>Paciente eliminado exitosamente.</p>`
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

document.addEventListener("DOMContentLoaded", function() {
    form = document.getElementById('form-users');
    title = document.getElementById("title-users");
    table = document.getElementById('table-users');
    modal = document.getElementById("modal-users");
    messageForm = document.getElementById('message-users');
    countUsers = document.getElementById('count-users');
    inputSeeker = document.getElementById('seeker-patients');
    buttonCreate = document.getElementById('button-create-users');
    buttonUpdate = document.getElementById('button-update-users');
    buttonDelete = document.getElementById('button-delete-users');
    buttonShowModal = document.getElementById('button-show-modal');
    buttonHideModal = document.getElementById('button-hide-modal');
    templatePatient =  document.getElementById('template-patient');

    copyright();

    if (modal && table && title && countUsers && messageForm && inputSeeker && buttonShowModal && buttonHideModal && buttonCreate && buttonDelete && buttonUpdate) {
        placeImage();
        skeleton();

        socket.emit('patient/read', false, (error, response) => {});
         
        buttonShowModal.addEventListener('click', function() {
            showButton(buttonCreate);
            hideButton(buttonDelete);
            hideButton(buttonUpdate);
            reloadForm(form);
            hideMessage(messageForm);
            title.innerHTML = 'Nuevo Paciente';
            document.body.style.overflow = 'hidden';
            const image = form.querySelector('.image-form');
            if (image) image.src = '/images/user-solid.jpg';
            showModal(modal);
        });

        buttonHideModal.addEventListener('click', function() {
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

        inputSeeker.addEventListener('input', function() {
            read();
        });

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
    }
});

function create() {
    const elements = document.forms.namedItem(form.id).elements;
    const formData = new FormData();
    formData.append('name', elements.namedItem('name').value);
    formData.append('email', elements.namedItem('email').value);
    formData.append('pass', elements.namedItem('pass').value);
    formData.append('extension', elements.namedItem('extension').value);
    formData.append('telephone', elements.namedItem('telephone').value);
    formData.append('birthdate', elements.namedItem('birthdate').value.replace(/-/g, '\/'));
    formData.append('image', elements.namedItem('image-user').files[0]);

    const code = ajaxMultipart('post', `http://localhost:5000/solicitud/pacientes/crear`, formData);

    if (isNaN(code)) {
        return;
    }

    switch (code) {
        case SUCCESS:
            message (messageForm,
            `<i class="fa-solid fa-check" style="color: green;"></i>
            <p>Paciente creado exitosamente.</p>`);
            buttonDisabled(buttonCreate);
            setTimeout(() => {
                hideModal(modal);
                reloadForm(form);
                buttonEnabled(buttonCreate);
                setTimeout(() => {
                    hideMessage(messageForm);
                }, 300);
                socket.timeout(2000).emit('patient/read', true, (error, response) => {});
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
    let data = users;
    const text = inputSeeker.value.trim(); 

    if (text.length > 0) {
        data = data.filter(user => user._name.includes(text) || user._email.includes(text));
    }
    if (!(data instanceof Array)) return;

    table.innerHTML = '';
    if (countUsers) countUsers.innerHTML = data.length;

    for (let i = 0; i < data.length; i++) {
        if (!(data[i] instanceof Object)) continue;
        if (!isset([data[i]._id, data[i]._name, data[i]._email, data[i]._updatedAt])) continue;
        if (!isDate(data[i]._updatedAt)) continue;

        let clone = templatePatient.content.cloneNode(true);
        let tr = clone.querySelector('tr');
        let cells = clone.querySelectorAll('td');
        let informationUser = clone.querySelector('.information-user');
        let img;
        let span;
        let profile;
        let imageContent;

        if (!isset([clone, tr, cells, informationUser])) continue;

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
                    if (span) span.textContent = data[i]._email;
                    break;
                    
                case 3:
                    span = cells[j].querySelector('span');
                    if (span) span.textContent = new Date(data[i]._updatedAt).toLocaleString();
                    break;
            }

            informationUser.dataset.id = data[i]._id;
        }

        tr.classList.remove('skeleton');
        table.append(tr);
    }

    if (data.length > 0) initInformation();
}

function edit(id) {
    if (!isset([users]) || !(users instanceof Array)) return;
    if (!isset([id]) || isNaN(id)) return;

    const indice = users.findIndex(x => x._id === Number(id));
    if (indice === -1) return;

    const user = users[indice];
    if (!isset(user) || !(user instanceof Object)) return;
    if (!isset(user._name, user._email, user._pass)) return;

    if (title) title.innerHTML = 'Paciente Registrado';
    showButton(buttonDelete);
    showButton(buttonUpdate);
    hideButton(buttonCreate);

    buttonDelete.dataset.id = id;
    buttonUpdate.dataset.id = id;
    
    if (form) reloadForm(form);
    if (messageForm) hideMessage(messageForm);

    const image = form.querySelector('.image-form');
    if (image) image.src = (isset([user._imageURL])) ? user._imageURL : '/images/user-solid.jpg';
    const elements = document.forms.namedItem(form.id).elements;
    const birthdate = new Date(user._birthdate);
    elements.namedItem('name').value = user._name;
    elements.namedItem('email').value = user._email;
    elements.namedItem('extension').value = user._extensionTelephone;
    elements.namedItem('telephone').value = user._telephone;
    elements.namedItem('birthdate').value = birthdate.getFullYear() + '-' + ("0" + (birthdate.getMonth() + 1)).slice(-2) + '-' + ("0" + birthdate.getDate()).slice(-2);
    elements.namedItem('pass').value = user._pass;
    elements.namedItem('confirm-pass').value = user._pass;
    
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
    formData.append('extension', elements.namedItem('extension').value);
    formData.append('telephone', elements.namedItem('telephone').value);
    formData.append('birthdate', elements.namedItem('birthdate').value.replace(/-/g, '\/'));
    formData.append('image', elements.namedItem('image-user').files[0]);

    const code = ajaxMultipart('POST', 'http://localhost:5000/solicitud/pacientes/actualizar', formData);

    if (isNaN(code)) {
        return;
    }

    switch (code) {
        case SUCCESS:
            message (messageForm,
            `<i class="fa-solid fa-check" style="color: green;"></i>
            <p>Paciente actualizado exitosamente.</p>`);
            buttonDisabled(buttonUpdate);
            buttonDisabled(buttonDelete);
            setTimeout(() => {
                buttonEnabled(buttonUpdate);
                buttonEnabled(buttonDelete);
                hideMessage(messageForm);
                socket.timeout(2000).emit('patient/read', true, (error, response) => {
                    if (!error) socket.emit('patient/updated', id);
                });
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
    if (!isset([id]) || isNaN(id)) return;

    const code = ajax('POST', 'http://localhost:5000/solicitud/pacientes/eliminar', {'id' : id});
    if (isNaN(code)) return;

    switch (code) {
        case SUCCESS:
            message (messageForm,
            `<i class="fa-solid fa-check" style="color: green;"></i>
            <p>Paciente eliminado exitosamente.</p>`);
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
                socket.timeout(2000).emit('patient/read', true, (error, response) => {
                    if (!error) socket.emit('patient/deleted', id);
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
    const buttonsView = document.querySelectorAll('.information-user');
    buttonsView.forEach(button => {
        button.addEventListener('click', () => {
            if (isset([button.dataset.id]) && !isNaN(button.dataset.id)) edit(button.dataset.id);
        });
    });
}

function copyright() {
    const copyright = document.getElementById('copyright-date');
    if (copyright) {
        copyright.innerHTML = new Date().getFullYear();
    }
}

function placeImage() {
    const input = document.forms.namedItem(form.id).elements.namedItem('image-user');
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
    for(let i = 0; i < limit; i++) {
        let clone = templatePatient.content.cloneNode(true);
        table.append(clone);
    }
}