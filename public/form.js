var valido = 'is-valid';
var invalido = 'is-invalid';

export function verifyForm(form) {
    let verify = true;
    const formArray = document.forms.namedItem(form.id);
    const elements = formArray.elements;
    
    for (let i = 0; i < elements.length; i++) {
        if (elements[i].type !== 'button' && elements[i].type !== 'checkbox' && !elements[i].classList.contains('optional')) {
            if (!verifyField(elements[i], formArray.id)) verify = false;
        }
    }

    if (elements['pass'] && elements['confirm-pass']) {
        if (!verifyLength(elements['pass'], formArray.id, 8, 50)) verify = false;
        if (!verifyLength(elements['confirm-pass'], formArray.id, 8, 50)) verify = false;

        if (verify && !confirmPass(elements['pass'], elements['confirm-pass'], formArray.id)) {
            verify = false;
        }
    }

    return verify;
}

export function verifyField(field, formName) {
    let verify = true;

    if (field.type !== 'file') verify = verifyEmpty(field, formName);

    if (verify) {
        switch (field.type) {
            case 'email':
                verify = verifyEmail(field, formName);
                break;
            case 'number':
                verify = verifyNumber(field, formName);
                break;
            case 'file':
                verify = verifyImage(formName, field);
                break;
        }
    }

    return verify;
}

function verifyEmpty(field, formName) {
    let verify = false;
    const helper = document.getElementById(`${formName}-${field.name}-helper`);

    if (field.value.trim().length > 0) {
        verify = true;
        showHelper(!verify, helper, field, 'Campo exitoso.');
    } else {
        field.value = '';
        showHelper(!verify, helper, field, 'Complete este campo.');
    }

    return verify;
}

function verifyEmail(field, formName) {
    let verify = false;
    const helper = document.getElementById(`${formName}-${field.name}-helper`);
    const regex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    
    if (field.value.trim().match(regex)) {
        verify = true;
        showHelper(!verify, helper, field, 'Campo exitoso.');
    } else {
        showHelper(!verify, helper, field, "Incluye un '@' y un '.' en la dirección de correo.");
    }

    return verify;
}

function verifyNumber(field, formName) {
    let verify = false;
    const helper = document.getElementById(`${formName}-${field.name}-helper`);

    if (!isNaN(field.value.trim())) {
        verify = true;
        showHelper(!verify, helper, field, 'Campo exitoso.');
    } else {
        showHelper(!verify, helper, field, 'Incluye solo numeros en el campo.');
    }

    return verify;
}

export function verifyImage(formName, field) {
    let verify = true;
    const files = field.files;
    const maxSize = 5000000;
    const extensions = [".jpg", ".jpeg", ".svg", ".png"];
    const helper = document.getElementById(`${formName}-${field.name}-helper`);

    if (!files || !files[0]) {
        return verify;
    }

    const name = field.files[0].name;
    const extension = name.substring(name.lastIndexOf('.'));
    
    if (!extensions.includes(extension)) {
        verify = false;
        showHelper(!verify, helper, field, `Solo se permiten las extensiones permitidas <b>(${extensions.toString()})</b>.`);
    }

    if (files[0].size > maxSize) {
        verify = false;
        showHelper(!verify, helper, field, `Debe tener un peso menor a <b>${maxSize / 1000000}MB</b>.`);
    }

    if (verify) {
        showHelper(!verify, helper, field, '');
    }

    return verify;
}

function verifyLength(field, formName, minLength, maxLength) {
    let verify = false;
    const helper = document.getElementById(`${formName}-${field.name}-helper`);

    if (field.value.length >= minLength && field.value.length <= maxLength) {
        verify = true;
        showHelper(!verify, helper, field, 'Campo exitoso.');
    } else {
        showHelper(!verify, helper, field, `Solo se permiten ${minLength}-${maxLength} Caracteres.`);
    }

    return verify;
}

