import { isset } from "../../form.js";
import { socket } from "../../socket.js";

var container, images, buttonPrev, buttonNext;
var index = 0;

document.addEventListener('DOMContentLoaded', function() {
    container = document.getElementById('carrousel-container');
    buttonPrev = document.getElementById('carrousel-button-prev');
    buttonNext = document.getElementById('carrousel-button-next');

    socket.on('carrousel/read', (data) => {
        images = data;
        skeleton();
        setTimeout(read, 1500);
    });

    if (container && buttonPrev && buttonNext) {
        skeleton();
        socket.emit('carrousel/read', false);

        buttonPrev.addEventListener('click', function() {
            if (index > 0) {
                index--;
                move();
            }
        });

        buttonNext.addEventListener('click', function() {
            if (!(images instanceof Array)) return;

            if (index < (images.length - 1)) {
                index++;
                move();
            } else if (index === (images.length - 1)) {
                index = 0;
                move();
            }
        });
    }
});

function read() {
    if (!(images instanceof Array)) return;

    container.innerHTML = '';
    for (let i = 0; i < images.length; i++) {
        let div = document.createElement('div');

        let img = document.createElement('img');
        img.onload = function() {
            div.classList.remove('skeleton');
            div.append(img);
        };

        div.classList.add('image', 'skeleton');
        if (i === 0) div.classList.add('show');
        else div.classList.add('down');

        img.src = images[i]._imageURL;
        img.title = images[i]._name;
        img.alt = 'Imagen de Carrousel';

        container.append(div);
    }
}

function move() {
    if (!isset([container])) return;
    if (!(images instanceof Array)) return;
    if (index < 0 || index > (images.length - 1)) return;
    
    const collection = container.children;

    for (let i = 0; i < collection.length; i++) {
        if (i === index) {
            if (!collection[i].classList.contains('show')) collection[i].classList.add('show');
            if (collection[i].classList.contains('down')) collection[i].classList.remove('down');
        } else {
            if (collection[i].classList.contains('show')) collection[i].classList.remove('show');
            if (!collection[i].classList.contains('down')) collection[i].classList.add('down');
        }
    }
}

function skeleton() {
    container.innerHTML = '';
    const div = document.createElement('div');
    div.classList.add('image', 'skeleton');
    container.append(div);
}