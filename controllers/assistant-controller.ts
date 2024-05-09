import { upload, remove as removeImage, read as readImage, remove } from "./image";
import { Request } from 'express';
import { isset } from "./requests";
import { Repository } from "typeorm";
import { AppDataSource } from "../models/db";
import { sessionAdministrator, sessionAssistant } from "./session";
import { ERROR, NOT_ALLOWED, SUCCESS } from "./codes";
import { Assistant } from "../models/assistant.entity";

export class AssistantController {
    private static repository: Repository<Assistant> = AppDataSource.getRepository(Assistant);
    private static readonly dirImages : string = 'D:/proyectos/MediConnect/uploads/images/assistant/';

    public static async create(req: Request) : Promise<number> {
        try {
            if (!req.xhr || !sessionAdministrator(req) || !isset([req.body.name, req.body.email, req.body.pass, req.body.idType, req.body.idNumber])) return ERROR;
            if (!(await this.emailAvailable(req)) || !(await this.passAvailable(req)) || !(await this.idNumberAvailable(req))) return NOT_ALLOWED;
            if (isNaN(req.body.idNumber)) return ERROR;
        
            let assistant = new Assistant(req.body.name, req.body.email, req.body.pass, req.body.idType, req.body.idNumber);
            assistant = await this.repository.save(assistant);
        
            if (assistant != null && assistant != undefined && assistant instanceof Assistant) {
                await upload(req, this.dirImages, assistant.id);
                return SUCCESS;
            } else {
                return ERROR;
            }
        } catch (error) {
            return ERROR;
        }
    }

    public static async read(req: Request) : Promise<Assistant[] | null> {
        try {
            if (!req.xhr) return null;
            const assistants : Assistant[] = await this.repository.createQueryBuilder('assistant').getMany();
            if (assistants instanceof Array) {
                for (let i = 0; i < assistants.length; i++) {
                    if (assistants[i] instanceof Assistant) {
                        assistants[i].imageURL = await readImage(this.dirImages, assistants[i].id);
                    }
                }
            }
            return assistants;
        } catch (error) {
            return null;
        }
    }

    public static async update(req: Request) : Promise<number> {
        try {
            if (!req.xhr || !isset([req.body.id, req.body.name, req.body.email, req.body.pass, req.body.idType, req.body.idNumber])) return ERROR;
            if (!(await this.emailAvailable(req)) || !(await this.passAvailable(req)) || !(await this.idNumberAvailable(req))) return NOT_ALLOWED;
            if (isNaN(req.body.id) || isNaN(req.body.idNumber)) return ERROR;
    
            let assistant : Assistant | null = await this.repository.findOneBy({_id : Number(req.body.id)});
    
            if (assistant === null || !(assistant instanceof Assistant)) return ERROR;
    
            assistant.name = req.body.name;
            assistant.email = req.body.email;
            assistant.pass = req.body.pass;
            assistant.idType = req.body.idType;
            assistant.idNumber = req.body.idNumber;
            assistant = await this.repository.save(assistant);
    
            if (assistant !== null && (assistant instanceof Assistant)) {
                await upload(req, this.dirImages, assistant.id);
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
            if (!req.xhr || !sessionAdministrator(req) || !isset([req.body.id]) || isNaN(req.body.id)) return ERROR;

            let assistant : Assistant | null = await this.repository.findOneBy({_id: Number(req.body.id)});
            
            if (assistant === null || !(assistant instanceof Assistant)) return ERROR;
            
            assistant = await this.repository.remove(assistant);

            if (assistant !== null && (assistant instanceof Assistant)) {
                await removeImage(this.dirImages, Number(req.body.id));
                return SUCCESS;
            } else {
                return ERROR;
            }
        } catch (error) {
            return ERROR;
        }
    }

    public static async findId(req: Request) : Promise<Assistant | null> {
        try {
            if (!req.xhr || !isset([req.body.id]) || isNaN(req.body.id)) return null;
            const assistant = await this.repository.findOneBy({_id: Number(req.body.id)});
            if (assistant instanceof Assistant) {
                assistant.imageURL = await readImage(this.dirImages, assistant.id);
            }
            return assistant;
        } catch (error) {
            return null;
        }
    }

    public static async findSessionId(req: Request) : Promise<Assistant | null> {
        try {
            if (!req.xhr || !sessionAssistant(req)) return null;
            const assistant = await this.repository.findOneBy({_id: Number(req.session.assistant)});
            if (assistant instanceof Assistant) assistant.imageURL = await readImage(this.dirImages, assistant.id);
            return assistant;
        } catch (error) {
            return null;
        }
    }

    public static async session(req: Request) : Promise<number> {
        try {
            if (!req.xhr || !isset([req.body.email, req.body.pass])) return ERROR;
            const assistant = await this.repository.findOneBy({_email: req.body.email, _pass: req.body.pass});
            if (assistant instanceof Assistant) {
                req.session.assistant = assistant.id;
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
        if (await upload(req, this.dirImages, Number(req.body.id))) return SUCCESS;
        else return ERROR;
    }

    public static async deleteImage(req: Request) : Promise<number> {
        if (!isset([req.body.id]) || isNaN(req.body.id)) return ERROR;
        if (await removeImage(this.dirImages, Number(req.body.id))) return SUCCESS;
        else return ERROR;
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