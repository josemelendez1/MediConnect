import { socket } from "../../socket.js";
import { ajax, hideMessage, message } from "../../ajax.js";
import { ERROR, SUCCESS } from "../../codes.js";
import { isset, reloadForm, verifyField, verifyForm } from "../../form.js";
import { buttonSaveRecipe, buttonSaveRecord, optionsSelect } from "./appointments.js";
import { preescriptionMedications } from "./recipe.js";

export var form, elements, messageForm, buttonPrint, containerFormHidden;
export var medicalRecords, diagnosedDiseases = [];

document.addEventListener('DOMContentLoaded', function() {
    form = document.getElementById('form-record');
    messageForm = document.getElementById('message-record');
    if (form) elements = document.forms.namedItem(form.id).elements;
    buttonPrint = document.getElementById('button-print-medical-record');
    containerFormHidden = document.getElementById('form-hidden');

    socket.on('medical-record-eager/read', (data) => {
        if (!(data instanceof Array)) return;
        medicalRecords = data;
    });
    
    socket.on('medical-record/updated', (id) => {
        if (!isset([id]) || isNaN(id)) return;
        edit(id);
    })

    socket.emit('medical-record-eager/read', false, (error, response) => {});

    buttonPrint.addEventListener('click', () => {
        if (!print()) alert('Guarde el registro medico para poder imprimir.');
    });
});

export function save(id) {
    if (!isset([form])) return;
    if (!isset([elements])) return;
    if (!isset([id]) || isNaN(id)) return;
    if (!(medicalRecords instanceof Array)) return;
    if (!verifyField(elements.namedItem('risk'), form.id) || !verifyField(elements.namedItem('reason'), form.id)) return;

    const medicalRecord = medicalRecords.find(m => (m._appointment instanceof Object) && Number(m._appointment._id) === Number(id));
    const diseases = [];
    for (let i = 0; i < elements.namedItem('diseases').length; i++) {
        if (elements.namedItem('diseases')[i].selected) diseases.push(elements.namedItem('diseases')[i].value);
    }

    const data = {
        'id': (medicalRecord instanceof Object) ? medicalRecord._id : null,
        'idAppointment': id,
        'diseases': diseases, 
        'risk': elements.namedItem('risk').value,
        'reason': elements.namedItem('reason').value,
    };
    
    const code = ajax('post', 'http://localhost:5000/solicitud/registro-medico/actualizar', data);
    if (isNaN(code)) return;
    switch (code) {
        case SUCCESS:
            message(messageForm, 
            `<i class="fa-solid fa-check" style="color: green;"></i>
            <p>Registro medico guardado exitosamente.</p>`);
            setTimeout(async () => {
                hideMessage(messageForm);
                reloadForm(form);
                await socket.timeout(2000).emit('medical-record-eager/read', true, (error, response) => {
                    socket.emit('medical-record/updated', (Number(id)))
                });
            }, 3000);
            break;

        case ERROR:
            message (messageForm, 
                `<i class="fa-solid fa-triangle-exclamation" style="color: red;"></i>
                <p>Error en el servidor. Contáctenos si este persiste.</p>`);
            break;
    }
}

export async function edit(id) {
    if (!isset([id]) || isNaN(id)) return;
    if (!isset([elements])) return;
    if (!buttonSaveRecord || Number(buttonSaveRecord.dataset.id) !== Number(id)) return;
    if (!(medicalRecords instanceof Array)) return;

    const medicalRecord = medicalRecords.find(x => (x._appointment instanceof Object) && Number(x._appointment._id) === Number(id));
    let response = Object();

    if (medicalRecord instanceof Object) {
        buttonSaveRecipe.classList.remove('is-disabled');
        buttonSaveRecipe.title = '';
        elements.namedItem('risk').value = medicalRecord._risk;
        elements.namedItem('reason').value = medicalRecord._reason;
        diagnosedDiseases = medicalRecord._diagnosedDiseases.map(d => {return d._disease._id;});
    } else {
        diagnosedDiseases = [];
    }

    optionsSelect(diagnosedDiseases, preescriptionMedications);

    return response;
}

function print() {
    let done = false;
    let id = buttonPrint.dataset.id;
    if (!isset([containerFormHidden, id]) || isNaN(id)) return done;
    if (!(medicalRecords instanceof Array)) return done;

    const medicalRecord = medicalRecords.find(x => (x._appointment instanceof Object) && Number(x._appointment._id) === Number(id));
    if (!(medicalRecord instanceof Object)) return done;

    const form = document.createElement('form');
    form.method = 'post';
    form.action = 'http://localhost:5000/solicitud/registro-medico/imprimir';
    form.target = '_blank';

    const input = document.createElement('input');
    input.name = 'id';
    input.type = 'text';
    input.value = medicalRecord._id;

    containerFormHidden.innerHTML = '';
    containerFormHidden.appendChild(form);
    form.appendChild(input);
    form.submit();
    input.value = '';

    return !done;
}