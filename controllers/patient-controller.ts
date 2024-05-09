import { Repository } from "typeorm";
import { Patient } from "../models/patient.entity";
import { AppDataSource } from "../models/db";
import { ERROR, NOT_ALLOWED, SUCCESS } from "./codes";
import { Request } from "express";
import { isDate, isset } from "./requests";
import { upload, read as readImage, remove as removeImage } from "./image";
import { sessionPatient } from "./session";

export class PatientController {
    private static repository: Repository<Patient> = AppDataSource.getRepository(Patient);
    private static readonly dirImages : string = 'D:/proyectos/MediConnect/uploads/images/patient/';

    public static async create(req: Request): Promise<number> {
        try {
            if (!req.xhr) return ERROR;
            if (!isset([req.body.name, req.body.email, req.body.pass, req.body.extension, req.body.telephone, req.body.birthdate]) || !isDate(req.body.birthdate)) return ERROR;
            if (!(await this.emailAvailable(req)) || !(await this.passAvailable(req))) return NOT_ALLOWED;
            
            let patient = new Patient(req.body.name, req.body.email, req.body.pass, req.body.extension, req.body.telephone, new Date(req.body.birthdate));
            patient = await this.repository.save(patient);

            if (patient instanceof Patient) {
                await upload(req, this.dirImages, patient.id);
                req.session.patient = patient.id;
                return SUCCESS;
            } else {
                return ERROR;
            }
        } catch (error) {
            console.error(error);
            return ERROR;
        }
    }

    public static async read(): Promise<Patient[] | null> {
        try {
            const patients: Patient[] = await this.repository.createQueryBuilder().getMany();
            if (patients instanceof Array) {
                for (let i = 0; i < patients.length; i++) {
                    if (patients[i] instanceof Patient) patients[i].imageURL = await readImage(this.dirImages, patients[i].id);
                }
            }
            return patients;
        } catch (error) {
            return null;
        }
    }

    public static async readEager(): Promise<Patient[] | null> {
        try {
            let patients = await this.repository.createQueryBuilder('patient')
            .leftJoinAndSelect('patient._appointments', '_appointments')
            .leftJoinAndSelect('_appointments._doctor', '_doctor')
            .leftJoinAndSelect('_appointments._medicalRecord', '_medicalRecord')
            .leftJoinAndSelect('_medicalRecord._recipe', '_recipe')
            .getMany();

            if (patients instanceof Array) {
                for (let i = 0; i < patients.length; i++) {
                    if (patients[i] instanceof Patient) patients[i].imageURL = await readImage(this.dirImages, patients[i].id);
                }
            }
            return patients;
        } catch (error) {
            return null;
        }
    }

