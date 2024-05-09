import { ajax, ajaxMultipart, hideMessage, message } from "../../ajax.js";
import { hideButton, hideModal, showButton, showModal } from "../../modal.js";
import { SUCCESS, ERROR } from "../../codes.js";
import { buttonDisabled, buttonEnabled, isDate, isset, reloadField, reloadForm, verifyForm, verifyImage } from "../../form.js";
import { socket } from "../../socket.js";

var limit = 12;
var offset = 0;
var diseasesData = [];
var administradorsData = [];
var diseases, prevDiseases, nextDiseases, form, title, count, modal, messageForm, inputSeeker, buttonCreate, buttonUpdate, buttonDelete, buttonShowModal, buttonHideModal, template;

socket.on('disease/read', (diseases) => {
    if (!(diseases instanceof Array)) return;
    administradorsData = ajax('POST', 'http://localhost:5000/solicitud/administrador/leer', {});
    diseasesData = diseases;
    setTimeout(read, 500);
});

socket.on('disease/updated', (id) => {
    if (!isset([id])) return;
    if (!modal.classList.contains('modal-open')) return;
    if (buttonUpdate.classList.contains('button-none')) return;
    if (!isset([buttonUpdate.dataset.id]) || isNaN(buttonUpdate.dataset.id)) return;

    if (id.toString() === buttonUpdate.dataset.id.toString()) {
        edit(id);
    }
});

socket.on('disease/deleted', (id) => {
    if (!isset([id])) return;
    if (!modal.classList.contains('modal-open')) return;
    if (buttonDelete.classList.contains('button-none')) return;
    if (!isset([buttonDelete.dataset.id]) || isNaN(buttonDelete.dataset.id)) return;
    
    if (id.toString() === buttonDelete.dataset.id.toString()) {
        message( messageForm,
            `<i class="fa-solid fa-check" style="color: green;"></i>
            <p>Enfermedad eliminada exitosamente.</p>`
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
        }, 2000);
        document.body.style.overflowY = 'auto';
    }
});

document.addEventListener("DOMContentLoaded", function() {
    diseases = document.getElementById('diseases');
    prevDiseases = document.getElementById('prev-diseases');
    nextDiseases = document.getElementById('next-diseases');
    form = document.getElementById('form-diseases');
    title = document.getElementById('title-diseases');
    count = document.getElementById('count-diseases');
    modal = document.getElementById('modal-diseases');
    messageForm = document.getElementById('message-diseases');
    inputSeeker = document.getElementById('input-seeker');
    buttonCreate = document.getElementById('button-create-diseases');
    buttonUpdate = document.getElementById('button-update-diseases');
    buttonDelete = document.getElementById('button-delete-diseases');
    buttonShowModal = document.getElementById('button-show-modal-diseases');
    buttonHideModal = document.getElementById('button-hide-modal-diseases');
    template = document.getElementById('template-disease');
    
    copyright();

    if (diseases && prevDiseases && nextDiseases && form && title && count && modal && messageForm && inputSeeker && buttonCreate && buttonUpdate && buttonDelete && buttonShowModal && buttonHideModal && template) {
        placeImage();
        skeleton();
        socket.emit('disease/read', false, (error, response) => {});
        
        buttonShowModal.addEventListener('click', function() {
            const image = document.querySelector('.image-form');
            if (image) image.src = '/images/disease-default.jpg';
            showButton(buttonCreate);
            hideButton(buttonDelete);
            hideButton(buttonUpdate);
            reloadForm(form);
            hideMessage(messageForm);
            title.innerHTML = 'Nueva Enfermedad';
            document.body.style.overflowY = 'hidden';
            showModal(modal);
        });

        buttonHideModal.addEventListener('click', function() {
            hideModal(modal);
            reloadForm(form);
            hideMessage(messageForm);
            document.body.style.overflowY = 'auto';
        });

        buttonCreate.addEventListener('click', function() {
            if (!buttonCreate.classList.contains('is-disabled') && verifyForm(form)) {
                create();
            }
        });

        prevDiseases.addEventListener('click', function() {
            prev();
        });

        nextDiseases.addEventListener('click', function() {
            next();
        });

        buttonUpdate.addEventListener('click', function() {
            if (isset([buttonUpdate.dataset.id]) && buttonUpdate.dataset.id.trim() !== '' && !isNaN(buttonUpdate.dataset.id) && diseasesData.findIndex(x => x._id === Number(buttonUpdate.dataset.id)) !== -1) {
                update(buttonUpdate.dataset.id);
            }
        });

        buttonDelete.addEventListener('click', function() {
            if (isset([buttonDelete.dataset.id]) && buttonDelete.dataset.id.trim() !== '' && !isNaN(buttonDelete.dataset.id) && diseasesData.findIndex(x => x._id === Number(buttonDelete.dataset.id)) !== -1) {
                remove(buttonDelete.dataset.id);
            }
        });

        inputSeeker.addEventListener('input', function() {
            offset = 0;
            read();
        });
    }
});

