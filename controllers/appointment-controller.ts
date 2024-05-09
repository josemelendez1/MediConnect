import { Request } from 'express';
import { isDate, isset } from "./requests";
import { Repository } from "typeorm";
import { AppDataSource } from "../models/db";
import { ERROR, NOT_ALLOWED, NOT_VERIFIED, SUCCESS } from "./codes";
import { Appointment } from "../models/appointment.entity";
import { sessionPatient } from './session';
import { PatientController } from './patient-controller';
import { DoctorController } from './doctor-controller';
import { Patient } from '../models/patient.entity';
import { Doctor } from '../models/doctor.entity';
import { SMS } from '../models/sms';

export class AppointmentController {
    private static repository: Repository<Appointment> = AppDataSource.getRepository(Appointment);  

    public static async create(req: Request) : Promise<number> {
        try {
            if (!req.xhr || !isset([req.body.type, req.body.reason, req.body.date]) || !isDate(req.body.date)) return ERROR;
            if (!isset([req.body.idPatient]) || isNaN(req.body.idPatient)) return ERROR;
            if (!this.superiorDate(new Date(req.body.date))) return NOT_ALLOWED;
            if (!(await this.uniqueAppointment(req))) return NOT_VERIFIED;
        
            req.body.id = req.body.idPatient;
            let patient: Patient | null = await PatientController.findById(req);

            req.body.id = req.body.idDoctor;
            let doctor: Doctor | null = await DoctorController.findId(req);

            let appointment = new Appointment(req.body.type, req.body.reason, new Date(req.body.date));
            appointment.patient = patient;
            appointment.doctor = doctor;
            if (isset([req.body.admission]) && req.body.admission !== 'false') appointment.admission = Boolean(req.body.admission); 
            appointment = await this.repository.save(appointment);
        
            if (appointment != null && appointment != undefined && appointment instanceof Appointment) {
                if (patient instanceof Patient && doctor instanceof Doctor && appointment.admission === true) {
                    this.sendMessage (appointment, patient, 
                    `Estimado paciente, se le ha agendado una cita medica el ${appointment.date.toLocaleDateString()} a las ${appointment.date.toLocaleTimeString()},tiene usted programada la consulta con el doctor ${doctor.name}. Recuerde estar 15 minutos antes de la hora. 
                    ATT: MEDICONNECT`);
                }
                return SUCCESS;
            } 
            else return ERROR;
        } catch (error) {
            return ERROR;
        }
    }

    public static async read(): Promise<Appointment[] | null> {
        try {
            return await this.repository.createQueryBuilder().getMany();
        } catch (error) {
            return null;
        }
    }

    public static async readEager() : Promise<Appointment[] | null> {
        try {
            return await this.repository.createQueryBuilder('appointment')
            .leftJoinAndSelect('appointment._patient', '_patient')
            .leftJoinAndSelect('appointment._doctor', '_doctor')
            .leftJoinAndSelect('appointment._medicalRecord', '_medicalRecord')
            .leftJoinAndSelect('_medicalRecord._recipe', 'recipe')
            .getMany();
        } catch (error) {
            return null;
        }
    }

