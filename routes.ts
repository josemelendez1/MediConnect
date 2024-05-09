import express, { Request, Response, Router } from "express";
import "./controllers/codes"
import { v4 as uuidv4 } from 'uuid';
import { sessionAdministrator, sessionAssistant, sessionDoctor, sessionPatient } from "./controllers/session"
import { Doctor } from "./models/doctor.entity";
import { Medicine } from "./models/medicine.entity";
import { Disease } from "./models/disease.entity";
import { Assistant } from "./models/assistant.entity";
import { Appointment } from "./models/appointment.entity";
import { MedicalRecord } from "./models/medicalRecord.entity";
import { Recipe } from "./models/recipe.entity";
import { Administrator } from "./models/administrator.entity";
import { ERROR, SUCCESS } from "./controllers/codes";
import { DoctorController } from "./controllers/doctor-controller";
import { AssistantController } from "./controllers/assistant-controller";
import { AdministratorController } from "./controllers/administrator-controller";
import { read as readImage, remove as removeImage, upload } from "./controllers/image";
import { AppointmentController } from "./controllers/appointment-controller";
import { MedicalRecordController } from "./controllers/medicalRecord-controller";
import { RecipeController } from "./controllers/recipe-controller";
import { MedicineController } from "./controllers/medicine-controller";
import { DiseaseController } from "./controllers/disease-controller";
import { CarrouselImageController } from "./controllers/carrousel-image-controller";
import { PatientController } from "./controllers/patient-controller";
import { Patient } from "./models/patient.entity";
import { Pdf } from "./controllers/pdf";
import { Twilio } from "twilio";
import { PrescriptionMedication } from "./models/prescriptionMedication.entity";
import { PrescriptionMedicationController } from "./controllers/preescriptionMedication-controller";
import { DiagnosedDiseaseController } from "./controllers/diagnosedDisease-controller";

const router : Router = express.Router();

router.get('/sala', (req, res) => {
    res.redirect(`/sala/${uuidv4()}`);
});

router.get('/sala/:room', (req, res) => {
    res.render('room', { roomId: req.params.room });
});

// views/administrador
router.get('/administrador', (req: Request, res: Response) => {
    if (sessionAdministrator(req)) {
        res.render('administrator/index');
    } else {
        res.redirect('/');
    }
});

router.get('/administrador/medicinas', (req: Request, res: Response) => {
    if (sessionAdministrator(req)) {
        res.render('administrator/medicines');
    } else {
        res.redirect('/');
    }
});

router.get('/administrador/enfermedades', (req: Request, res: Response) => {
    if (sessionAdministrator(req)) {
        res.render('administrator/diseases');
    } else {
        res.redirect('/');
    }
});

router.get('/administrador/usuarios', (req: Request, res: Response) => {
    if (sessionAdministrator(req)) {
        res.render('administrator/users');
    } else {
        res.redirect('/');
    }
});

router.get('/administrador/balance', (req: Request, res: Response) => {
    if (sessionAdministrator(req)) {
        res.render('administrator/balance');
    } else {
        res.redirect('/');
    }
});

router.get('/administrador/perfil', (req: Request, res: Response) => {    
    if (!sessionAdministrator(req)) {
        res.redirect('/');
        return;
    }

    res.render('administrator/profile');
});

// views/user
router.get('/', (req: Request, res: Response) => {
    res.render('user/index');
});

router.get('/paciente/', (req: Request, res: Response) => {
    if (sessionPatient(req)) res.render('user/appointments');
    else res.redirect('/');
});

router.get('/paciente/historial', (req: Request, res: Response) => {
    if (sessionPatient(req)) res.render('user/medical-record');
    else res.redirect('/');
});

router.get('/paciente/perfil', (req: Request, res: Response) => {
    if (sessionPatient(req)) res.render('user/profile');
    else res.redirect('/');
});

// views/doctor
router.get('/doctor', (req: Request, res: Response) => {
    if (sessionDoctor(req)) {   
        res.render('doctor/medicines.ejs');
    } else {
        res.redirect('/');
    }
});

