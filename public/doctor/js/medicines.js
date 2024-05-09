import { ajax, ajaxMultipart, hideMessage, message } from "../../ajax.js";
import { hideButton, hideModal, showButton, showModal } from "../../modal.js";
import { SUCCESS, ERROR } from "../../codes.js";
import { buttonDisabled, buttonEnabled, isDate, isset, reloadForm, verifyForm, verifyImage } from "../../form.js";
import { socket } from "../../socket.js";

var limit = 12;
var offset = 0;
var medicinesData = [];
var medicines, prevMedicines, nextMedicines, form, title, count, modal, messageForm, inputSeeker, buttonCreate, buttonUpdate, buttonDelete, buttonShowModal, buttonHideModal, template;

socket.on('medicine/read', (medicines) => {
    if (!(medicines instanceof Array)) return;
    medicinesData = medicines;
    setTimeout(() => {
        read();
    }, 500);
});

socket.on('medicine/updated', (id) => {
    if (!isset([id])) return;
    if (!modal.classList.contains('modal-open')) return;
    if (buttonUpdate.classList.contains('button-none')) return;
    if (!isset([buttonUpdate.dataset.id]) || isNaN(buttonUpdate.dataset.id)) return;

    if (id.toString() === buttonUpdate.dataset.id.toString()) {
        edit(id);
    }
});

