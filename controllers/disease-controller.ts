import { upload, remove as removeImage, read as readImage, remove } from "./image";
import { Request } from 'express';
import { isset } from "./requests";
import { Repository } from "typeorm";
import { AppDataSource } from "../models/db";
import { sessionAdministrator, sessionDoctor } from "./session";
import { ERROR, NOT_ALLOWED, SUCCESS } from "./codes";
import { Disease } from "../models/disease.entity";

export class DiseaseController {
    private static repository: Repository<Disease> = AppDataSource.getRepository(Disease);
    private static readonly dirImages : string = (__dirname + '/uploads/images/disease/').replace(/\\/g, '/').replace('/controllers', ''); 
    
    public static async create(req: Request) : Promise<number> {
        try {
            if (!req.xhr || !isset([req.body.name, req.body.scientificName, req.body.severity, req.body.description])) return ERROR;
        
            let disease = new Disease(req.body.name, req.body.scientificName, req.body.severity, req.body.description);
            if (sessionAdministrator(req)) disease.idAdministrator = Number(req.session.administrator);
            disease = await this.repository.save(disease);
        
            if (disease !== null && disease !== undefined && (disease instanceof Disease)) {
                await upload(req, this.dirImages, disease.id);
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
            if (!req.xhr || !isset([req.body.id, req.body.name, req.body.scientificName, req.body.severity, req.body.description])) return ERROR;
            if (isNaN(req.body.id)) return ERROR;
    
            let disease : Disease | null = await this.repository.findOneBy({_id : Number(req.body.id)});
    
            if (disease === null || !(disease instanceof Disease)) return ERROR;
            
            if (sessionAdministrator(req)) disease.idAdministrator = Number(req.session.administrator);
            disease.name = req.body.name;
            disease.scientificName = req.body.scientificName;
            disease.severity = req.body.severity;
            disease.description = req.body.description;
            disease = await this.repository.save(disease);
    
            if (disease !== null && disease instanceof Disease) {
                await upload(req, this.dirImages, disease.id);
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

            let disease : Disease | null = await this.repository.findOneBy({_id: Number(req.body.id)});
            
            if (disease === null || !(disease instanceof Disease)) return ERROR;
            
            disease = await this.repository.remove(disease);

            if (disease !== null && (disease instanceof Disease)) {
                await removeImage(this.dirImages, Number(req.body.id));
                return SUCCESS;
            } else {
                return ERROR;
            }

        } catch (error) {
            return ERROR;
        }
    }

    public static async read(req: Request) : Promise<Disease[] | null> {
        try {
            if (!req.xhr) return null;
            const diseases = await this.repository.createQueryBuilder('disease').getMany();
            if (diseases instanceof Array) {
                for (let i = 0; i < diseases.length; i++) {
                    if (diseases[i] instanceof Disease) {
                        diseases[i].imageURL = await readImage(this.dirImages, diseases[i].id);
                    }
                }
            }
            return diseases;
        } catch (error) {
            return null;
        }
    }

    public static async findId(req: Request) : Promise<Disease | null> {
        try {
            if (!isset([req.body.id]) || isNaN(req.body.id)) return null;
            const disease : Disease | null = await this.repository.findOneBy({_id: Number(req.body.id)});
            if (disease instanceof Disease) {
                disease.imageURL = await readImage(this.dirImages, disease.id);
            }
            return disease;
        } catch (error) {
            return null;
        }
    }

    public static async filter(req: Request) : Promise<Disease[] | null> {
        try {
            if (!req.xhr || !isset([req.body.text])) return null;
            const diseases = await this.repository.createQueryBuilder('disease')
            .where('disease._name like :name OR disease._scientificName like :scientificName', {name: `%${req.body.text}%`, scientificName: `%${req.body.text}%`})
            .getMany();

            if (diseases instanceof Array) {
                for (let i = 0; i < diseases.length; i++) {
                    if (diseases[i] instanceof Disease) {
                        diseases[i].imageURL = await readImage(this.dirImages, diseases[i].id);
                    }
                }
            }

            return diseases;
        } catch (error) {
            return null;
        }
    }
}