    public static async update(req: Request): Promise<number> {
        try {
            if (!req.xhr) return ERROR;
            if (!isset([req.body.id, req.body.name, req.body.email, req.body.pass, req.body.extension, req.body.telephone, req.body.birthdate]) || isNaN(req.body.id) || !isDate(req.body.birthdate)) return ERROR;
            if (!(await this.emailAvailable(req)) || !(await this.passAvailable(req))) return NOT_ALLOWED;

            let patient = await this.repository.findOneBy({_id: Number(req.body.id)});
            if (!(patient instanceof Patient)) return ERROR;
            patient.name = req.body.name;
            patient.email = req.body.email;
            patient.pass = req.body.pass;
            patient.extensionTelephone = req.body.extension;
            patient.telephone = req.body.telephone;
            patient.birthdate = new Date(req.body.birthdate);
            patient = await this.repository.save(patient);

            if (patient instanceof Patient) {
                upload(req, this.dirImages, patient.id);
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
            if (!req.xhr) return ERROR;
            if (!isset([req.body.id]) || isNaN(req.body.id)) return ERROR;

            let patient = await this.repository.findOneBy({_id: Number(req.body.id)});
            if (patient instanceof Patient) patient = await this.repository.remove(patient);
            if (patient instanceof Patient) {
                await removeImage(this.dirImages, Number(req.body.id));
                return SUCCESS;
            } else {
                return ERROR;
            }
        } catch (error) {
            return ERROR;
        }
    }

    public static async findById(req: Request) : Promise<Patient | null> {
        try {
            if (!isset(req.body.id) || isNaN(req.body.id)) return null;
            const patient = await this.repository.findOneBy({_id: req.body.id});
            if (patient instanceof Patient) patient .imageURL = await readImage(this.dirImages, patient.id);
            return patient;
        } catch (error) {
            return null;  
        }
    }

    public static async findBydIdEager(id: number): Promise<Patient | null> {
        try {
            if (!isset([id]) || isNaN(id)) return null;
            else return await this.repository.createQueryBuilder('patient')
            .where('patient._id = :id', {id: Number(id)})
            .leftJoinAndSelect('patient._appointments', '_appointments')
            .leftJoinAndSelect('_appointments._doctor', '_doctor')
            .leftJoinAndSelect('_appointments._medicalRecord', '_medicalRecord')
            .leftJoinAndSelect('_medicalRecord._recipe', '_recipe')
            .leftJoinAndSelect('_medicalRecord._diagnosedDiseases', '_diagnosedDiseases')
            .leftJoinAndSelect('_diagnosedDiseases._disease', '_disease')
            .leftJoinAndSelect('_recipe._prescriptionMedications', '_prescriptionMedications')
            .leftJoinAndSelect('_prescriptionMedications._medicine', '_medicine')
            .getOne();
        } catch (error) {
            return null;
        }
    }

    public static async session(req: Request) : Promise<number> {
        try {
            if (!req.xhr || !isset([req.body.email, req.body.pass])) return ERROR;
            const patient: Patient | null = await this.repository.findOneBy({_email: req.body.email, _pass: req.body.pass});
            if (patient instanceof Patient) {
                req.session.patient = patient.id;
                return SUCCESS;
            } else {
                return NOT_ALLOWED;
            }
        } catch (error) {
            return ERROR;
        }
    }

    public static async findBySession(req: Request) : Promise<Patient | null> {
        try {
            if (!req.xhr || !sessionPatient(req)) return null;
            const patient = await this.repository.findOneBy({_id: Number(req.session.patient)});
            if (patient instanceof Patient) patient.imageURL = await readImage(this.dirImages, patient.id);
            return patient;
        } catch (error) {
            return null;
        }
    }

    public static async uploadImage(req: Request) : Promise<number> {
        if (!isset([req.body.id]) || isNaN(req.body.id)) return ERROR;
        if (await upload(req, this.dirImages, Number(req.body.id))) return SUCCESS;
        else return ERROR;
    }

    public static async deleteImage(req: Request) : Promise<number> {
        if (!isset([req.body.id]) || isNaN(req.body.id)) return ERROR;
        if (await removeImage(this.dirImages, Number(req.body.id))) return SUCCESS;
        else return ERROR;
    }

    private static async emailAvailable(req: Request): Promise<boolean> {
        if (!req.xhr || !isset([req.body.email])) return false;
        const id = (isset([req.body.id]) && !isNaN(req.body.id)) ? Number(req.body.id) : 0;
        const result = await this.repository.createQueryBuilder('user').where('user._email = :email AND NOT user._id = :id', {email: req.body.email, id: id}).getCount() === 0;
        return result;
    }

    private static async passAvailable(req: Request): Promise<boolean> {
        if (!req.xhr || !isset([req.body.pass])) return false;
        const id = (isset([req.body.id]) && !isNaN(req.body.id)) ? Number(req.body.id) : 0;
        return (await this.repository.createQueryBuilder('user').where('user._pass = :pass AND NOT user._id = :id', {pass: req.body.pass, id: id}).getCount()) === 0;
    }
    
}