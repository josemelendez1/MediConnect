import { isset } from "../../form.js";
import { socket } from "../../socket.js";
import { ajax } from "../../ajax.js";

socket.on('Appointment count of the week', (data) => {
    console.log(data);
});

socket.on('Appointment count per user', (data) => {
    console.log(data);
});

socket.on('Most frequent disease',  (data) => {
    console.log(data);
});

document.addEventListener("DOMContentLoaded", function () {
    const containerBalance = document.querySelector('.container-balances');
    const balances = containerBalance.querySelectorAll('.balance');

    balances.forEach(balance => {
        const download = balance.querySelector('.download');
        const toggleVisible = balance.querySelector('.toggle-visible');
        const close = balance.querySelector('.close');
        const contentBalance = balance.querySelector('.content-balance');
        const canvas = balance.querySelector('canvas');
        let chart;
        
        if (!contentBalance || !canvas) return;
        
        switch (balance.id) {
            case 'balance-1': 
                chart = balance1(canvas);
                socket.emit('Appointment count of the week', false, (error, response) => {});
                break;
            case 'balance-2':
                chart = balance2(canvas);
                socket.emit('Appointment count per user', false, (error, response) => {});
                break;
            case 'balance-3':
                chart = balance3(canvas);
                socket.emit('Most used medicines', false, (error, response) => {});
                break;
            case 'balance-4':
                chart = balance4(canvas);
                socket.emit('Most frequent disease', false, (error, response) => {});
                break;
        }

        if (!isset([chart]) || !(chart instanceof Chart)) return;

        if (download) download.addEventListener('click', () => {
            downloadBalance(canvas, chart);
        });

        if (toggleVisible) toggleVisible.addEventListener('click', () => {
            toggle(contentBalance, toggleVisible);
        });

        if (close) close.addEventListener('click', () => {
            closeBalance(balance);
        });
    });
});

function balance1(canvas) {
    const weekdays = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
    let values = [0, 0, 0, 0, 0, 0, 0];
    const appointmentsData = ajax('post', 'http://localhost:5000/solicitud/citas-semana/balance', {});
    if (appointmentsData instanceof Array) {
        for (let i = 0; i < appointmentsData.length; i++) {
            if (!isNaN(appointmentsData[i]['WEEKDAY(`appointment`.`_date`)'])) {
                values[appointmentsData[i]['WEEKDAY(`appointment`.`_date`)']] = appointmentsData[i]['COUNT(*)'];
            }
        }
    }

    const data = {
        labels: weekdays,
        datasets: [{
            data: values,
            label: 'Semana Actual',
            borderColor: 'rgb(96, 165, 250)',
            borderWidth: 2,
            fill: 'origin',
            backgroundColor: 'rgba(191, 219, 254, .4)'
        }],
    };
    const options = {
        responsive: true,
        maintainAspectRatio: false,
    };
    const config = {
        type: 'line',
        data: data,
        options: options,
    }

    const chart = new Chart(canvas, config);
    return chart;
}

function balance2(canvas) {
    let users, values = [];
    const usersData = ajax('post', 'http://localhost:5000/solicitud/citas-paciente/balance', {});

    if (usersData instanceof Array) {
        users = usersData.map(user => {return user._name});
        values = usersData.map(user => {return user['COUNT(*)']})
    }

    const data = {
        labels: users,
        datasets : [{
            label: 'Total de Citas',
            data: values,
            backgroundColor: 'rgba(191, 219, 254, .4)',
            borderColor: 'rgb(96, 165, 250)',
            borderWidth: 2
        }],
    };
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true
            }
        }
    };
    const config = {
        type: 'bar',
        data: data,
        options: options,
    }
    const chart = new Chart(canvas, config);
    return chart;
}

function balance3(canvas) {
    let medicines, values = [];
    const dataMedicines = ajax('post', 'http://localhost:5000/solicitud/medicacion-preescrita/balance', {});

    if (dataMedicines instanceof Array) {
        medicines = dataMedicines.map(x => {return x._name});
        values = dataMedicines.map(x => {return x['COUNT(*)']});
    }
    
    const data = {
        labels: medicines,
        datasets: [{
            label: 'N° de usos',
            data: values,
            backgroundColor: [
                'rgb(239, 246, 255)',
                'rgb(219, 234, 254)',
                'rgb(191, 219, 254)',
                'rgb(147, 197, 253)',
                'rgb(96, 165, 250)',
                'rgb(59, 130, 246)',
                'rgb(37, 99, 235)',
            ],
        }],
        hoverOffset: 5,
    };
    const options = {
        responsive: true,
        maintainAspectRatio: false,
    };
    const config = {
        type: 'doughnut',
        data: data,
        options: options,
    }
    const chart = new Chart(canvas, config);
    return chart;
}

function balance4(canvas) {
    let diseases, values = [];
    const diseasesData = ajax('post', 'http://localhost:5000/solicitud/enfermedad-diagnosticada/balance', {});

    if (diseasesData instanceof Array) {
        diseases = diseasesData.map(x => {return x._name});
        values = diseasesData.map(x => {return x['COUNT(*)']});
    }
    
    const data = {
        labels: diseases,
        datasets: [{
            data: values,
            label: 'Enfermedad mas frecuentes',
            backgroundColor: [
                'rgba(239, 246, 255, .8)',
                'rgba(219, 234, 254, .8)',
                'rgba(191, 219, 254, .8)',
                'rgba(147, 197, 253, .8)',
                'rgba(96, 165, 250, .8)',
                'rgba(59, 130, 246, .8)',
                'rgba(37, 99, 235, .8)',
            ],
        }],
        hoverOffset: 5,
    };
    const options = {
        responsive: true,
        maintainAspectRatio: false,
    };
    const config = {
        type: 'polarArea',
        data: data,
        options: options,
    }
    const chart = new Chart(canvas, config);
    return chart;
}

function closeBalance(balance) {
    if (!balance.classList.contains('balance-close')) balance.classList.add('balance-close'); 
}

function toggle(content, icon) {
    if (!content.classList.contains('balance-minus')) {
        content.classList.add('balance-minus');
        icon.innerHTML = `<i class="fa-solid fa-plus"></i>`;
    } else {
        content.classList.remove('balance-minus');
        icon.innerHMTL = `<i class="fa-solid fa-minus"></i>`;
    }
}

function downloadBalance(canvas, chart) {
    const a = document.createElement('a');

    canvas.style.display = 'none';
    chart.resize(1920, 1080);
    chart.update();
    
    a.href = chart.toBase64Image();
    a.download = 'grafica.png';
    a.click();

    chart.resize();
    chart.update();
    
    canvas.style.display = 'block';
}