function create() {
    const elements = document.forms.namedItem(form.id).elements;
    const formData = new FormData();
    formData.append('name', elements.namedItem('name').value);
    formData.append('scientificName', elements.namedItem('scientificName').value);
    formData.append('severity', elements.namedItem('severity').value);
    formData.append('description', elements.namedItem('description').value);
    formData.append('image', elements.namedItem('image-disease').files[0]);

    const code = ajaxMultipart(form.method, `http://localhost:5000/solicitud/enfermedades/crear`, formData);

    if (isNaN(code)) {
        return;
    }

    switch (code) {
        case SUCCESS:
            message (messageForm,
            `<i class="fa-solid fa-check" style="color: green;"></i>
            <p>Enfermedad creada exitosamente.</p>`);
            buttonDisabled(buttonCreate);
            setTimeout(() => {
                hideModal(modal);
                reloadForm(form);
                buttonEnabled(buttonCreate);
                document.body.style.overflowY = 'auto';
                setTimeout(() => {
                    hideMessage(messageForm);
                }, 300);
                socket.emit('disease/read', true, (error, response) => {});
                socket.emit('diseases/length', true);
            }, 2000);
            break;

        case ERROR:
            message (messageForm, 
            `<i class="fa-solid fa-triangle-exclamation" style="color: red;"></i>
            <p>Error en el servidor. Contáctenos si este persiste.</p>`);
            break;
    }
}

function read() {
    console.log(administradorsData);
    let data = diseasesData.toReversed();
    if (inputSeeker.value.trim().length > 0) data = data.filter(x => x._name.includes(inputSeeker.value.trim()));
    if (!(data instanceof Array) || !(administradorsData instanceof Array)) return;
    count.innerHTML = `Mostrando <b>${(offset + 1 > data.length) ? data.length : (offset + 1)}</b> a <b>${(offset + limit > data.length) ? data.length : (offset + limit) }</b> de <b>${data.length}</b> Enfermedades.`;

    if (data.length === 0) {
        diseases.innerHTML = '<p class="absolute-center-text">No Hay Información <i class="fa-regular fa-folder-open"></i></p>';
        if (!diseases.classList.contains('height-35rem')) {
            diseases.classList.add('height-35rem');
        }
        return;
    }
    if (diseases.classList.contains('height-35rem')) diseases.classList.remove('height-35rem');

    diseases.innerHTML = '';
    let user = undefined;
    const dataWithLimit = data.slice(offset, (offset + limit));

    for (let i = 0; i < dataWithLimit.length; i++) {
        if (!isset([dataWithLimit[i], dataWithLimit[i]._id, dataWithLimit[i]._name, dataWithLimit[i].createdAt]) && isDate(dataWithLimit[i].createdAt)) continue;
        
        let clone = template.content.cloneNode(true);
        let disease = clone.querySelector('.disease');
        let titleDisease = clone.querySelector('.title');
        let subtitleDisease = clone.querySelector('.subtitle');
        let titleUser = clone.querySelector('.title-user');
        let subtitleUser = clone.querySelector('.subtitle-user');
        let informationDisease = clone.querySelector('.information-disease');
        let contentImageDisease = clone.querySelector('.image');
        let contentImageUser = clone.querySelector('.image-user');
        let imageDisease = document.createElement('img');
        let imageUser = document.createElement('img');

        if (!isset([clone, disease, titleDisease, subtitleDisease, titleUser, subtitleUser, informationDisease, contentImageDisease, contentImageUser, imageDisease, imageUser])) continue;

        titleDisease.textContent = dataWithLimit[i]._name;
        subtitleDisease.textContent = new Date(dataWithLimit[i].createdAt).toLocaleString();

        imageDisease.onload = function () {
            contentImageDisease.classList.remove('skeleton');
            contentImageDisease.append(imageDisease);
        };

        imageDisease.src = isset([dataWithLimit[i]._imageURL]) ? dataWithLimit[i]._imageURL : '/images/disease-default.jpg';
        imageDisease.alt = 'Imagen de Enfermedad';
        contentImageDisease.classList.add('skeleton');

        informationDisease.dataset.id = dataWithLimit[i]._id;

        if (isset([administradorsData, dataWithLimit[i]._idAdministrator]) && !isNaN(dataWithLimit[i]._idAdministrator)) {
            user = administradorsData[administradorsData.findIndex(x => x._id == dataWithLimit[i]._idAdministrator)];
        }
        
        imageUser.onload = function () {
            contentImageUser.classList.remove('skeleton');
            contentImageUser.append(imageUser);
        };

        imageUser.src = isset([user._imageURL]) ? user._imageURL : '/images/user-solid.jpg';
        imageUser.alt = 'Imagen de Usuario';
        contentImageUser.classList.add('skeleton');

        titleUser.textContent = isset([user._name]) ? user._name : 'Desconocido.';
        subtitleUser.textContent = isset([user._email]) ? user._email : 'Email Desconocido.';

        disease.classList.remove('skeleton');
        diseases.append(disease);
    }

    if (diseasesData.length > 0) initClicksDiseases();
}

