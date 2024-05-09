import { Request } from 'express';
import { isset } from "./requests";
import { Repository } from "typeorm";
import { AppDataSource } from "../models/db";
import { ERROR, NOT_ALLOWED, SUCCESS } from "./codes";
import { MedicalRecord } from "../models/medicalRecord.entity";
import { DiagnosedDiseaseController } from './diagnosedDisease-controller';
import { AppointmentController } from './appointment-controller';
import { Appointment } from '../models/appointment.entity';
import { Doctor } from '../models/doctor.entity';
import { DoctorController } from './doctor-controller';

export class MedicalRecordController {
    private static repository: Repository<MedicalRecord> = AppDataSource.getRepository(MedicalRecord);

    public static async create(req: Request): Promise<number> {
        try {
            if (!req.xhr || !isset([req.body.risk, req.body.reason]) || isNaN(req.body.risk)) return ERROR;

            req.body.id = req.body.idAppointment;
            let appointment = await AppointmentController.findId(req);
            if (!(appointment instanceof Appointment)) return NOT_ALLOWED;

            let medicalRecord = new MedicalRecord(Number(req.body.risk), req.body.reason);
            medicalRecord.appointment = appointment;
            medicalRecord = await this.repository.save(medicalRecord);
        
            if (medicalRecord !== null && medicalRecord instanceof MedicalRecord) {
                req.body.idRecord = medicalRecord.id;
                await DiagnosedDiseaseController.save(req);
                return SUCCESS;
            }
            else return ERROR;
        } catch (error) {
            return ERROR;
        }
    }

    public static async update(req: Request): Promise<number> {
        try {
            if (isNaN(req.body.risk)) return ERROR;
            if (!req.xhr || !isset([req.body.risk, req.body.reason])) return ERROR;
            if (!isset([req.body.id]) || isNaN(req.body.id)) return this.create(req);
    
            let medicalRecord : MedicalRecord | null = await this.repository.findOneBy({_id : Number(req.body.id)});
            if (medicalRecord === null || !(medicalRecord instanceof MedicalRecord)) return this.create(req);

            medicalRecord.risk = req.body.risk;
            medicalRecord.reason = req.body.reason;
            medicalRecord = await this.repository.save(medicalRecord);
    
            if (medicalRecord !== null && (medicalRecord instanceof MedicalRecord)) {
                req.body.idRecord = medicalRecord.id;
                await DiagnosedDiseaseController.save(req);
                return SUCCESS;
            } else {
                return ERROR;
            }   
        } catch (error) {
            return ERROR;    
        }
    }

    public static async delete(req: Request): Promise<number> {
        try {
            if (!req.xhr || !isset([req.body.id]) || isNaN(req.body.id)) return ERROR;

            let medicalRecord : MedicalRecord | null = await this.repository.findOneBy({_id: Number(req.body.id)});
            
            if (medicalRecord === null || !(medicalRecord instanceof MedicalRecord)) return ERROR;
            
            medicalRecord = await this.repository.remove(medicalRecord);

            if (medicalRecord !== null && (medicalRecord instanceof MedicalRecord)) return SUCCESS;
            else return ERROR;
        } catch (error) {
            return ERROR;
        }
    }

    public static async read(): Promise<MedicalRecord[] | null> {
        try {
            return await this.repository.createQueryBuilder().getMany();
        } catch (error) {
            return null;
        }
    }

    public static async readEager(): Promise<MedicalRecord[] | null> {
        try {
            return await this.repository.createQueryBuilder('medicalRecord')
            .leftJoinAndSelect('medicalRecord._appointment', '_appointment')
            .leftJoinAndSelect("medicalRecord._recipe", "_recipe")
            .leftJoinAndSelect("_appointment._patient", "_patient")
            .leftJoinAndSelect("_appointment._doctor", "_doctor")
            .leftJoinAndSelect("medicalRecord._diagnosedDiseases", "_diagnosedDiseases")
            .leftJoinAndSelect("_diagnosedDiseases._disease", "_disease")
            .getMany();
        } catch (error) {
            return null;
        }
    }
    
    public static async findId(req: Request) : Promise<MedicalRecord | null> {
        try {
            if (!isset([req.body.id]) || isNaN(req.body.id)) return null;
            return await this.repository.createQueryBuilder('medicalRecord')
            .where('medicalRecord._id = :id', {id: Number(req.body.id)})
            .leftJoinAndSelect('medicalRecord._appointment', '_appointment')
            .leftJoinAndSelect("_appointment._patient", "_patient")
            .leftJoinAndSelect("_appointment._doctor", "_doctor")
            .leftJoinAndSelect("medicalRecord._recipe", "_recipe")
            .leftJoinAndSelect("medicalRecord._diagnosedDiseases", "_diagnosedDiseases")
            .leftJoinAndSelect("_diagnosedDiseases._disease", "_disease")
            .getOne();
        } catch (error) {
            return null;
        }
    }

    public static async findByAppointent(id: number | undefined): Promise<MedicalRecord | null> {
        try {
            if (id === undefined || isNaN(id)) return null;
            return await this.repository
            .createQueryBuilder('medicalRecord')
            .where('medicalRecord._idAppointment = :id', {id: Number(id)})
            .leftJoinAndSelect('medicalRecord._appointment', '_appointment')
            .leftJoinAndSelect("_appointment._patient", "_patient")
            .leftJoinAndSelect("_appointment._doctor", "_doctor")
            .leftJoinAndSelect('medicalRecord._recipe', '_recipe')
            .leftJoinAndSelect("medicalRecord._diagnosedDiseases", "_diagnosedDiseases")
            .leftJoinAndSelect("_diagnosedDiseases._disease", "_disease")
            .getOne();
        } catch (error) {
            return null;
        }
    }
}