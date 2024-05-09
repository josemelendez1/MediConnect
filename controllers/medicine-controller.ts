import { upload, remove as removeImage, read as readImage } from "./image";
import { Request } from 'express';
import { isset } from "./requests";
import { Repository } from "typeorm";
import { AppDataSource } from "../models/db";
import { sessionAdministrator, sessionDoctor } from "./session";
import { ERROR, SUCCESS } from "./codes";
import { Medicine } from "../models/medicine.entity";

export class MedicineController {
    private static repository: Repository<Medicine> = AppDataSource.getRepository(Medicine);
    private static readonly dirImages : string = 'D:/proyectos/MediConnect/uploads/images/medicine/';

    public static async create(req: Request) : Promise<number> {
        try {
            if (!req.xhr || !isset([req.body.name, req.body.quantities, req.body.presentations, req.body.information])) return ERROR;
        
            let medicine = new Medicine(req.body.name, req.body.quantities, req.body.presentations, req.body.information);
            if (sessionAdministrator(req)) medicine.idAdministrator = Number(req.session.administrator);
            medicine = await this.repository.save(medicine);
        
            if (medicine != null && medicine != undefined && (medicine instanceof Medicine)) {
                await upload(req, this.dirImages, medicine.id);
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
            if (!req.xhr || !isset([req.body.id, req.body.name, req.body.quantities, req.body.presentations, req.body.information])) return ERROR;
            if (isNaN(req.body.id)) return ERROR;
    
            let medicine : Medicine | null = await this.repository.findOneBy({_id : Number(req.body.id)});
    
            if (medicine === null || !(medicine instanceof Medicine)) return ERROR;
    
            medicine.name = req.body.name;
            medicine.quantities = req.body.quantities;
            medicine.presentations = req.body.presentations;
            medicine.information = req.body.information;
            if (sessionAdministrator(req)) medicine.idAdministrator = Number(req.session.administrator);
    
            medicine = await this.repository.save(medicine);
    
            if (medicine !== null && (medicine instanceof Medicine)) {
                await upload(req, this.dirImages, medicine.id);
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

            let medicine : Medicine | null = await this.repository.findOneBy({_id: Number(req.body.id)});
            
            if (medicine === null || !(medicine instanceof Medicine)) return ERROR;
            
            medicine = await this.repository.remove(medicine);

            if (medicine !== null && (medicine instanceof Medicine)) {
                await removeImage(this.dirImages, Number(req.body.id));
                return SUCCESS;
            } else {
                return ERROR;
            }

        } catch (error) {
            return ERROR;
        }
    }

    public static async read(req: Request) : Promise<Medicine[] | null> {
        try {
            if (!req.xhr) return null;
            const medicines: Medicine[] | null = await this.repository.createQueryBuilder('medicine').getMany();
            for (let i = 0; i < medicines.length; i++) {
                medicines[i].imageURL = await readImage(this.dirImages, medicines[i].id);
            }
            return medicines;
        } catch (error) {
            return null;
        }
    }

    public static async findId(req: Request) : Promise<Medicine | null> {
        try {
            if (!isset([req.body.id]) || isNaN(req.body.id)) return null;
            const medicine = await this.repository.findOneBy({_id: Number(req.body.id)});
            if (medicine instanceof Medicine) medicine.imageURL = await readImage(this.dirImages, medicine.id);
            return medicine; 
        } catch (error) {
            return null;
        }
    }

    public static async filter(req: Request) : Promise<Medicine[] | null> {
        try {
            if (!req.xhr || !isset([req.body.text])) return null;
            const medicines = await this.repository.createQueryBuilder('medicine')
            .where('medicine._name like :name OR medicine._information like :information', {name: `%${req.body.text}%`, information: `%${req.body.text}%`})
            .getMany();

            if (medicines instanceof Array) {
                for (let i = 0; i < medicines.length; i++) {
                    if (medicines[i] instanceof Medicine) {
                        medicines[i].imageURL = await readImage(this.dirImages, medicines[i].id);
                    }
                }
            }

            return medicines;
        } catch (error) {
            return null;
        }
    }
}