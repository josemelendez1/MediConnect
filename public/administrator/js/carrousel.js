import { ajax, ajaxMultipart } from "../../ajax.js";
import { ERROR, SUCCESS } from "../../codes.js";
import { isset, verifyImage } from "../../form.js"
import { socket } from "../../socket.js";

var images, container, info, buttonDelete, template;

socket.on('carrousel/read', (data) => {
    images = data;
    setTimeout(read, 500);
});

document.addEventListener('DOMContentLoaded', function () {
    container = document.querySelector('.slider-cards');
    info = document.querySelector('.slider-info');
    buttonDelete = document.getElementById('button-delete-image-carrousel');
    template = document.getElementById('template-slider-card');

    if (container && info &&  buttonDelete && template) {
        skeletonSlider();
        socket.emit('carrousel/read', false);

        buttonDelete.addEventListener('click', function () {
            let id = buttonDelete.dataset.id;
            if (!isset([id]) || isNaN(id)) return;
            remove(id);
        });
    }
});

function create(file) {
    const formData = new FormData();
    formData.append('image', file);
    const code = ajaxMultipart('post', 'http://localhost:5000/solicitud/carrousel/crear', formData);

    if (isNaN(code)) return;

    switch (code) {
        case SUCCESS:
            skeletonSlider();
            socket.emit('carrousel/read', true, (error, response) => {});
            break;
    }
}

function read() {
    container.innerHTML = '';

    if (isset([images]) && images instanceof Array) {
        for (let i = 0; i < images.length; i++) {
            if (!(images[i] instanceof Object)) continue;

            let clone = template.content.cloneNode(true);
            let div = clone.querySelector('div');
            let img = document.createElement('img');

            div.dataset.id = isset([images[i]._id]) ? images[i]._id : '';
            img.onload = function () {
                div.append(img);
                div.classList.remove('skeleton-slider-card');
                div.classList.add('bg-white');
            }
            img.alt = 'Imagen de Carrousel';
            img.src = isset([images[i]._imageURL]) ? images[i]._imageURL : '';
            img.title = isset([images[i]._name]) ? images[i]._name : '';

            container.append(clone);
        }
    }

    initAddImage();
    initSlide();
}

function remove(id) {
    if (!isset([id]) || isNaN(id)) return;
    const code = ajax('post', 'http://localhost:5000/solicitud/carrousel/eliminar', {'id': id});
    if (isNaN(code)) return;
    
    switch (code) {
        case SUCCESS:
            skeletonSlider();
            socket.emit('carrousel/read', true, (error, response) => {});
            break;
    }
}

function initAddImage() {
    const label = document.createElement('label');
    const img = document.createElement('img');
    const input = document.createElement('input');

    label.classList.add('slider-card', 'skeleton-slider-card');
    label.htmlFor = 'add-image-carrousel';

    input.classList.add('input-file');
    input.type = 'file';
    input.id = 'add-image-carrousel';
    input.name = 'add-image-carrousel';
    input.accept = '.png, .jpg, .jpeg, .svg';
    
    input.addEventListener('change', function () {
        if (!input.files || !input.files[0]) return;
        if (!verifyImage('', input)) return;
        create(input.files[0]);
    });
    
    img.onload = () => {
        label.append(img);
        label.classList.remove('skeleton-slider-card');
        label.classList.add('bg-white');
    }
    img.src = '/images/add-image.png';
    img.title = 'Agregar nueva imagen';
    img.alt = 'Imagen para Agregar una nueva imagen de carrousel';

    container.append(label);
    container.append(input);
}

function initSlide() {
    const imagesCarrousel = document.querySelectorAll('.slider-card');
    if (!imagesCarrousel) return;
    if (imagesCarrousel[0]) buttonDelete.dataset.id = imagesCarrousel[0].dataset.id;
    for (let i = 0; i < imagesCarrousel.length; i++) {
        switch (i) {
            case 0:
                if (!imagesCarrousel[i].classList.contains('show')) imagesCarrousel[i].classList.add('show');
                break;
            
            case 1:
                if (!imagesCarrousel[i].classList.contains('next')) imagesCarrousel[i].classList.add('next');
                imagesCarrousel[i].style.zIndex = '2';
                break

            default:
                if (!imagesCarrousel[i].classList.contains('next')) imagesCarrousel[i].classList.add('next');
                if (!imagesCarrousel[i].classList.contains('index-1')) imagesCarrousel[i].classList.add('index-1');
                if (!imagesCarrousel[i].classList.contains('opacity-0')) imagesCarrousel[i].classList.add('opacity-0'); 
        }

        imagesCarrousel[i].addEventListener('click', function () {
            buttonDelete.dataset.id = imagesCarrousel[i].dataset.id;

            if (imagesCarrousel[i].classList.contains('next')) {
                if (imagesCarrousel[i].classList.contains('next')) imagesCarrousel[i].classList.remove('next');
                if (!imagesCarrousel[i].classList.contains('show')) imagesCarrousel[i].classList.add('show');

                if (imagesCarrousel[i - 1].classList.contains('show')) imagesCarrousel[i - 1].classList.remove('show');
                if (!imagesCarrousel[i - 1].classList.contains('prev')) imagesCarrousel[i - 1].classList.add('prev');

                if ((i + 1) < imagesCarrousel.length) {
                    if (imagesCarrousel[i + 1].classList.contains('index-1')) imagesCarrousel[i + 1].classList.remove('index-1');
                    if (imagesCarrousel[i + 1].classList.contains('opacity-0')) imagesCarrousel[i + 1].classList.remove('opacity-0'); 
                }

                if ((i - 2) >= 0) {
                    if (!imagesCarrousel[i - 2].classList.contains('index-1')) imagesCarrousel[i - 2].classList.add('index-1');
                    if (!imagesCarrousel[i - 2].classList.contains('opacity-0')) imagesCarrousel[i - 2].classList.add('opacity-0');
                }
            } else if (imagesCarrousel[i].classList.contains('prev')) {
                if (imagesCarrousel[i].classList.contains('prev')) imagesCarrousel[i].classList.remove('prev');
                if (!imagesCarrousel[i].classList.contains('show')) imagesCarrousel[i].classList.add('show');

                if ((i + 1) < imagesCarrousel.length) {
                    if (imagesCarrousel[i + 1].classList.contains('show')) imagesCarrousel[i + 1].classList.remove('show');
                    if (!imagesCarrousel[i + 1].classList.contains('next')) imagesCarrousel[i + 1].classList.add('next');   
                }

                if ((i + 2) < imagesCarrousel.length) {
                    if (!imagesCarrousel[i + 2].classList.contains('index-1')) imagesCarrousel[i + 2].classList.add('index-1');
                    if (!imagesCarrousel[i + 2].classList.contains('opacity-0')) imagesCarrousel[i + 2].classList.add('opacity-0'); 
                } 

                if ((i - 1) >= 0) {
                    if (imagesCarrousel[i - 1].classList.contains('index-1')) imagesCarrousel[i - 1].classList.remove('index-1');
                    if (imagesCarrousel[i - 1].classList.contains('opacity-0')) imagesCarrousel[i - 1].classList.remove('opacity-0'); 
                }
            }
        });
    }
}

function skeletonSlider() {
    container.innerHTML = '';
    for (let i = 0; i < 2; i++) {
        container.append(template.content.cloneNode(true));
    }
    initSlide();
}