router.get('/doctor/enfermedades', (req: Request, res: Response) => {
    if (sessionDoctor(req)) {   
        res.render('doctor/diseases');
    } else {
        res.redirect('/');
    }
});

router.get('/doctor/citas', (req: Request, res: Response) => {
    if (sessionDoctor(req)) {   
        res.render('doctor/appointments');
    } else {
        res.redirect('/');
    }
});

router.get('/doctor/perfil', (req: Request, res: Response) => {
    if (sessionDoctor(req)) {   
        res.render('doctor/profile');
    } else {
        res.redirect('/');
    }
});

//views/assistant
router.get('/asistente', (req: Request, res: Response) => {
    if (sessionAssistant(req)) res.render('assistant/appointments');
    else res.redirect('/');
});

router.get('/asistente/perfil', (req: Request, res: Response) => {
    if (sessionAssistant(req)) res.render('assistant/profile');
    else res.redirect('/');
});

//Requests
//Carrousel
router.post('/solicitud/carrousel/crear', async (req: Request, res: Response) => {
    const code : number | undefined = await CarrouselImageController.create(req);
    res.send(JSON.stringify(code));
});

router.post('/solicitud/carrousel/eliminar', async (req: Request, res: Response) => {
    const code : number | undefined = await CarrouselImageController.delete(req);
    res.send(JSON.stringify(code));
});

//Patient
router.post('/solicitud/pacientes/crear', async (req: Request, res: Response) => {
    const code: number = await PatientController.create(req);
    res.send(JSON.stringify(code));
});

router.post('/solicitud/pacientes/leer', async (req: Request, res: Response) => {
    const patients: Patient[] | null = await PatientController.read();
    res.send(JSON.stringify(patients));
});

router.post('/solicitud/pacientes/actualizar', async (req: Request, res: Response) => {
    const code: number = await PatientController.update(req);
    res.send(JSON.stringify(code));
});

router.post('/solicitud/pacientes/eliminar', async (req: Request, res: Response) => {
    const code: number = await PatientController.delete(req);
    res.send(JSON.stringify(code));
});

router.post('/solicitud/pacientes/buscar', async (req: Request, res: Response) => {
    const patient: Patient | null = await PatientController.findById(req);
    res.send(JSON.stringify(patient));
});

router.post('/solicitud/paciente/sesion', async (req: Request, res: Response) => {
    const code: number = await PatientController.session(req);
    res.send(JSON.stringify(code));
});

router.post('/solicitud/paciente/imagen/subir', async (req: Request, res: Response) => {
    const code: number = await PatientController.uploadImage(req);
    res.send(JSON.stringify(code));
});

router.post('/solicitud/paciente/imagen/eliminar', async (req: Request, res: Response) => {
    const code: number = await PatientController.deleteImage(req);
    res.send(JSON.stringify(code));
});

//Doctor
router.post('/solicitud/doctores/crear', async (req: Request, res: Response) => {
    const code : number = await DoctorController.create(req);
    res.send(JSON.stringify(code));
});

router.post('/solicitud/doctores/actualizar', async (req: Request, res: Response) => {
    const code : number = await DoctorController.update(req);
    res.send(JSON.stringify(code));
});

router.post('/solicitud/doctores/eliminar', async (req: Request, res: Response) => {
    const code : number = await DoctorController.delete(req);
    res.send(JSON.stringify(code));
});

router.post('/solicitud/doctores/leer', async (req: Request, res: Response) => {
    const doctors : Doctor[] | null = await DoctorController.read();
    res.send(JSON.stringify(doctors));
});

router.post('/solicitud/doctores/buscar/id', async (req: Request, res: Response) => {
    const doctor : Doctor | null = await DoctorController.findId(req);
    res.send(JSON.stringify(doctor));
});

router.post('/solicitud/doctor/sesion', async (req: Request, res: Response) => {
    const code : number = await DoctorController.session(req);
    res.send(JSON.stringify(code));
});

