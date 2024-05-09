export function ajax(method, url, data) {
    let response = false;
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState != 4 && this.status != 200) {
            return;
        }

        if (!isJson(this.responseText)) {
            return;
        }

        response = JSON.parse(this.responseText);   
    };
    xhttp.open(method, url, false);
    xhttp.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    xhttp.setRequestHeader('Content-Type', 'application/json');
    xhttp.send(JSON.stringify(data));
    
    return response;
}

export function ajaxMultipart(method, url, data) {
    let response = false;
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState != 4 && this.status != 200) {
            return;
        }

        if (!isJson(this.responseText)) {
            return;
        }

        response = JSON.parse(this.responseText);   
    };
    xhttp.open(method, url, false);
    xhttp.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    xhttp.send(data);
    
    return response;
}

export function message(message, info) {
    message.innerHTML = info;
    if (!message.classList.contains('message-open')) {
        message.classList.add('message-open');
    }
}

export function hideMessage(message) {
    if (message.classList.contains('message-open')) {
        message.classList.remove('message-open');
    }
}

export function isJson(str) {
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        return false;
    }
}