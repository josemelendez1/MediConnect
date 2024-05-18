import { upload, remove as removeImage, read as readImage } from "./image";
import { Request } from 'express';
import { isset } from "./requests";
import { Repository } from "typeorm";
import { AppDataSource } from "../models/db";
import { sessionAdministrator, sessionDoctor } from "./session";
import { ERROR, NOT_ALLOWED, NOT_NUMBER, SUCCESS } from "./codes";
import { Doctor } from "../models/doctor.entity";

export class DoctorController {
    private static repository: Repository<Doctor> = AppDataSource.getRepository(Doctor);
    private static readonly dirImages : string = 'D:/proyectos/MediConnect/uploads/images/doctor/';

    public static async create(req: Request) : Promise<number> {
        try {
            if (!req.xhr || !sessionAdministrator(req) || !isset([req.body.name, req.body.email, req.body.pass, req.body.idType, req.body.idNumber, req.body.address, req.body.telephone])) return ERROR;
            if (!(await this.emailAvailable(req)) || !(await this.passAvailable(req)) || !(await this.idNumberAvailable(req))) return NOT_ALLOWED;
            if (isNaN(req.body.idNumber)) return NOT_NUMBER;
        
            let doctor = new Doctor(req.body.name, req.body.email, req.body.pass, req.body.idType, req.body.idNumber, req.body.address, req.body.telephone);
            doctor = await this.repository.save(doctor);
        
            if (doctor !== null && doctor !== undefined && doctor instanceof Doctor) {
                if (await upload(req, this.dirImages, doctor.id)) {
                    doctor.imageURL = await readImage(this.dirImages, doctor.id);
                    await this.repository.save(doctor);
                } 
                return SUCCESS;
            } else {
                return ERROR;
            }
        } catch (error) {
            return ERROR;
        }
    }

    public static async update(req: Request) : Promise<number> {
        try {
            if (!req.xhr || !isset([req.body.id, req.body.name, req.body.email, req.body.pass, req.body.idType, req.body.idNumber, req.body.address, req.body.telephone]) || isNaN(req.body.id)) return ERROR;
            if (!(await this.emailAvailable(req)) || !(await this.passAvailable(req)) || !(await this.idNumberAvailable(req))) return NOT_ALLOWED;
            if (isNaN(req.body.idNumber)) return NOT_NUMBER;
    
            let doctor : Doctor | null = await this.repository.findOneBy({_id : Number(req.body.id)});
    
            if (doctor === null || !(doctor instanceof Doctor)) return ERROR;
            
            doctor.name = req.body.name;
            doctor.email = req.body.email;
            doctor.pass = req.body.pass;
            doctor.idType = req.body.idType;
            doctor.idNumber = req.body.idNumber;
            doctor.address = req.body.address;
            doctor.telephone = req.body.telephone;
            doctor = await this.repository.save(doctor);

            if (doctor !== null && (doctor instanceof Doctor)) {
                if (await upload(req, this.dirImages, doctor.id)) {
                    doctor.imageURL = await readImage(this.dirImages, doctor.id);
                    await this.repository.save(doctor);
                }
                return SUCCESS;
            } else {
                return ERROR;
            }

        } catch (error) {
            return ERROR;    
        }
    }

    public static async delete(req: Request) : Promise<number> {
        try {
            if (!req.xhr || !isset([req.body.id]) || isNaN(req.body.id)) return ERROR;

            let doctor : Doctor | null = await this.repository.findOneBy({_id: Number(req.body.id)});
            
            if (doctor === null || !(doctor instanceof Doctor)) return ERROR;
            
            doctor = await this.repository.remove(doctor);

            if (doctor !== null && (doctor instanceof Doctor)) {
                await removeImage(this.dirImages, Number(req.body.id));
                return SUCCESS;
            } else {
                return ERROR;
            }
        } catch (error) {
            return ERROR;
        }
    }

    public static async read() : Promise<Doctor[] | null> {
        try {
            let doctors = await this.repository.createQueryBuilder().getMany();
            if (doctors instanceof Array) {
                for (let i = 0; i < doctors.length; i++) {
                    if (doctors[i] instanceof Doctor) {
                        doctors[i].imageURL = await readImage(this.dirImages, doctors[i].id);
                    }
                }
            }
            return doctors;
        } catch (error) {
            return null;
        }
    }