router.post('/solicitud/doctor/subir/imagen', async (req: Request, res: Response) => {
    const code : number = await DoctorController.uploadImage(req);
    res.send(JSON.stringify(code));
});

router.post('/solicitud/doctor/eliminar/imagen', async (req: Request, res: Response) => {
    const code : number = await DoctorController.deleteImage(req);
    res.send(JSON.stringify(code));
});

//Assistant
router.post('/solicitud/asistentes/crear', async (req: Request, res: Response) => {
    const code : number = await AssistantController.create(req);
    res.send(JSON.stringify(code));
});

router.post('/solicitud/asistentes/actualizar', async (req: Request, res: Response) => {
    const code : number = await AssistantController.update(req);
    res.send(JSON.stringify(code));
});

router.post('/solicitud/asistentes/eliminar', async (req: Request, res: Response) => {
    const code : number = await AssistantController.delete(req);
    res.send(JSON.stringify(code));
});

router.post('/solicitud/asistentes/leer', async (req: Request, res: Response) => {
    const assistants : Assistant[] | null = await AssistantController.read(req);
    res.send(JSON.stringify(assistants));
});

router.post('/solicitud/asistentes/buscar/id', async (req: Request, res: Response) => {
    const assistant : Assistant | null = await AssistantController.findId(req);
    res.send(JSON.stringify(assistant));
});

router.post('/solicitud/asistente/sesion', async (req: Request, res: Response) => {
    const code: number = await AssistantController.session(req);
    res.send(JSON.stringify(code));
});

router.post('/solicitud/asistente/subir/imagen', async (req: Request, res: Response) => {
    const code: number = await AssistantController.uploadImage(req);
    res.send(JSON.stringify(code));
});

router.post('/solicitud/asistente/eliminar/imagen', async (req: Request, res: Response) => {
    const code: number = await AssistantController.deleteImage(req);
    res.send(JSON.stringify(code));
});

//Administrator
router.post('/solicitud/administrador/crear', async (req: Request, res: Response) => {
    const code: number = await AdministratorController.create(req);
    res.send(JSON.stringify(code));
});

router.post('/solicitud/administrador/leer', async (req: Request, res: Response) => {
    const administrators : Administrator[] | null = await AdministratorController.read(req);
    res.send(JSON.stringify(administrators));
});

router.post('/solicitud/administrador/actualizar', async (req: Request, res: Response) => {
    const code: number = await AdministratorController.update(req);
    res.send(JSON.stringify(code));
});

router.post('/solicitud/administrador/eliminar', async (req: Request, res: Response) => {
    const code: number = await AdministratorController.delete(req);
    res.send(JSON.stringify(code));
});

router.post('/solicitud/administrador/buscar/sesion/id', async (req: Request, res: Response) => {
    const administrator : Administrator | null = await AdministratorController.findSessionId(req);
    res.send(JSON.stringify(administrator));
});

router.post('/solicitud/administrador/sesion', async (req: Request, res: Response) => {
    const code: number = await AdministratorController.session(req);
    res.send(JSON.stringify(code));
});

router.post('/solicitud/administradores/buscar/id', async (req: Request, res: Response) => {
    const administrator : Administrator | null = await AdministratorController.findId(req);
    res.send(JSON.stringify(administrator));
});

router.post('/solicitud/administrador/imagen/subir', async (req: Request, res: Response) => {
    if (sessionAdministrator(req)) {
        const result = await upload(req, 'D:/proyectos/MediConnect/uploads/images/administrator/', Number(req.session.administrator));
        if (result) {
            res.send(JSON.stringify(SUCCESS));
        }
    } else {
        res.send(JSON.stringify(ERROR));
    }
});

router.post('/solicitud/administrador/imagen/eliminar', async (req: Request, res: Response) => {
    if (sessionAdministrator(req)) {
        await removeImage('D:/proyectos/MediConnect/uploads/images/administrator/', Number(req.session.administrator));
        res.send(JSON.stringify(SUCCESS));
    } else {
        res.send(JSON.stringify(ERROR));
    }
});

