document.addEventListener('DOMContentLoaded', function() {
    const seeker = document.getElementById('seeker');
    const input = document.getElementById('input-seeker');
    const icon = document.getElementById('icon-seeker');

    if (seeker && input && icon) {
        icon.addEventListener('click', function() {
            toogleSeeker(seeker, input, icon);
        });
    }
});

function toogleSeeker(seeker, input, icon) {
    if (!seeker.classList.contains('open-seeker')) {
        seeker.classList.add('open-seeker');
        input.classList.add('open-seeker');
        icon.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    } else {
        seeker.classList.remove('open-seeker');
        input.classList.remove('open-seeker');
        icon.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i>';
    }
}