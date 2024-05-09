import { hideModal, showModal } from "../../modal.js";
import { ajax, hideMessage, message } from "../../ajax.js";
import { isset, reloadField, reloadForm, verifyForm } from "../../form.js";
import { SUCCESS, NOT_ALLOWED, ERROR } from "../../codes.js";

document.addEventListener('DOMContentLoaded', function () {
    const formMessage = document.getElementById('message');
    const formSession = document.getElementById('form-session');
    const modalSession = document.getElementById('modal-session');
    const buttonSession = document.getElementById('button-session');
    const buttonsShowSession = document.querySelectorAll('.button-session');
    const buttonHideSession = document.getElementById('button-hide-session'); 

    if (formMessage  && formSession && modalSession && buttonSession && buttonHideSession) {
        buttonHideSession.addEventListener('click', () => {
            hideModal(modalSession);
            reloadForm(formSession);
            hideMessage(formMessage);
            document.body.style.overflow = 'auto';
        });

        buttonSession.addEventListener('click', () => {
            if (verifyForm(formSession)) {
                session(formSession, formMessage);
            }
        });

        buttonsShowSession.forEach(button => {
            button.addEventListener('click', () => {
                let dataId = button.dataset.id;
                if (!isset([dataId])) return;

                switch (dataId) {
                    case 'patient':
                        formSession.action = 'http://localhost:5000/solicitud/paciente/sesion';
                        break;
                    case 'doctor':
                        formSession.action = 'http://localhost:5000/solicitud/doctor/sesion';
                        break;
                    case 'assistant':
                        formSession.action = 'http://localhost:5000/solicitud/asistente/sesion';
                        break;
                    case 'administrator':
                        formSession.action = 'http://localhost:5000/solicitud/administrador/sesion';
                        break;
                }
                
                if (!isset([formSession.action])) return;

                showModal(modalSession);
                document.body.style.overflow = 'hidden';
            });
        });
    }
});

function session(form, formMessage) {
    if (!isset([form.action])) return;
    let redirect;
    
    switch (form.action) {
        case 'http://localhost:5000/solicitud/paciente/sesion':
            redirect = 'http://localhost:5000/paciente';
            break;
        case 'http://localhost:5000/solicitud/doctor/sesion':
            redirect = 'http://localhost:5000/doctor';
            break;
        case 'http://localhost:5000/solicitud/asistente/sesion':
            redirect = 'http://localhost:5000/asistente';
            break;
        case 'http://localhost:5000/solicitud/administrador/sesion':
            redirect = 'http://localhost:5000/administrador';
            break;
    }

    if (!isset([redirect])) return;

    const data = {
        'email': document.forms.namedItem(form.id).elements['email'].value,
        'pass': document.forms.namedItem(form.id).elements['pass'].value
    };

    const code = ajax('post', form.action, data);

    if (isNaN(code)) return;

    switch (code) {
        case SUCCESS:
            message (formMessage,
            `<i class="fa-solid fa-check" style="color: green;"></i>
            <p>Accediendo al sistema.</p>`);
            setTimeout(() => {
                location.href = redirect;
            }, 1000);
            break;

        case NOT_ALLOWED:
            message (formMessage, 
            `<i class="fa-solid fa-circle-exclamation" style="color: red;"></i>
            <p>Correo y/o contraseña incorrectos. Inténtelo nuevamente.</p>`);
            reloadField(document.forms.namedItem(form.id).elements['pass'], form.id);
            break;

        case ERROR:
            message (formMessage, 
            `<i class="fa-solid fa-triangle-exclamation" style="color: red;"></i>
            <p>Error en el servidor. Contáctenos si este persiste.</p>`);
            break;
    }
}