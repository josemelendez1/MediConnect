import { upload, read as readImage, remove as removeImage } from "./image";
import { Request } from 'express';
import { isset } from "./requests";
import { Admin, Repository } from "typeorm";
import { AppDataSource } from "../models/db";
import { sessionAdministrator, sessionAssistant, sessionDoctor, sessionPatient } from "./session";
import { ERROR, NOT_ALLOWED, SUCCESS } from "./codes";
import { Administrator } from "../models/administrator.entity";


export class AdministratorController {
    private static repository: Repository<Administrator> = AppDataSource.getRepository(Administrator);
    private static readonly dirImages : string = 'D:/proyectos/MediConnect/uploads/images/administrator/';

    public static async create(req: Request): Promise<number> {
        try {
            if (!req.xhr) return ERROR;
            if (!isset([req.body.name, req.body.email, req.body.pass, req.body.telephone, req.body.area])) return ERROR;
            if (!(await this.emailAvailable(req) || !(await this.passAvailable(req)))) return NOT_ALLOWED;

            let administrator: Administrator = new Administrator(req.body.name, req.body.email, req.body.pass, req.body.telephone, req.body.area);
            administrator = await this.repository.save(administrator);
            
            if (administrator instanceof Administrator) {
                await upload(req, this.dirImages, administrator.id);
                return SUCCESS; 
            } else {
                return ERROR;
            }
        } catch (error) {
            return ERROR;
        }
    }

    public static async read(req: Request): Promise<Administrator[] | null> {
        try {
            if (!req.xhr) return null;
            const administrators : Administrator[] | null = await this.repository.createQueryBuilder('user').getMany();
            if (administrators instanceof Array) {
                for (let i = 0; i < administrators.length; i++) {
                    if (administrators[i] instanceof Administrator) {
                        administrators[i].imageURL = await readImage(this.dirImages, administrators[i].id);
                    }
                }
            }
            return administrators;
        } catch (error) {
            return null;
        }
    }

    public static async update(req: Request): Promise<number> {
        try {
            if (!req.xhr || !sessionAdministrator(req)) return ERROR;
            if (!isset([req.body.id, req.body.name, req.body.email, req.body.telephone, req.body.area ,req.body.pass])) return ERROR;
            if (isNaN(req.body.id)) return ERROR;

            let administrator = await this.repository.findOneBy({_id: Number(req.body.id)});

            if (!isset([administrator]) || !(administrator instanceof Administrator)) return ERROR;

            administrator.name = req.body.name;
            administrator.email = req.body.email;
            administrator.area = req.body.area;
            administrator.telephone = req.body.telephone;
            administrator.pass = req.body.pass;
            administrator = await this.repository.save(administrator);

            if (isset([administrator]) && administrator instanceof Administrator) {
                await upload(req, this.dirImages, administrator.id);
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
            if (Number(req.body.id) === 1) return NOT_ALLOWED;
            
            let administrator = await this.repository.findOneBy({_id : Number(req.body.id)});
            if (administrator instanceof Administrator) administrator = await this.repository.remove(administrator);

            if (administrator instanceof Administrator) {
                await removeImage(this.dirImages, Number(req.body.id));
                return SUCCESS;
            } else {
                return ERROR;
            } 
        } catch (error) {
            return ERROR;
        }
    }

    public static async findId(req: Request) : Promise<Administrator | null> {
        try {
            if (!req.xhr || !isset([req.body.id]) || isNaN(req.body.id)) return null;
            const administrator : Administrator | null = await this.repository.findOneBy({_id: Number(req.body.id)});
            if (administrator instanceof Administrator) administrator.imageURL = await readImage(this.dirImages, administrator.id);
            return administrator;
        } catch (error) {
            return null;
        }
    }

    public static async session(req: Request) : Promise<number> {
        try {
            if (!req.xhr || !isset([req.body.email, req.body.pass])) return ERROR;
            const administrator = await this.repository.findOneBy({_email: req.body.email, _pass: req.body.pass});
            if (administrator instanceof Administrator) {
                req.session.administrator = administrator.id;
                return SUCCESS;
            } else {
                return NOT_ALLOWED;
            }
        } catch (error) {
            return ERROR;
        }
    }

    public static async findSessionId(req: Request) : Promise<Administrator | null> {
        try {
            if (!req.xhr || !sessionAdministrator(req)) return null;
            const administrator = await this.repository.findOneBy({_id: Number(req.session.administrator)});
            if (administrator instanceof Administrator) administrator.imageURL = await readImage(this.dirImages, administrator.id);
            return administrator;
        } catch (error) {
            return null;
        }
    }

    private static async emailAvailable(req: Request) : Promise<boolean> {
        if (!req.xhr || !isset([req.body.email])) return false;
        const id = (isset([req.body.id]) && !isNaN(req.body.id)) ? Number(req.body.id) : 0;
        const result = await this.repository.createQueryBuilder('user').where('user._email = :email AND NOT user._id = :id', {email: req.body.email, id: id}).getCount() === 0;
        return result;
    }

    private static async passAvailable(req: Request) : Promise<boolean> {
        if (!req.xhr || !isset([req.body.pass])) return false;
        const id = (isset([req.body.id]) && !isNaN(req.body.id)) ? Number(req.body.id) : 0;
        return (await this.repository.createQueryBuilder('user').where('user._pass = :pass AND NOT user._id = :id', {pass: req.body.pass, id: id}).getCount()) === 0;
    }
}