function confirmPass(pass, confirmationPass, formName) {
    let verify = false;
    const helper = document.getElementById(`${formName}-${confirmationPass.name}-helper`);

    if (pass.value.length > 0 && confirmationPass.value.length > 0 && pass.value === confirmationPass.value) {
        verify = true;
        showHelper(!verify, helper, confirmationPass, 'Campo exitoso.');
    } else {
        confirmationPass.value = '';
        showHelper(!verify, helper, confirmationPass, 'Coincida las claves correctamente.')
    }

    return verify;
}

function showHelper(isShow, helper, field, validationMessage) {
    if (helper && field) {
        if (isShow) {
            if (field.classList.contains(valido)) field.classList.remove(valido);
            if (!field.classList.contains(invalido)) field.classList.add(invalido);
            if (helper.classList.contains(valido)) helper.classList.remove(valido);
            if (!helper.classList.contains(invalido)) helper.classList.add(invalido);
        } else {
            if (!field.classList.contains(valido)) field.classList.add(valido);
            if (field.classList.contains(invalido)) field.classList.remove(invalido);
            if (!helper.classList.contains(valido)) helper.classList.add(valido);
            if (helper.classList.contains(invalido)) helper.classList.remove(invalido);
        }
        helper.innerHTML = validationMessage;
    }
}

export function loadData(data, form) {
    if (!data) return;

    const elements = document.forms.namedItem(form.id).elements;
    for (let key in data) {
        if (elements.namedItem(key) != null) {
            switch (elements.namedItem(key).type) {
                case "checkbox":
                    elements[key].checked = data[key];
                    break;
                case "number":
                    elements[key].value = (!isNaN(data[key])) ? Number(data[key]) : 0;
                    break;
                default:
                    elements[key].value = data[key];
            }
        }
    }
}

export function reloadForm(form) {
    const elements = document.forms.namedItem(form.id).elements;

    for (let i = 0; i < elements.length; i++) {
        if (elements[i].type !== 'button') {
            let helper = document.getElementById(`${form.id}-${elements[i].name}-helper`);
            
            elements[i].value = '';
            if (elements[i].type === 'checkbox') elements[i].checked = false; 
            if (helper) helper.innerHTML = '';
            if (elements[i].classList.contains(valido)) elements[i].classList.remove(valido);
            if (elements[i].classList.contains(invalido)) elements[i].classList.remove(invalido);
        }
    }
}

export function reloadHelper(form) {
    const elements = document.forms.namedItem(form.id).elements;
    for (let i = 0; i < elements.length; i++) {
        if (elements[i].type !== 'button') {
            let helper = document.getElementById(`${form.id}-${elements[i].name}-helper`);
            if (helper) helper.innerHTML = '';
            if (elements[i].classList.contains(valido)) elements[i].classList.remove(valido);
            if (elements[i].classList.contains(invalido)) elements[i].classList.remove(invalido);
        }
    }
}

export function reloadField(field, formName) {
    field.value = '';
    if (field.classList.contains('is-valid')) field.classList.remove('is-valid'); 
    if (field.classList.contains('is-invalid')) field.classList.remove('is-invalid');
    
    const helper = document.getElementById(`${formName}-${field.name}-helper`);
    
    if (helper) {
        helper.innerHTML = '';
        if (helper.classList.contains('is-valid')) field.classList.remove('is-valid'); 
        if (helper.classList.contains('is-invalid')) field.classList.remove('is-invalid');
    } 
}

export function buttonDisabled(button) {
    if (!button.classList.contains('is-disabled')) {
        button.classList.add('is-disabled');
    }
}

export function buttonEnabled(button) {
    if (button.classList.contains('is-disabled')) {
        button.classList.remove('is-disabled');
    }
}

export function isset(values) {
    let check = true;

    if (values === null || values === undefined) return check;

    for (let i = 0; i < values.length; i++) {
        if (values[i] === undefined || values[i] === null || values[i] === 'undefined' || values[i] === 'null' || values[i] === '') {
            check = false;
            break;
        }
    }

    return check;
}

export function isDate(value) {
    const date = new Date(value);
    return date instanceof Date && !isNaN(date.getTime());
}