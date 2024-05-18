import { ajax, hideMessage, message } from "../../ajax.js";
import { ERROR, NOT_ALLOWED, SUCCESS } from "../../codes.js";
import { isset, reloadField, reloadForm, verifyForm } from "../../form.js";
import { hideModal, showModal } from "../../modal.js";
import { socket } from "../../socket.js";
import dataPhones from "../../codes-phone.json" with {type: 'json'};

var modal, form, messageForm, buttonShow, buttonHide, buttonRegister, buttonShowLogin, buttonsShowSession;
var date = new Date();

document.addEventListener('DOMContentLoaded', function() {
    modal = document.querySelector('.modal-register');
    form = document.getElementById('form-register');
    messageForm = document.getElementById('message-register');
    buttonShow = document.getElementById('button-show-register');
    buttonHide = document.getElementById('button-hide-register');
    buttonRegister = document.getElementById('button-register');
    buttonShowLogin =  document.getElementById('button-show-login');
    buttonsShowSession = document.querySelectorAll('.button-session');
    
    if (isset([modal, form, messageForm, buttonShow, buttonHide, buttonRegister])) {
        buttonShow.addEventListener('click', function() {
            showModal(modal);
            document.body.style.overflow = 'hidden';
        });

        buttonHide.addEventListener('click', function() {
            hideModal(modal);
            reloadForm(form);
            hideMessage(messageForm);
            document.body.style.overflow = 'auto';
        });
        
        buttonRegister.addEventListener('click', function() { 
            if (verifyForm(form) && document.forms.namedItem(form.id).elements.namedItem('check-terms').checked) {
                register();
            }
        });

        if (buttonShowLogin) buttonShowLogin.addEventListener('click', function() {
            buttonHide.click();

            if (buttonsShowSession) buttonsShowSession.forEach(element => {
                if (!isset([element.dataset.id])) return;
                if (element.dataset.id === 'patient') element.click();
            });
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
        
        let telephoneField = document.forms.namedItem(form.id).elements.namedItem('telephone');
        if (telephoneField) telephoneField.addEventListener('input', () => {
            if (telephoneField.value.length > telephoneField.maxLength) telephoneField.value = telephoneField.value.slice(0, telephoneField.maxLength); 
        });
    }
});

function register() {
    if (!isset([form.id])) return;
    const elements = document.forms.namedItem(form.id).elements;
    
    if (!isset([elements])) return;
    const data = {
        'name': elements.namedItem('name').value,
        'email': elements.namedItem('email').value,
        'pass': elements.namedItem('pass').value,
        'extension': elements.namedItem('extension').value,
        'telephone': elements.namedItem('telephone').value,
        'birthdate': elements.namedItem('birthdate').value,
    }

    const code = ajax('post', 'http://localhost:5000/solicitud/pacientes/crear', data);
    if (isNaN(code)) return;

    switch (code) {
        case SUCCESS:
            message(messageForm, 
            `<i class="fa-solid fa-check" style="color: green;"></i>
            <p>Registrado exitosamente.</p>`);
            setTimeout(() => {
                hideMessage(messageForm);
                socket.timeout(2000).emit('patient/read', true, (error, response) => {});
                socket.emit('users/length', true);
                location.href = 'http://localhost:5000/paciente/';
            }, 3000);
            break;
        
        case NOT_ALLOWED:
            message (messageForm, 
            `<i class="fa-solid fa-circle-exclamation" style="color: red;"></i>
            <p>Correo y/o contraseña ya utilizados, Inténtelo nuevamente.</p>`);
            reloadField(elements.namedItem('pass'), form.id);
            reloadField(elements.namedItem('confirm-pass'), form.id);
            setTimeout(() => {hideMessage(messageForm)}, 3000);
            break;
        
        case ERROR:
            message (messageForm, 
            `<i class="fa-solid fa-triangle-exclamation" style="color: red;"></i>
            <p>Error en el servidor. Contáctenos si este persiste.</p>`);
            setTimeout(() => {hideMessage(messageForm)}, 3000);
            break;
    }
}