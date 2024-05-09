export function showModal(modal) {
    if (!modal.classList.contains('modal-open')) {
        modal.classList.add('modal-open');
    }
}

export function hideModal(modal) {
    if (modal.classList.contains('modal-open')) {
        modal.classList.remove('modal-open');
    }
}

export function showButton(button) {
    if (button.classList.contains('button-none')) {
        button.classList.remove('button-none');
    }
}

export function hideButton(button) {
    if (!button.classList.contains('button-none')) {
        button.classList.add('button-none');
    }
}