    public static async udpate(req: Request) : Promise<number> {
        try {
            if (!req.xhr || !isset([req.body.id, req.body.reason, req.body.date]) || isNaN(req.body.id) || !isDate(req.body.date)) return ERROR;
            if (!this.superiorDate(new Date(req.body.date))) return NOT_ALLOWED;

            let appointment: Appointment | null = await this.findId(req);
            if (appointment === null || !(appointment instanceof Appointment)) return ERROR;

            if (isset([req.body.admission])) {
                if (appointment.admission === false && Boolean(req.body.admission) === true) {
                    appointment.date = new Date(req.body.date);

                    if (isset([req.body.idDoctor]) && !isNaN(req.body.idDoctor) && appointment.doctor?.id !== Number(req.body.idDoctor)) {
                        req.body.id = req.body.idDoctor;
                        let doctor = await DoctorController.findId(req);
                        appointment.doctor = doctor;
                    }

                    if (appointment.patient instanceof Patient && appointment.doctor instanceof Doctor) {
                        this.sendMessage (appointment, appointment.patient, 
                        `Estimado paciente, se le ha agendado una cita medica el ${appointment.date.toLocaleDateString()} a las ${appointment.date.toLocaleTimeString()},tiene usted programada la consulta con el doctor ${appointment.doctor.name}. Recuerde estar 15 minutos antes de la hora. 
                        ATT: MEDICONNECT`);   
                    }
                } else if (appointment.date.getTime() !== new Date(req.body.date).getTime() && isset([req.body.idDoctor]) && !isNaN(req.body.idDoctor) && appointment.doctor?.id !== Number(req.body.idDoctor)) {
                    appointment.date = new Date(req.body.date);
                    
                    req.body.id = req.body.idDoctor;
                    let doctor = await DoctorController.findId(req);
                    appointment.doctor = doctor;

                    if (appointment.patient instanceof Patient && appointment.doctor instanceof Doctor) {
                        this.sendMessage (appointment, appointment.patient, 
                        `Estimado paciente, queremos informarle que ha ocurrido un cambio en su asignación de doctor y en la fecha de su próxima cita. Ahora será atendido por el Dr./Dra. ${appointment.doctor.name} y su cita ha sido reprogramada para la fecha ${appointment.date.toLocaleString()}. Si tiene alguna pregunta o necesita información, no dude en contactarnos. 
                        ATT: MEDICONNECT`);
                    }
                } else if (appointment.date.getTime() !== new Date(req.body.date).getTime()) {
                    appointment.date = new Date(req.body.date);
                    if (appointment.patient instanceof Patient) {
                        this.sendMessage (appointment, appointment.patient, 
                        `Estimado paciente, queremos informarle que ha ocurrido un cambio en la fecha de su próxima médica. La nueva fecha es ${appointment.date.toLocaleString()}. Si tiene alguna pregunta o necesita reprogramar, no dude en contactarnos. 
                        ATT: MEDICONNECT`);
                    }
                } else if (isset([req.body.idDoctor]) && !isNaN(req.body.idDoctor) && appointment.doctor?.id !== Number(req.body.idDoctor)) {
                    req.body.id = req.body.idDoctor;
                    let doctor = await DoctorController.findId(req);
                    appointment.doctor = doctor;

                    if (appointment.patient instanceof Patient && appointment.doctor instanceof Doctor) {
                        this.sendMessage(appointment, appointment.patient, 
                        `Estimado paciente, le informamos que ha ocurrido un cambio en su asignación de doctor. A partir de ahora, su Dr./Dra. ${appointment.doctor.name} estará a cargo de su asistencia médica. No dude en comunicarse si tiene alguna inquietud. 
                        ATT: MEDICONNECT`);
                    }
                } else if (appointment.admission === true && Boolean(req.body.admission) === false) {
                    if (appointment.patient instanceof Patient) {
                        this.sendMessage(appointment, appointment.patient, 
                        `Estimado paciente, su cita ${(appointment.doctor instanceof Doctor) ? `con el doctor ${appointment.doctor.name}` : ''} de la fecha ${appointment.date.toLocaleDateString()} a las ${appointment.date.toLocaleTimeString()} ha sido cancelada, Puede reprogramar la cita en nuestro sito web. 
                        ATT: MEDICONNECT`)
                    }
                }

                appointment.admission = Boolean(req.body.admission);
            }

            appointment.reason = req.body.reason;
            appointment = await this.repository.save(appointment);
    
            if (appointment !== null && (appointment instanceof Appointment)) return SUCCESS;
            else return ERROR;
        } catch (error) {
            return ERROR;    
        }
    }