router.post('/solicitud/administrador/imagen/leer', async (req: Request, res: Response) => {
    if (sessionAdministrator(req)) {
        const urlImage = await readImage('D:/proyectos/MediConnect/uploads/images/administrator/', Number(req.session.administrator));
        res.send(JSON.stringify(urlImage));
    } else {
        res.send(JSON.stringify(null));
    }
});

//Appointment
router.post('/solicitud/citas/crear', async (req: Request, res: Response) => {
    const code : number = await AppointmentController.create(req);
    res.send(JSON.stringify(code));
});

router.post('/solicitud/citas/actualizar', async (req: Request, res: Response) => {
    const code : number = await AppointmentController.udpate(req);
    res.send(JSON.stringify(code));
});

router.post('/solicitud/citas/eliminar', async (req: Request, res: Response) => {
    const code : number = await AppointmentController.delete(req);
    res.send(JSON.stringify(code));
});

router.post('/solicitud/citas/buscar/id', async (req: Request, res: Response) => {
    const appointment : Appointment | null = await AppointmentController.findId(req);
    res.send(JSON.stringify(appointment));
});

router.post('/citas/imprimir', async (req: Request, res: Response) => {
    if (!await Pdf.generateAppointments(req, res)) res.send("<script>window.close();</script >");
});

//MedicalRecord
router.post('/solicitud/registro-medico/crear', async (req: Request, res: Response) => {
    const code : number = await MedicalRecordController.create(req);
    res.send(JSON.stringify(code));
});

router.post('/solicitud/registro-medico/actualizar', async (req: Request, res: Response) => {
    const code : number = await MedicalRecordController.update(req);
    res.send(JSON.stringify(code));
});

router.post('/solicitud/registro-medico/eliminar', async (req: Request, res: Response) => {
    const code : number = await MedicalRecordController.delete(req);
    res.send(JSON.stringify(code));
});

router.post('/solicitud/registro-medico/leer', async (req: Request, res: Response) => {
    const records : MedicalRecord[] | null = await MedicalRecordController.read();
    res.send(JSON.stringify(records));
});

router.post('/solicitud/registro-medico/buscar/id', async (req: Request, res: Response) => {
    const record : MedicalRecord | null = await MedicalRecordController.findId(req);
    res.send(JSON.stringify(record));
});

router.post('/solicitud/registro-medico/buscar/cita/id', async (req: Request, res: Response) => {
    const record: MedicalRecord | null = await MedicalRecordController.findByAppointent(req.body.id);
    res.send(JSON.stringify(record));
});

router.post('/solicitud/registro-medico/imprimir', async (req: Request, res: Response) => {
    if (!await Pdf.generateMedicalRecord(req, res)) res.send("<script>window.close();</script >");
});

router.post('/solicitud/registro-medico/obtener', async (req: Request, res: Response) => {
    await Pdf.getMedicalRecord(req, res);
});

//Recipe
router.post('/solicitud/recetas/crear', async (req: Request, res: Response) => {
    const code : number = await RecipeController.create(req);
    res.send(JSON.stringify(code));
});

router.post('/solicitud/recetas/actualizar', async (req: Request, res: Response) => {
    const code : number = await RecipeController.update(req);
    res.send(JSON.stringify(code));
});

router.post('/solicitud/recetas/eliminar', async (req: Request, res: Response) => {
    const code : number = await RecipeController.delete(req);
    res.send(JSON.stringify(code));
});

router.post('/solicitud/recetas/leer', async (req: Request, res: Response) => {
    const recipes : Recipe[] | null = await RecipeController.read();
    res.send(JSON.stringify(recipes));
});

router.post('/solicitud/recetas/buscar/id', async (req: Request, res: Response) => {
    const recipe : Recipe | null = await RecipeController.findId(req);
    res.send(JSON.stringify(recipe));
});

