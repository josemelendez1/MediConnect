document.addEventListener('DOMContentLoaded', function() {
    const buttonScreen = document.getElementById('buttonScreen');

    if (buttonScreen) {
        buttonScreen.addEventListener('click', function() {
            toggleFullScreen(buttonScreen);
        });
    }
});

function toggleFullScreen(buttonElement) {
    if ((document.fullScreenElement && document.fullScreenElement !== null) || (!document.mozFullScreen && !document.webkitIsFullScreen))
    {
        if (document.documentElement.requestFullScreen){
            document.documentElement.requestFullScreen();
        }
        else if (document.documentElement.mozRequestFullScreen){ /* Firefox */
            document.documentElement.mozRequestFullScreen();
        }
        else if (document.documentElement.webkitRequestFullScreen){   /* Chrome, Safari & Opera */
            document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
        }
        else if (document.msRequestFullscreen){ /* IE/Edge */
            document.documentElement.msRequestFullscreen();
        }
        if (buttonElement !== undefined) {
            buttonElement.innerHTML = '<i class="fa-solid fa-compress"></i>';
        }
    }
    else
    {
        if (document.cancelFullScreen){
            document.cancelFullScreen();
        }
        else if (document.mozCancelFullScreen){ /* Firefox */
            document.mozCancelFullScreen();
        }
        else if (document.webkitCancelFullScreen){   /* Chrome, Safari and Opera */
            document.webkitCancelFullScreen();
        }
        else if (document.msExitFullscreen){ /* IE/Edge */
            document.msExitFullscreen();
        }

        if (buttonElement !== undefined) {
            buttonElement.innerHTML = '<i class="fa-solid fa-expand"></i>';
        }
    }
}