    public static async delete(req: Request) : Promise<number> {
        try {
            if (!req.xhr || !isset([req.body.id]) || isNaN(req.body.id)) return ERROR;

            let appointment: Appointment | null = await this.findId(req);
            if (!(appointment instanceof Appointment)) return ERROR;
            appointment = await this.repository.remove(appointment);

            if (appointment !== null && (appointment instanceof Appointment)) {
                if (appointment.patient instanceof Patient && appointment.doctor instanceof Doctor && appointment.admission === true) {
                    this.sendMessage(appointment, appointment.patient, `Estimado paciente, su cita ${(appointment.doctor instanceof Doctor) ? `con el doctor ${appointment.doctor.name}` : ''} de la fecha ${appointment.date.toLocaleDateString()} a las ${appointment.date.toLocaleTimeString()} ha sido cancelada, Puede reprogramar la cita en nuestro sito web. 
                    ATT: MEDICONNECT`)
                }
                return SUCCESS;
            } 
            else return ERROR;
        } catch (error) {
            console.error(error);
            return ERROR;
        }
    }

    public static async findId(req: Request) : Promise<Appointment | null> {
        try {
            if (!isset([req.body.id]) || isNaN(req.body.id)) return null;
            return await this.repository.createQueryBuilder('appointment')
            .where('appointment._id = :id', {id: Number(req.body.id)})
            .leftJoinAndSelect('appointment._patient', '_patient')
            .leftJoinAndSelect('appointment._doctor', '_doctor')
            .leftJoinAndSelect('appointment._medicalRecord', '_medicalRecord')
            .getOne();
        } catch (error) {
            return null;
        }
    }

    public static async uniqueAppointment(req: Request) : Promise<boolean> {
        let valid = false;
        try {
            if (!sessionPatient(req) && (!isset([req.body.idPatient]) || isNaN(req.body.idPatient))) return valid;
            const idPatient = (sessionPatient(req)) ? Number(req.session.patient) : Number(req.body.idPatient);
            const d = new Date();
            const dateFormat = `${d.getFullYear()}-${('0' + (d.getMonth() + 1)).slice(-2)}-${('0' + (d.getDate())).slice(-2)} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;
            const appointment = await this.repository.createQueryBuilder('appointment').where('appointment.Patient_id = :idPatient and appointment._date > :date', {idPatient: idPatient, date: dateFormat}).getOne();
            valid = !(appointment instanceof Appointment);
        } catch (error) {
            console.log(error);
        }
        return valid;
    }

    public static superiorDate(date: Date) : boolean {
        const now = new Date();
        return date >= now; 
    }

    public static async sendMessage(appointment: Appointment, patient: Patient, message: string) {
        let done = false;
        try {
            if (!(appointment instanceof Appointment) || !(patient instanceof Patient)) return done;
            const sms = new SMS(`+${patient.extensionTelephone}${patient.telephone}`, message);
            sms.send();
            return !done;
        } catch (error) {
            return done;
        }
    }

    public static async groupByPatientCount() : Promise<Appointment[] | null> {
        try {
            return await this.repository.createQueryBuilder('appointment')
            .innerJoin('patient', 'p', 'appointment.Patient_id = p._id')
            .select('COUNT(*), p._name')
            .addGroupBy('appointment.Patient_id')
            .orderBy('COUNT(*)', 'DESC')
            .limit(5)
            .getRawMany();
        } catch (error) {
            return null;
        }
    }

    public static async groupByWeekCount(): Promise<Appointment[] | null> {
        try {
            return await this.repository.createQueryBuilder('appointment')
            .select('COUNT(*), WEEKDAY(appointment._date)')
            .where('WEEKOFYEAR(NOW()) = WEEKOFYEAR(appointment._date) AND YEAR(NOW()) = YEAR(appointment._date)')
            .groupBy('WEEKDAY(appointment._date)')
            .orderBy('WEEKDAY(appointment._date)', 'ASC')
            .getRawMany();
        } catch (error) {
            return null;
        }
    }
}