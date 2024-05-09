document.addEventListener('DOMContentLoaded', function () {
    const header = document.getElementById('header');
    const main = document.getElementById('main');
    const footer = document.getElementById('footer');
    const menu = document.getElementById('menu');
    const navBar = document.getElementById('navbar');
    const shadow = document.getElementById('shadow');
    const width = (window.innerWidth > 0) ? window.innerWidth : screen.width;

    if (navBar && menu && shadow && header && main) {
        
        menu.addEventListener('click', function (e) {
            navBar.classList.toggle('open');
            shadow.classList.toggle('open');

            if (width >= 1024) {
                header.classList.toggle('expand');
                main.classList.toggle('expand');
                footer.classList.toggle('expand');
            } else {
                document.body.style.overflowY = 'hidden';
            }
        });

        shadow.addEventListener('click', function (e) {
            if (navBar.classList.contains('open')) {
                navBar.classList.remove('open');
                shadow.classList.remove('open');
                document.body.style.overflowY = 'auto';
            }
        });
    }
});