function update(id) {
    const elements = document.forms.namedItem(form.id).elements;
    const formData = new FormData();
    formData.append('id', id);
    formData.append('name', elements.namedItem('name').value);
    formData.append('scientificName', elements.namedItem('scientificName').value);
    formData.append('severity', elements.namedItem('severity').value);
    formData.append('description', elements.namedItem('description').value);
    formData.append('image', elements.namedItem('image-disease').files[0]);


    const code = ajaxMultipart(form.method, 'http://localhost:5000/solicitud/enfermedades/actualizar', formData);

    if (isNaN(code)) {
        return;
    }

    switch (code) {
        case SUCCESS:
            message (messageForm,
            `<i class="fa-solid fa-check" style="color: green;"></i>
            <p>Enfermedad actualizada exitosamente.</p>`);
            buttonDisabled(buttonUpdate);
            buttonDisabled(buttonDelete);
            setTimeout(() => {
                buttonEnabled(buttonUpdate);
                buttonEnabled(buttonDelete);
                hideMessage(messageForm);
                socket.timeout(2000).emit('disease/read', true, (error, response) => {
                    if (!error) socket.emit('disease/updated', id);
                });
            }, 2000);
            break;

        case ERROR:
            message (messageForm, 
            `<i class="fa-solid fa-triangle-exclamation" style="color: red;"></i>
            <p>Error en el servidor. Contáctenos si este persiste.</p>`);
            break;
    }
}

function remove(id) {
    const data = {
        'id' : id,
    }

    const code = ajax('POST', 'http://localhost:5000/solicitud/enfermedades/eliminar', data);

    if (isNaN(code)) {
        return;
    }

    switch (code) {
        case SUCCESS:
            message (messageForm,
            `<i class="fa-solid fa-check" style="color: green;"></i>
            <p>Enfermedad eliminada exitosamente.</p>`);
            buttonDisabled(buttonUpdate);
            buttonDisabled(buttonDelete);
            setTimeout(() => {
                hideModal(modal);
                reloadForm(form);
                buttonEnabled(buttonUpdate);
                buttonEnabled(buttonDelete);
                document.body.style.overflowY = 'auto';
                setTimeout(() => {
                    hideMessage(messageForm);
                }, 300);
                socket.timeout(2000).emit('disease/read', true, (error, response) => {
                    if (!error) socket.emit('disease/deleted', id);
                });
                socket.emit('diseases/length', true);
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
    const indice = diseasesData.findIndex(x => x._id === Number(id));
    
    if (indice === -1) {
        return;
    }

    const disease = diseasesData[indice];

    if (!isset([disease]) || !(disease instanceof Object) || !isset([disease._id, disease._name, disease._scientificName, disease._severity, disease._description])) {
        return;
    }

    title.innerHTML = disease._name;
    showButton(buttonDelete);
    showButton(buttonUpdate);
    hideButton(buttonCreate);

    buttonDelete.dataset.id = id;
    buttonUpdate.dataset.id = id;
    
    reloadForm(form);
    hideMessage(messageForm);

    const image = form.querySelector('.image-form');
    if (image) image.src = (disease._imageURL !== undefined) ? disease._imageURL : '/images/disease-default.jpg';

    const elements = document.forms.namedItem(form.id).elements;
    elements.namedItem('name').value = disease._name;
    elements.namedItem('scientificName').value = disease._scientificName;
    elements.namedItem('severity').value = disease._severity;
    elements.namedItem('description').value = disease._description;

    document.body.style.overflowY = 'hidden';
    showModal(modal);
}

function next() {
    const data = (inputSeeker.value.trim() === '') ? diseasesData.toReversed().filter(x => x._idAdministrator !== null) : diseasesData.toReversed().filter(x => x._idAdministrator !== null && x._name.includes(inputSeeker.value.trim()));
    if ((offset + limit) < data.length) {
        offset += limit;
        read();
    }
}

function prev() {
    if (offset >= limit) {
        offset -= limit;
        read();
    }
}

function initClicksDiseases() {
    const buttonsView = document.querySelectorAll('.information-disease');
    buttonsView.forEach(button => {
        if (isset([button.dataset.id]) && button.dataset.id.trim() !== '' && !isNaN(button.dataset.id)) {
            button.addEventListener('click', () => {
                edit(button.dataset.id);
            });
        }
    });
}

function copyright() {
    const copyright = document.getElementById('copyright-date');
    if (copyright) {
        copyright.innerHTML = new Date().getFullYear();
    }
}

function placeImage() {
    const input = document.forms.namedItem(form.id).elements.namedItem('image-disease');
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
                    image.src = '/images/disease-default.jpg';
                }
            } else {
                image.src = '/images/disease-default.jpg';   
            }
        });
    }
}

function skeleton() {
    for (let i = 0; i < limit; i++) {
        let clone = template.content.cloneNode(true);
        diseases.append(clone);
    }
}