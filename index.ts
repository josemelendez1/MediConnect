import express, { Express, Router, response } from 'express';
import session from 'express-session';
import fileUpload from 'express-fileupload';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { router } from './routes';
import { read } from './controllers/image';
import nocache from 'nocache';
import { Administrator } from './models/administrator.entity';
import { AppDataSource } from './models/db';
import { isset } from './controllers/requests';
import { Medicine } from './models/medicine.entity';
import { ERROR, SUCCESS } from './controllers/codes';
import { Disease } from './models/disease.entity';
import { Doctor } from './models/doctor.entity';
import { Assistant } from './models/assistant.entity';
import { CarrouselImageController } from './controllers/carrousel-image-controller';
import { Appointment } from './models/appointment.entity';
import { Patient } from './models/patient.entity';
import { PatientController } from './controllers/patient-controller';
import { MedicalRecord } from './models/medicalRecord.entity';
import { DiagnosedDiseaseController } from './controllers/diagnosedDisease-controller';
import { RecipeController } from './controllers/recipe-controller';
import { PrescriptionMedicationController } from './controllers/preescriptionMedication-controller';
import { PeerServer } from 'peer';
import { MedicalRecordController } from './controllers/medicalRecord-controller';
import { DoctorController } from './controllers/doctor-controller';
import { AppointmentController } from './controllers/appointment-controller';

require('dotenv').config();

var app: Express = express();
var server = createServer(app);
const port: number = 5000;
var io = new Server(server);
var sessionExpress = session({
    secret: 'llave-secreta',
    resave: true,
    saveUninitialized: true,
});
var peerServer = PeerServer({port: 5001}); 

app.set('view engine', 'ejs');
app.use(nocache());
app.use(fileUpload());
app.use(express.static('public'));
app.use(express.static('uploads'));
app.use(express.static(__dirname + '/node_modules/'));
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(sessionExpress);

app.use('/', router);