router.post('/solicitud/recetas/imprimir', async (req: Request, res: Response) => {
    if (!await Pdf.generateRecipe(req, res)) res.send("<script>window.close();</script >");
});

//Medicine
router.post('/solicitud/medicinas/crear', async (req: Request, res: Response) => {
    const code : number = await MedicineController.create(req);
    res.send(JSON.stringify(code));
});

router.post('/solicitud/medicinas/actualizar', async (req: Request, res: Response) => {
    const code : number = await MedicineController.update(req);
    res.send(JSON.stringify(code));
});

router.post('/solicitud/medicinas/eliminar', async (req: Request, res: Response) => {
    const code : number = await MedicineController.delete(req);
    res.send(JSON.stringify(code));
});

router.post('/solicitud/medicinas/leer', async (req: Request, res: Response) => {
    const medicines : Medicine[] | null = await MedicineController.read(req);
    res.send(JSON.stringify(medicines));
});

router.post('/solicitud/medicinas/buscar/id', async (req: Request, res: Response) => {
    const medicine : Medicine | null = await MedicineController.findId(req);
    res.send(JSON.stringify(medicine));
});

router.post('/solicitud/medicinas/filtrar', async (req: Request, res: Response) => {
    const medicines : Medicine[] | null = await MedicineController.filter(req);
    res.send(JSON.stringify(medicines));
});

//Disease
router.post('/solicitud/enfermedades/crear', async (req: Request, res: Response) => {
    const code : number = await DiseaseController.create(req);
    res.send(JSON.stringify(code));
});

router.post('/solicitud/enfermedades/actualizar', async (req: Request, res: Response) => {
    const code : number = await DiseaseController.update(req);
    res.send(JSON.stringify(code));
});

router.post('/solicitud/enfermedades/eliminar', async (req: Request, res: Response) => {
    const code : number = await DiseaseController.delete(req);
    res.send(JSON.stringify(code));
});

router.post('/solicitud/enfermedades/leer', async (req: Request, res: Response) => {
    const diseases : Disease[] | null = await DiseaseController.read(req);
    res.send(JSON.stringify(diseases));
});

router.post('/solicitud/enfermedades/buscar/id', async (req: Request, res: Response) => {
    const disease : Disease | null = await DiseaseController.findId(req);
    res.send(JSON.stringify(disease));
});

router.post('/solicitud/enfermedades/filtrar', async (req: Request, res: Response) => {
    const diseases : Disease[] | null = await DiseaseController.filter(req);
    res.send(JSON.stringify(diseases));
});

//Balalance
router.post('/solicitud/citas-semana/balance', async (req: Request, res: Response) => {
    const data = await AppointmentController.groupByWeekCount();
    res.send(JSON.stringify(data));
});

router.post('/solicitud/citas-paciente/balance', async (req: Request, res: Response) => {
    const data = await AppointmentController.groupByPatientCount();
    res.send(JSON.stringify(data));
});

router.post('/solicitud/medicacion-preescrita/balance', async (req: Request, res: Response) => {
    const data = await PrescriptionMedicationController.groupByMedicationCount();
    res.send(JSON.stringify(data));
});

router.post('/solicitud/enfermedad-diagnosticada/balance', async (req: Request, res: Response) => {
    const data = await DiagnosedDiseaseController.groupByDiseaseCount();
    res.send(JSON.stringify(data));
});

//Logout
router.get('/sesion/cerrar/administrador', async (req: Request, res: Response) => {
    delete req.session.administrator;
    res.redirect('/');
});

router.get('/sesion/cerrar/doctor', async (req: Request, res: Response) => {
    delete req.session.doctor;
    res.redirect('/');
});

router.get('/sesion/cerrar/paciente', async (req: Request, res: Response) => {
    delete req.session.patient;
    res.redirect('/');
});

router.get('/sesion/cerrar/asistente', async (req: Request, res: Response) => {
    delete req.session.assistant;
    res.redirect('/');
});

// 404 NOT FOUND
router.use(function (req: Request, res: Response) {
    res.status(404);
    res.render('404');
});

export { router };