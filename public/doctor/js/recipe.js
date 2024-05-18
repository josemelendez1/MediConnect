import { socket } from "../../socket.js";
import { ajax, hideMessage, message } from "../../ajax.js";
import { ERROR, NOT_ALLOWED, SUCCESS } from "../../codes.js";
import { isset, reloadForm, verifyField } from "../../form.js";
import { appointments, buttonSaveRecipe, buttonSaveRecord, optionsSelect } from "./appointments.js";
import { diagnosedDiseases, medicalRecords } from "./record-medical.js";

export var form, elements, messageForm, buttonPrint, containerFormHidden;
export var recipes, preescriptionMedications = [];

document.addEventListener('DOMContentLoaded', function() {
    form = document.getElementById('form-recipe');
    messageForm = document.getElementById('message-recipe');
    if (form) elements = document.forms.namedItem(form.id).elements;
    buttonPrint = document.getElementById('button-print-recipe');
    containerFormHidden = document.getElementById('form-hidden');

    socket.on('recipe-eager/read', (data) => {
        if (!(data instanceof Array)) return;
        recipes = data;
    });
    
    socket.on('recipe/updated', (id) => {
        if (!isset([id]) || isNaN(id)) return;
        edit(id);
    })

    socket.emit('recipe-eager/read', false, (error, response) => {});

    buttonPrint.addEventListener('click', () => {
        if (!print()) alert('Guarde la receta medica para poder imprimir.');
    });
});

export function save(id) {
    if (!isset([form])) return;
    if (!isset([elements])) return;
    if (!isset([id]) || isNaN(id)) return;
    if (!(appointments instanceof Array)) return;
    if (buttonSaveRecipe.classList.contains('is-disabled')) return;
    if (!verifyField(elements.namedItem('preescription'), form.id)) return;

    let patient, appointment, medicalRecord;
    appointment = appointments.find(x => Number(x._id) === Number(id));
    if (appointment instanceof Object) {
        medicalRecord = appointment._medicalRecord;
        patient = appointment._patient;
    }

    if (!(appointment instanceof Object) || !(patient instanceof Object) || !(medicalRecord instanceof Object)) return;

    const medicines = [];
    for (let i = 0; i < elements.namedItem('medicines').length; i++) {
        let option = elements.namedItem('medicines')[i];
        if (option.selected) medicines.push(option.value);
    }

    const data = {
        'id': ((medicalRecord._recipe instanceof Object)) ? medicalRecord._recipe._id : null,
        'idRecord': medicalRecord._id,
        'medicines': medicines,
        'preescription': elements.namedItem('preescription').value,
    };
    
    const code = ajax('post', 'http://localhost:5000/solicitud/recetas/actualizar', data);
    if (isNaN(code)) return;
    switch (code) {
        case SUCCESS:
            message(messageForm, 
            `<i class="fa-solid fa-check" style="color: green;"></i>
            <p>Receta medica guardado exitosamente.</p>`);
            setTimeout(async () => {
                hideMessage(messageForm);
                reloadForm(form);
                await socket.timeout(2000).emit('recipe-eager/read', true, (error, response) => {
                    socket.emit('recipe/updated', (Number(id)))
                });
                socket.emit('appointment-patient-eager/read', patient._id, true, (error, response) => {});
            }, 3000);
            break;

        case ERROR:
            message (messageForm, 
                `<i class="fa-solid fa-triangle-exclamation" style="color: red;"></i>
                <p>Error en el servidor. Contáctenos si este persiste.</p>`);
            break;
        case NOT_ALLOWED:
            message (messageForm, 
                `<i class="fa-solid fa-triangle-exclamation" style="color: red;"></i>
                <p>Para guardar la receta es necesario crear primero un registro medico.</p>`);
            break;
    }
}

export async function edit(id) {
    if (!isset([id]) || isNaN(id)) return;
    if (!isset([elements])) return;
    if (!buttonSaveRecipe || Number(buttonSaveRecipe.dataset.id) !== Number(id)) return;
    if (!(preescriptionMedications instanceof Array)) return;
    if (!(recipes instanceof Array) || !(medicalRecords instanceof Array)) return;

    const recipe = recipes.find(x => (x._medicalRecord instanceof Object) && (x._medicalRecord._appointment instanceof Object) && Number(x._medicalRecord._appointment._id) === Number(id));
    const medicalRecord = medicalRecords.find(x => (x._appointment instanceof Object) && Number(x._appointment._id) === Number(id));

    if (medicalRecord instanceof Object) {
        buttonSaveRecipe.classList.remove('is-disabled');
        buttonSaveRecipe.title = '';
    } else {
        buttonSaveRecipe.classList.add('is-disabled');
        buttonSaveRecipe.title = 'Para guardar la receta es necesario crear primero un registro medico';
    }

    let response = Object();
    if (recipe instanceof Object) {
        elements.namedItem('preescription').value = recipe._preescription;
        preescriptionMedications = recipe._prescriptionMedications.map(d => {return d._medicine._id});
    } else {
        preescriptionMedications = [];
    }

    optionsSelect(diagnosedDiseases, preescriptionMedications);
    return response;
}

function print() {
    let done = false;
    let id = buttonPrint.dataset.id;
    if (!isset([containerFormHidden, id]) || isNaN(id)) return done;
    if (!(recipes instanceof Array)) return done;

    const recipe = recipes.find(x => (x._medicalRecord instanceof Object) && (x._medicalRecord._appointment instanceof Object) && Number(x._medicalRecord._appointment._id) === Number(id));
    if (!(recipe instanceof Object)) return done;

    const form = document.createElement('form');
    form.method = 'post';
    form.action = 'http://localhost:5000/solicitud/recetas/imprimir';
    form.target = '_blank';

    const input = document.createElement('input');
    input.name = 'id';
    input.type = 'text';
    input.value = recipe._id;

    containerFormHidden.innerHTML = '';
    containerFormHidden.appendChild(form);
    form.appendChild(input);
    form.submit();
    input.value = '';

    return !done;
}