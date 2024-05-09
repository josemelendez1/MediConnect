import fs from 'fs';
import { Request } from 'express';
import { Repository } from "typeorm";
import { AppDataSource } from "../models/db";
import { ERROR, SUCCESS } from './codes';
import { isset } from './requests';
import { UploadedFile } from "express-fileupload";
import { CarrouselImage } from "../models/carrousel-image.entity";
import { upload, remove as removeImage, read as readImage } from './image';

export class CarrouselImageController {
    private static repository: Repository<CarrouselImage> = AppDataSource.getRepository(CarrouselImage);
    private static readonly dirImages : string = 'D:/proyectos/MediConnect/uploads/images/carrousel/';

    public static async create(req: Request): Promise<number | undefined> {
        try {
            if (!req.xhr) return ERROR;
            if (!req.files || Object.keys(req.files).length === 0) return ERROR;

            let file: UploadedFile | UploadedFile[] = req.files.image as UploadedFile;
            if (!isset([file])) return ERROR;

            

            let name: string | undefined = file.name;
            let extension: string | undefined = name.substring(name.lastIndexOf('.'));
            let image: CarrouselImage | undefined = new CarrouselImage(name, extension);
            image = await this.repository.save(image);

            if (isset([image]) && (image instanceof CarrouselImage)) {
                const uploaded : boolean = await upload(req, this.dirImages, image.id);
                return SUCCESS;
            } else {
                return ERROR;
            }
        } catch (error) {
            console.error(error);
            return ERROR;
        }
    }

    public static async read(): Promise<CarrouselImage[] | undefined> {
        try {
            if (!fs.existsSync(this.dirImages)) return undefined;
            const images = await this.repository.createQueryBuilder().getMany();
            if (images instanceof Array) {
                for (let i = 0; i < images.length; i++) {
                    if (images[i] instanceof CarrouselImage) {
                        images[i].imageURL = await readImage(this.dirImages, images[i].id);
                        
                    }
                }
            }
            return images;
        } catch (error) {
            return undefined;
        }
    }

    public static async delete(req: Request): Promise<number | undefined> {
        try {
            if (!req.xhr) return ERROR;
            if (!isset([req.body.id]) || isNaN(req.body.id)) return ERROR;
            if (!fs.existsSync(this.dirImages)) return ERROR;
            if (!(await removeImage(this.dirImages, Number(req.body.id)))) return ERROR;
            
            let image: CarrouselImage | null = await this.repository.findOneBy({_id : Number(req.body.id)});
            if (!isset([image]) || !(image instanceof CarrouselImage)) return ERROR;
            
            image = await this.repository.remove(image);
            if (isset([image]) && (image instanceof CarrouselImage)) return SUCCESS;
            else return ERROR;
        } catch (error) {
            return ERROR;
        }
    }
}