io.engine.use(sessionExpress);
io.on('connection', (socket) => {
    const idAdministrator: number | undefined = socket.request.session.administrator;
    const idPatient: number | undefined = socket.request.session.patient;
    const idDoctor: number | undefined = socket.request.session.doctor;
    const idAssistant: number | undefined = socket.request.session.assistant;
    const imagesAdministrator = 'D:/proyectos/MediConnect/uploads/images/administrator/';
    const imagesMedicine = 'D:/proyectos/MediConnect/uploads/images/medicine/';
    const imagesDisease = 'D:/proyectos/MediConnect/uploads/images/disease/';
    const imagesPatient = 'D:/proyectos/MediConnect/uploads/images/patient/';
    const imagesDoctor = 'D:/proyectos/MediConnect/uploads/images/doctor/';
    const imagesAssistant = 'D:/proyectos/MediConnect/uploads/images/assistant/';

    if (idAdministrator !== undefined && idAdministrator !== null && !isNaN(idAdministrator)) {
        socket.on('administrators/read', async (global: boolean | undefined, callback: any | undefined) => {
            const administrators = await AppDataSource.getRepository(Administrator).createQueryBuilder().getMany();
            if (administrators instanceof Array) {
                for (let i = 0; i < administrators.length; i++) {
                    if (administrators[i] instanceof Administrator) administrators[i].imageURL = await read(imagesAdministrator, administrators[i].id);
                }
            }
            if (global) io.emit('administrators/read', (administrators));
            else socket.emit('administrators/read', (administrators));
            if (isset([callback])) return callback({response: SUCCESS});
        });
    
        socket.on('administrator/read', async (id: number | undefined, global : boolean | undefined) => {
            if (!isset([id])) return;
            const administrator = await AppDataSource.getRepository(Administrator).findOneBy({_id : id});
            if (administrator instanceof Administrator) administrator.imageURL = await read(imagesAdministrator, id);
            if (global) io.emit('administrator/read', (administrator));
            else socket.emit('administrator/read', (administrator));
        });

        socket.on('administrator/session/read', async () => {
            const administrator = await AppDataSource.getRepository(Administrator).findOneBy({_id : idAdministrator});
            if (administrator instanceof Administrator) administrator.imageURL = await read(imagesAdministrator, idAdministrator);
            socket.emit('administrator/session/read', (administrator));
        });

        socket.on('administrator/updated', async (id: number | undefined) => {
            io.emit('administrator/updated', (id));
        });
        
        socket.on('administrator/deleted', async (id: number | undefined) => {
            io.emit('administrator/deleted', (id));
        });

        socket.on('users/length', async (global: boolean | undefined) => {
            let length = await AppDataSource.getRepository(Administrator).count();
            length += await AppDataSource.getRepository(Patient).count();
            length += await AppDataSource.getRepository(Assistant).count();
            length += await AppDataSource.getRepository(Doctor).count();
            if (global) io.emit('users/length', (length));
            else socket.emit('users/length', (length));
        });

        socket.on('medicines/length', async (global: boolean | undefined) => {
            let length = await AppDataSource.getRepository(Medicine).count();
            if (global) io.emit('medicines/length', (length));
            else socket.emit('medicines/length', (length)); 
        });

        socket.on('diseases/length', async (global: boolean | undefined) => {
            let length = await AppDataSource.getRepository(Disease).count();
            if (global) io.emit('diseases/length', (length));
            else socket.emit('diseases/length', (length)); 
        });

        socket.on('appointments/length', async (global: boolean | undefined) => {
            let length = await AppDataSource.getRepository(Appointment).count();
            if (global) io.emit('appointments/length', (length));
            else socket.emit('appointments/length', (length)); 
        });
    }

    if (isset([idAdministrator]) || isset([idDoctor]) || isset([idAssistant]) || isset([idPatient])) {
        socket.on('medicine/read', async (global: boolean | undefined, callback: any | undefined) => {
            const medicines = await AppDataSource.getRepository(Medicine).createQueryBuilder().getMany();
            if (medicines instanceof Array) {
                for (let i = 0; i < medicines.length; i++) {
                    if (medicines[i] instanceof Medicine) medicines[i].imageURL = await read(imagesMedicine, medicines[i].id); 
                }
            }
            if (global) io.emit('medicine/read', (medicines));
            else socket.emit('medicine/read', (medicines));
            if (isset([callback])) return callback({response: SUCCESS});
        });

        socket.on('medicine/updated', (id: number | undefined) => {
            io.emit('medicine/updated', (id));
        });
    
        socket.on('medicine/deleted', (id: number | undefined) => {
            io.emit('medicine/deleted', (id));
        });
    
        socket.on('disease/read', async (global: boolean | undefined, callback: any | undefined) => {
            const diseases = await AppDataSource.getRepository(Disease).createQueryBuilder().getMany();
            if (diseases instanceof Array) {
                for (let i = 0; i < diseases.length; i++) {
                    if (diseases[i] instanceof Disease) diseases[i].imageURL = await read(imagesDisease, diseases[i].id); 
                }
            }
            if (global) io.emit('disease/read', (diseases));
            else socket.emit('disease/read', (diseases));
            if (isset([callback])) return callback({response: SUCCESS});
        });
    
        socket.on('disease/updated', (id: number | undefined) => {
            io.emit('disease/updated', (id));
        });
    
        socket.on('disease/deleted', (id: number | undefined) => {
            io.emit('disease/deleted', (id));
        });

        socket.on('patient/read', async (global: boolean | undefined, callback: any | undefined) => {
            const patients = await PatientController.read();
            if (patients instanceof Array) {
                for (let i = 0; i < patients.length; i++) {
                    if (patients[i] instanceof Patient) patients[i].imageURL = await read(imagesPatient, patients[i].id);
                }
            }
            if (global) io.emit('patient/read', (patients));
            else socket.emit('patient/read', (patients));
            if (isset([callback])) return callback({response: SUCCESS});
        });

        socket.on('patient/session/read', async (callback: any | undefined) => {
            if (!isset([idPatient])) return;
            const patient = await AppDataSource.getRepository(Patient).findOneBy({_id: idPatient});
            if (patient instanceof Patient) patient.imageURL = await read(imagesPatient, idPatient);
            socket.emit('patient/session/read', (patient));
            if (isset([callback])) callback({status: SUCCESS});
        });

        socket.on('patient/updated', (id: number | undefined) => {
            io.emit('patient/updated', (id));
        });
    
        socket.on('patient/deleted', (id: number | undefined) => {
            io.emit('patient/deleted', (id));
        });

        socket.on('doctor/read', async (global: boolean | undefined, callback: any | undefined) => {
            const doctors = await DoctorController.read();
            if (doctors instanceof Array) {
                for (let i = 0; i < doctors.length; i++) {
                    if (doctors[i] instanceof Doctor) doctors[i].imageURL = await read(imagesDoctor, doctors[i].id);
                }
            }
            if (global) io.emit('doctor/read', (doctors));
            else socket.emit('doctor/read', (doctors));
            if (isset([callback])) return callback({response: SUCCESS});
        });

        socket.on('doctor/session/read', async () => {
            const doctor = await AppDataSource.getRepository(Doctor).findOneBy({_id: idDoctor});
            if (doctor instanceof Doctor) doctor.imageURL = await read(imagesDoctor, idDoctor);
            socket.emit('doctor/session/read', (doctor));
        });

        socket.on('doctor/updated', (id: number | undefined) => {
            io.emit('doctor/updated', (id));
        });
    
        socket.on('doctor/deleted', (id: number | undefined) => {
            io.emit('doctor/deleted', (id));
        });

        socket.on('assistant/read', async (global: boolean | undefined, callback: any | undefined) => {
            const assistants = await AppDataSource.getRepository(Assistant).createQueryBuilder().getMany();
            if (assistants instanceof Array) {
                for (let i = 0; i < assistants.length; i++) {
                    if (assistants[i] instanceof Assistant) assistants[i].imageURL = await read(imagesAssistant, assistants[i].id);
                }
            }
            if (global) io.emit('assistant/read', (assistants));
            else socket.emit('assistant/read', (assistants));
            if (isset([callback])) return callback({response: SUCCESS});
        });

        socket.on('assistant/session/read', async () => {
            if (!isset([idAssistant])) return;
            const assistant = await AppDataSource.getRepository(Assistant).findOneBy({_id: idAssistant});
            if (assistant instanceof Assistant) assistant.imageURL = await read(imagesAssistant, idAssistant);
            socket.emit('assistant/session/read', (assistant));
        });

        socket.on('assistant/updated', (id: number | undefined) => {
            io.emit('assistant/updated', (id));
        });
    
        socket.on('assistant/deleted', (id: number | undefined) => {
            io.emit('assistant/deleted', (id));
        });

        socket.on('appointment/read', async (global: boolean | undefined, callback: any | undefined) => {
            const appointments = await AppDataSource.getRepository(Appointment).createQueryBuilder().getMany();
            if (global) io.emit('appointment/read', (appointments));
            else socket.emit('appointment/read', (appointments));
            if (isset([callback]) && callback instanceof Function) return callback({response: SUCCESS});
        });

        socket.on('appointment-eager/read', async (global: boolean | undefined, callback: any | undefined) => {
            const appointments = await AppointmentController.readEager();
            if (global) io.emit('appointment-eager/read', (appointments));
            else socket.emit('appointment-eager/read', (appointments));
            if (isset([callback])) return callback({response: SUCCESS});
        });

        socket.on('appointment-patient-eager/read', async (id: number, global: boolean | undefined, callback: any | undefined) => {
            if (isset([id]) && !isNaN(id)) {
                const patient = await PatientController.findBydIdEager(id);
                if (patient instanceof Patient) patient.imageURL = await read(imagesPatient, patient.id);
                if (global) io.emit('appointment-patient-eager/read', (patient));
                else socket.emit('appointment-patient-eager/read', (patient))
                if (isset([callback]) && callback instanceof Function) return callback({response: SUCCESS});
            } else {
                if (isset([callback]) && callback instanceof Function) return callback({response: ERROR});
            }
            
        });

        socket.on('appointment/updated', (id: number | undefined) => {
            io.emit('appointment/updated', (id));
        });

        socket.on('appointment/deleted', (id: number | undefined) => {
            io.emit('appointment/deleted', (id));
        });

        socket.on('medical-record/read', async (global: boolean | undefined, callback: any | undefined) => {
            const medicalRecords: MedicalRecord[] | null = await MedicalRecordController.read();
            if (global) io.emit('medical-record/read', (medicalRecords));
            else socket.emit('medical-record/read', (medicalRecords));
            if (isset([callback])) return callback({response: SUCCESS});
        });

        socket.on('medical-record-eager/read', async (global: boolean | undefined, callback: any | undefined) => {
            const medicalRecords: MedicalRecord[] | null = await MedicalRecordController.readEager();
            if (global) io.emit('medical-record-eager/read', (medicalRecords));
            else socket.emit('medical-record-eager/read', (medicalRecords));
            if (isset([callback])) return callback({response: SUCCESS});
        });

        socket.on('medical-record/updated', (id: number | undefined) => {
            io.emit('medical-record/updated', (id));
        });

        socket.on('medical-record/deleted', (id: number | undefined) => {
            io.emit('medical-record/deleted', (id));
        });

        socket.on('diagnosed-disease/read-by-record', async (id: number | undefined, global: boolean | undefined, callback: any | undefined) => {
            const diagnosedDisease = await DiagnosedDiseaseController.readByRecord(id);
            if (global) io.emit('diagnosed-disease/read-by-record', (diagnosedDisease));
            else socket.emit('diagnosed-disease/read-by-record', (diagnosedDisease));
            if (isset([callback])) return callback({response: SUCCESS});
        });

        socket.on('recipe/read', async (global: boolean | undefined, callback: any | undefined) => {
            const recipes = await RecipeController.read();
            if (global) io.emit('recipe/read', (recipes));
            else socket.emit('recipe/read', (recipes));
            if (isset([callback])) return callback({response: SUCCESS});
        });

        socket.on('recipe-eager/read', async (global: boolean | undefined, callback: any | undefined) => {
            const recipes = await RecipeController.readEager();
            if (global) io.emit('recipe-eager/read', (recipes));
            else socket.emit('recipe-eager/read', (recipes));
            if (isset([callback])) return callback({response: SUCCESS});
        });

        socket.on('recipe/updated', (id: number | undefined) => {
            io.emit('recipe/updated', (id));
        });

        socket.on('recipe/deleted', (id: number | undefined) => {
            io.emit('recipe/deleted', (id));
        });

        socket.on('preescription-medication/read-by-recipe', async (id: number | undefined, global: boolean | undefined, callback: any | undefined) => {
            const preescriptionMedications = await PrescriptionMedicationController.readByRecipe(id);
            if (global) io.emit('preescription-medication/read-by-recipe', (preescriptionMedications));
            else socket.emit('preescription-medication/read-by-recipe', (preescriptionMedications));
            if (isset([callback])) return callback({response: SUCCESS});
        });

        socket.on('call', (patient: Object | undefined, doctor: Object | undefined, callback: any | undefined) => {
            socket.on('disconnect', () => {
                socket.broadcast.emit('cancel-call-doctor', patient, doctor);
            });

            if (patient instanceof Object && doctor instanceof Object) {
                io.emit('call', patient, doctor);
                if (callback instanceof Function) callback({response: SUCCESS});
            } else {
                if (callback instanceof Function) callback({response: ERROR});
            }
        });

        socket.on('reconnect-call', (patient: Object | undefined, callback: any | undefined) => {
            if (patient instanceof Object) {
                io.emit('reconnect-call', patient);
                if (callback instanceof Function) return callback({response: SUCCESS});
            } else {
                if (callback instanceof Function) return callback({response: ERROR});
            }
        });

        socket.on('cancel-call', (patient: Object | undefined, doctor: Object | undefined, callback: any | undefined) => {
            if (patient instanceof Object && doctor instanceof Object) {
                io.emit('cancel-call', patient, doctor);
                if (callback instanceof Function) return callback({response: SUCCESS});
            } else {
                if (callback instanceof Function) return callback({response: ERROR});
            }
        });
    }

    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId);
        socket.broadcast.to(roomId).emit('user-connected', userId);
        socket.on('disconnect', () => {
            socket.broadcast.to(roomId).emit('user-disconnected', userId);
        });
    });

    socket.on('carrousel/read', async (global: boolean | undefined, callback: any | undefined) => {
        const images = await CarrouselImageController.read();
        if (global) io.emit('carrousel/read', (images));
        else  socket.emit('carrousel/read', (images));
        if (isset([callback])) return callback({response: SUCCESS});
    });

    socket.on('carrousel/deleted', async (id: number | undefined) => {
        io.emit('carrousel/deleted', (id));
    });
});

server.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});