socket.on('medicine/deleted', (id) => {
    if (!isset([id])) return;
    if (!modal.classList.contains('modal-open')) return;
    if (buttonDelete.classList.contains('button-none')) return;
    if (!isset([buttonDelete.dataset.id]) || isNaN(buttonDelete.dataset.id)) return;
    
    if (id.toString() === buttonDelete.dataset.id.toString()) {
        message( messageForm,
            `<i class="fa-solid fa-check" style="color: green;"></i>
            <p>Medicina eliminada exitosamente.</p>`
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
    medicines = document.getElementById('medicines');
    prevMedicines = document.getElementById('prev-medicines');
    nextMedicines = document.getElementById('next-medicines');
    form = document.getElementById('form-medicines');
    title = document.getElementById('title-medicines');
    count = document.getElementById('count-medicines');
    modal = document.getElementById('modal-medicines');
    messageForm = document.getElementById('message-medicines');
    inputSeeker = document.getElementById('input-seeker'); 
    buttonCreate = document.getElementById('button-create-medicines');
    buttonUpdate = document.getElementById('button-update-medicines');
    buttonDelete = document.getElementById('button-delete-medicines');
    buttonShowModal = document.getElementById('button-show-modal-medicines');
    buttonHideModal = document.getElementById('button-hide-modal-medicines');
    template = document.getElementById('template-medicine');
    
    copyright();

    if (medicines && prevMedicines && nextMedicines && form && title && count && modal && messageForm && inputSeeker && buttonCreate && buttonUpdate && buttonDelete && buttonShowModal && buttonHideModal && template) {
        skeleton();
        placeImage();
        socket.emit('medicine/read', false, (error, response) => {});
        
        buttonShowModal.addEventListener('click', function() {
            const image = document.querySelector('.image-form');
            if (image) image.src = '/images/medicine-default.jpg';
            showButton(buttonCreate);
            hideButton(buttonDelete);
            hideButton(buttonUpdate);
            reloadForm(form);
            hideMessage(messageForm);
            title.innerHTML = 'Nueva Medicina';
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

        prevMedicines.addEventListener('click', function() {
            prev();
        });

        nextMedicines.addEventListener('click', function() {
            next();
        });

        buttonUpdate.addEventListener('click', function() {
            if (isset([buttonUpdate.dataset.id]) && buttonUpdate.dataset.id.trim() !== '' && !isNaN(buttonUpdate.dataset.id) && medicinesData.findIndex(x => x._id === Number(buttonUpdate.dataset.id)) !== -1) {
                update(buttonUpdate.dataset.id);
            }
        });

        buttonDelete.addEventListener('click', function() {
            if (isset([buttonDelete.dataset.id]) && buttonDelete.dataset.id.trim() !== '' && !isNaN(buttonDelete.dataset.id) && medicinesData.findIndex(x => x._id === Number(buttonDelete.dataset.id)) !== -1) {
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
    formData.append('quantities', elements.namedItem('quantities').value);
    formData.append('presentations', elements.namedItem('presentations').value);
    formData.append('information', elements.namedItem('information').value);
    formData.append('image', elements.namedItem('image-medicine').files[0]);

    const code = ajaxMultipart(form.method, 'http://localhost:5000/solicitud/medicinas/crear', formData);

    if (isNaN(code)) {
        return;
    }

    switch (code) {
        case SUCCESS:
            message (messageForm,
            `<i class="fa-solid fa-check" style="color: green;"></i>
            <p>Medicina creada exitosamente.</p>`);
            buttonDisabled(buttonCreate);
            setTimeout(() => {
                hideModal(modal);
                reloadForm(form);
                buttonEnabled(buttonCreate);
                document.body.style.overflowY = 'auto';
                setTimeout(() => {
                    hideMessage(messageForm);
                }, 300);
            }, 2000);
            socket.emit('medicine/read', true, (error, response) => {});
            socket.emit('medicines/length', true);
            break;

        case ERROR:
            message (messageForm, 
            `<i class="fa-solid fa-triangle-exclamation" style="color: red;"></i>
            <p>Error en el servidor. Contáctenos si este persiste.</p>`);
            break;
    }
}

function edit(id) {
    const indice = medicinesData.findIndex(x => x._id === Number(id));
    
    if (indice === -1) {
        return;
    }

    const medicine = medicinesData[indice];

    if (!isset([medicine]) || !(medicine instanceof Object) || !isset([medicine._id, medicine._name, medicine._quantities, medicine._presentations, medicine._information])) {
        return;
    }

    title.innerHTML = medicine._name;
    showButton(buttonDelete);
    showButton(buttonUpdate);
    hideButton(buttonCreate);

    buttonDelete.dataset.id = id;
    buttonUpdate.dataset.id = id;
    
    reloadForm(form);
    hideMessage(messageForm);

    const image = form.querySelector('.image-form');
    if (image) image.src = (medicine._imageURL !== undefined) ? medicine._imageURL : '/images/medicine-default.jpg';

    const elements = document.forms.namedItem(form.id).elements;
    elements.namedItem('name').value = medicine._name;
    elements.namedItem('quantities').value = medicine._quantities;
    elements.namedItem('presentations').value = medicine._presentations;
    elements.namedItem('information').value = medicine._information;

    document.body.style.overflowY = 'hidden';
    showModal(modal);
}

function update(id) {
    const elements = document.forms.namedItem(form.id).elements;
    const formData = new FormData();
    formData.append('id', id);
    formData.append('name', elements.namedItem('name').value);
    formData.append('quantities', elements.namedItem('quantities').value);
    formData.append('presentations', elements.namedItem('presentations').value);
    formData.append('information', elements.namedItem('information').value);
    formData.append('image', elements.namedItem('image-medicine').files[0]);

    const code = ajaxMultipart(form.method, 'http://localhost:5000/solicitud/medicinas/actualizar', formData);

    if (isNaN(code)) {
        return;
    }

    switch (code) {
        case SUCCESS:
            message (messageForm,
            `<i class="fa-solid fa-check" style="color: green;"></i>
            <p>Medicina actualizada exitosamente.</p>`);
            buttonDisabled(buttonUpdate);
            buttonDisabled(buttonDelete);
            setTimeout(() => {
                buttonEnabled(buttonUpdate);
                buttonEnabled(buttonDelete);
                hideMessage(messageForm);
                socket.timeout(2000).emit('medicine/read', true, (error, response) => {
                    if (!error) socket.emit('medicine/updated', id);
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
    const code = ajax('POST', 'http://localhost:5000/solicitud/medicinas/eliminar', { 'id': id });

    if (isNaN(code)) {
        return;
    }

    switch (code) {
        case SUCCESS:
            message (messageForm,
            `<i class="fa-solid fa-check" style="color: green;"></i>
            <p>Medicina eliminada exitosamente.</p>`);
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
                socket.timeout(2000).emit('medicine/read', true, (error, response) => {
                    if (!error) socket.emit('medicine/deleted', id);
                });
                socket.emit('medicines/length', true);
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
    let data = medicinesData.toReversed();

    if (inputSeeker.value.trim().length > 0) {
        data = data.filter(x => x._name.includes(inputSeeker.value.trim()));
    }

    count.innerHTML = `Mostrando <b>${((offset + 1) > data.length) ? data.length : (offset + 1) }</b> a <b>${((offset + limit) > data.length) ? data.length : (offset + limit) }</b> de <b>${data.length}</b> Medicinas.`;

    if (data.length === 0) {
        medicines.innerHTML = '<p class="absolute-center-text">No Hay Información <i class="fa-regular fa-folder-open"></i></p>';
        if (!medicines.classList.contains('height-35rem')) {
            medicines.classList.add('height-35rem');
        }
        return;
    }
    if (medicines.classList.contains('height-35rem')) medicines.classList.remove('height-35rem');

    const dataWithLimit = data.slice(offset, (offset + limit));
    medicines.innerHTML = '';

    for (let i = 0; i < dataWithLimit.length; i++) {
        
        if (!isset([dataWithLimit[i], dataWithLimit[i]._id, dataWithLimit[i]._name, dataWithLimit[i].createdAt]) && !isDate(dataWithLimit[i].createdAt)) continue;
        let clone = template.content.cloneNode(true);
        let medicine = clone.querySelector('.medicine');
        let img = document.createElement('img');
        let contentImage = clone.querySelector('.image');
        let title = clone.querySelector('.title');
        let subtitle = clone.querySelector('.subtitle');
        let informationMedicine = clone.querySelector('.information-medicine');

        title.textContent = dataWithLimit[i]._name;
        subtitle.textContent = new Date(dataWithLimit[i].createdAt).toLocaleString();
        informationMedicine.dataset.id = dataWithLimit[i]._id;

        img.onload = function () {
            contentImage.classList.remove('skeleton');
            contentImage.append(img);
        };

        contentImage.classList.add('skeleton');
        img.src = dataWithLimit[i]._imageURL !== undefined ? dataWithLimit[i]._imageURL : '/images/medicine-default.jpg';
        img.alt = 'Imagen de Medicina';

        medicine.classList.remove('skeleton');

        medicines.append(medicine);
    }

    if (data.length > 0) initClicksMedicines();
}

function next() {
    const data = (inputSeeker.value.trim() === '') ? medicinesData.toReversed().filter(x => x._idAdministrator !== null) : medicinesData.toReversed().filter(x => x._name.includes(inputSeeker.value.trim()));
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

function copyright() {
    const copyright = document.getElementById('copyright-date');
    if (copyright) {
        copyright.innerHTML = new Date().getFullYear();
    }
}

function initClicksMedicines() {
    const buttonsView = document.querySelectorAll('.information-medicine');
    buttonsView.forEach(button => {
        if (isset([button.dataset.id]) && button.dataset.id.trim() !== '' && !isNaN(button.dataset.id)) {
            button.addEventListener('click', () => {
                edit(button.dataset.id);
            });
        }
    });
}

function placeImage() {
    const input = document.forms.namedItem(form.id).elements.namedItem('image-medicine');
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
                    image.src = '/images/medicine-default.jpg';
                }
            } else {
                image.src = '/images/medicine-default.jpg';   
            }
        });
    }
}

function skeleton() {
    for (let i = 0; i < limit; i++) {
        let clone = template.content.cloneNode(true);
        medicines.append(clone);
    }
}