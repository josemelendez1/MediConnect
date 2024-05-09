import { Request } from 'express';
import { isset } from "./requests";
import { Repository } from "typeorm";
import { AppDataSource } from "../models/db";
import { ERROR, NOT_ALLOWED, SUCCESS } from "./codes";
import { Recipe } from "../models/recipe.entity";
import { PrescriptionMedicationController } from './preescriptionMedication-controller';
import { MedicalRecordController } from './medicalRecord-controller';
import { MedicalRecord } from '../models/medicalRecord.entity';

export class RecipeController {
    private static repository: Repository<Recipe> = AppDataSource.getRepository(Recipe);

    public static async create(req: Request) : Promise<number> {
        try {
            if (!req.xhr || !isset([req.body.idRecord, req.body.preescription])) return ERROR;
            if (isNaN(req.body.idRecord)) return ERROR;
            
            req.body.id = req.body.idRecord;
            let medicalRecord = await MedicalRecordController.findId(req);
            if (!(medicalRecord instanceof MedicalRecord)) return NOT_ALLOWED;

            let recipe = new Recipe(req.body.preescription);
            recipe.medicalRecord = medicalRecord; 
            recipe = await this.repository.save(recipe);
        
            if (recipe instanceof Recipe) {
                req.body.idRecipe = recipe.id;
                await PrescriptionMedicationController.save(req);
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
            if (!req.xhr) return ERROR;
            if (!isset([req.body.preescription])) return ERROR;
            if (!isset([req.body.idRecord]) || isNaN(req.body.idRecord)) return NOT_ALLOWED;
            if (!isset([req.body.id]) || isNaN(req.body.id)) return this.create(req);

            let recipe: Recipe | null = await this.repository.findOneBy({_id : Number(req.body.id)});
            if (!(recipe instanceof Recipe)) return this.create(req);
            
            recipe.preescription = req.body.preescription;
            recipe = await this.repository.save(recipe);
    
            if (recipe instanceof Recipe) {
                req.body.idRecipe = recipe.id;
                await PrescriptionMedicationController.save(req);
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

            let recipe : Recipe | null = await this.repository.findOneBy({_id: Number(req.body.id)});
            
            if (recipe === null || !(recipe instanceof Recipe)) return ERROR;
            
            recipe = await this.repository.remove(recipe);

            if (recipe !== null && (recipe instanceof Recipe)) return SUCCESS;
            else return ERROR;

        } catch (error) {
            return ERROR;
        }
    }

    public static async read(): Promise<Recipe[] | null> {
        try {
            return await this.repository.createQueryBuilder().getMany();
        } catch (error) {
            return null;
        }
    }

    public static async readEager() : Promise<Recipe[] | null> {
        try {
            return await this.repository.createQueryBuilder('recipe')
            .leftJoinAndSelect('recipe._medicalRecord', '_medicalRecord')
            .leftJoinAndSelect('_medicalRecord._appointment', '_appointment')
            .leftJoinAndSelect('_appointment._patient', '_patient')
            .leftJoinAndSelect('_appointment._doctor', '_doctor')
            .leftJoinAndSelect('recipe._prescriptionMedications', '_prescriptionMedications')
            .leftJoinAndSelect('_prescriptionMedications._medicine', '_medicine')
            .getMany();
        } catch (error) {
            return null;
        }
    }

    public static async findId(req: Request) : Promise<Recipe | null> {
        try {
            if (!isset([req.body.id]) || isNaN(req.body.id)) return null;
            return await this.repository.createQueryBuilder('recipe')
            .where('recipe._id = :id', {id: Number(req.body.id)})
            .leftJoinAndSelect('recipe._medicalRecord', '_medicalRecord')
            .leftJoinAndSelect('_medicalRecord._appointment', '_appointment')
            .leftJoinAndSelect('_appointment._patient', '_patient')
            .leftJoinAndSelect('_appointment._doctor', '_doctor')
            .leftJoinAndSelect('recipe._prescriptionMedications', '_prescriptionMedications')
            .leftJoinAndSelect('_prescriptionMedications._medicine', '_medicine')
            .getOne();
        } catch (error) {
            return null;
        }
    }
}