    public static async readEager() : Promise<Doctor[] | null> {
        try {
            let doctors = await this.repository.createQueryBuilder('doctor')
            .leftJoinAndSelect('doctor._appointments', '_appointments')
            .leftJoinAndSelect('_appointments._patient', '_patient')
            .leftJoinAndSelect('_appointments._medicalRecord', '_medicalRecord')
            .leftJoinAndSelect('_medicalRecord._recipe', '_recipe')
            .getMany();

            if (doctors instanceof Array) {
                for (let i = 0; i < doctors.length; i++) {
                    if (doctors[i] instanceof Doctor) {
                        doctors[i].imageURL = await readImage(this.dirImages, doctors[i].id);
                    }
                }
            }
            return doctors;
        } catch (error) {
            return null;
        }
    }

    public static async findId(req: Request) : Promise<Doctor | null> {
        try {
            if (!isset([req.body.id]) || isNaN(req.body.id)) return null;
            const doctor = await this.repository.findOneBy({_id: Number(req.body.id)});
            if (doctor instanceof Doctor) {
                doctor.imageURL = await readImage(this.dirImages, doctor.id);
            }
            return doctor;
        } catch (error) {
            return null;
        }
    }

    public static async findByIdEager(id: number): Promise<Doctor | null> {
        try {
            if (!isset([id]) || isNaN(id)) return null;
            const doctor = await this.repository
            .createQueryBuilder('doctor')
            .where('doctor._id = :id', {id: Number(id)})
            .leftJoinAndSelect('doctor._appointments', '_appointments')
            .leftJoinAndSelect('_appointments._patient', '_patient')
            .leftJoinAndSelect('_appointments._medicalRecord', '_medicalRecord')
            .leftJoinAndSelect('_medicalRecord._recipe', '_recipe')
            .getOne();
            if (doctor instanceof Doctor) doctor.imageURL = await readImage(this.dirImages, doctor.id);
            return doctor;
        } catch (error) {
            return null;
        }
    }

    public static async session(req: Request) : Promise<number> {
        try {
            if (!req.xhr || !isset([req.body.email, req.body.pass])) return ERROR;
            const doctor = await this.repository.findOneBy({_email: req.body.email, _pass: req.body.pass});
            if (doctor instanceof Doctor) {
                req.session.doctor = doctor.id;
                return SUCCESS;
            } else {
                return NOT_ALLOWED;
            }
        } catch (error) {
            return ERROR;
        }
    }

    public static async uploadImage(req: Request) : Promise<number> {
        if (!isset([req.body.id]) || isNaN(req.body.id)) return ERROR;

        let doctor = await this.findId(req);
        if (!(doctor instanceof Doctor)) return ERROR;

        if (await upload(req, this.dirImages, doctor.id)) {
            doctor.imageURL = await readImage(this.dirImages, doctor.id);
            await this.repository.save(doctor);
            return SUCCESS;
        }
        else return ERROR;
    }

    public static async deleteImage(req: Request) : Promise<number> {
        if (!isset([req.body.id]) || isNaN(req.body.id)) return ERROR;

        let doctor = await this.findId(req);
        if (!(doctor instanceof Doctor)) return ERROR;

        if (await removeImage(this.dirImages, Number(req.body.id))) {
            doctor.imageURL = null;
            await this.repository.save(doctor);
            return SUCCESS;
        }
        else return ERROR;
    }

    public static async findSessionId(req: Request) : Promise<Doctor | null> {
        try {
            if (!sessionDoctor(req)) return null;
            const doctor = await this.repository.findOneBy({_id: Number(req.session.doctor)});
            if (doctor instanceof Doctor) doctor.imageURL = await readImage(this.dirImages, doctor.id);
            return doctor;
        } catch (error) {
            return null;
        }
    }

    public static async emailAvailable(req: Request) : Promise<boolean> {
        if (!req.xhr || !isset([req.body.email])) return false;
        const id = (isset([req.body.id]) && !isNaN(req.body.id)) ? Number(req.body.id) : 0;
        const result = await this.repository.createQueryBuilder('user').where('user._email = :email AND NOT user._id = :id', {email: req.body.email, id: id}).getCount() === 0;
        return result;
    }

    public static async passAvailable(req: Request) : Promise<boolean> {
        if (!req.xhr || !isset([req.body.pass])) return false;
        const id = (isset([req.body.id]) && !isNaN(req.body.id)) ? Number(req.body.id) : 0;
        return (await this.repository.createQueryBuilder('user').where('user._pass = :pass AND NOT user._id = :id', {pass: req.body.pass, id: id}).getCount()) === 0;
    }

    public static async idNumberAvailable(req: Request) : Promise<boolean> {
        if (!req.xhr || !isset([req.body.idNumber])) return false;
        const id = (isset([req.body.id]) && !isNaN(req.body.id)) ? Number(req.body.id) : 0;
        return (await this.repository.createQueryBuilder('user').where('user._idNumber = :idNumber AND NOT user._id = :id', {idNumber: req.body.idNumber, id: id}).getCount()) === 0;
    }
    
}