import { Request } from 'express';
import { Repository } from "typeorm";
import { AppDataSource } from "../models/db";
import { PrescriptionMedication } from "../models/prescriptionMedication.entity";
import { ERROR, NOT_ALLOWED, SUCCESS } from "./codes";
import { isset } from "./requests";
import { RecipeController } from './recipe-controller';
import { Recipe } from '../models/recipe.entity';
import { MedicineController } from './medicine-controller';
import { Medicine } from '../models/medicine.entity';

export class PrescriptionMedicationController {
    private static repository: Repository<PrescriptionMedication> = AppDataSource.getRepository(PrescriptionMedication);

    public static async save(req: Request) {
        try {
            if (!req.xhr || !isset([req.body.idRecipe, req.body.medicines])) return;
            if (isNaN(req.body.idRecipe) || !(req.body.medicines instanceof Array)) return;
            req.body.id = req.body.idRecipe;
            const recipe = await RecipeController.findId(req);
            if (!(recipe instanceof Recipe)) return;

            const medicines = req.body.medicines;
            if (medicines instanceof Array) for (let i = 0; i < medicines.length; i++) {
                req.body.id = medicines[i];
                let medicine = await MedicineController.findId(req);
                if (!(medicine instanceof Medicine) || isNaN(medicine._id)) continue;
                if (await this.repository.createQueryBuilder('r').where('r.Recipe_id = :idRecipe AND r.Medicine_id = :idMedicine', {idRecipe: recipe.id, idMedicine: medicine.id}).getExists()) continue;
                await this.repository.save(new PrescriptionMedication(medicine, recipe));
            }

            const prescriptionMedications: PrescriptionMedication[] | null = await this.readByRecipe(Number(req.body.idRecipe));
            if (prescriptionMedications instanceof Array && medicines instanceof Array) for (let i = 0; i < prescriptionMedications.length; i++) {
                if (!medicines.includes(`${prescriptionMedications[i].medicine.id}`)) {
                    await this.delete(Number(prescriptionMedications[i].id));
                }
            }
        } catch (error) {
            return;
        }
    }

    public static async delete(id: number | undefined): Promise<number> {
        try {
            if (!isset([id]) || id === undefined || isNaN(id)) return ERROR;

            let prescriptionMedication: PrescriptionMedication | null = await this.repository.findOneBy({_id: Number(id)});
            if (prescriptionMedication instanceof PrescriptionMedication && (await this.repository.remove(prescriptionMedication)) instanceof PrescriptionMedication) return SUCCESS;
            else return ERROR;
        } catch (error) {
            return ERROR;
        }
    }

    public static async read(): Promise<PrescriptionMedication[] | null> {
        try {
            return await this.repository.createQueryBuilder('p')
            .leftJoinAndSelect('p._recipe', '_recipe')
            .leftJoinAndSelect('p._medicine', '_medicine')
            .getMany();
        } catch (error) {
            return null;
        }
    }

    public static async readByRecipe(idRecipe: number | undefined): Promise<PrescriptionMedication[] | null> {
        try {
            if (!isset([idRecipe]) || idRecipe === undefined || isNaN(idRecipe)) return null;
            else return await this.repository.createQueryBuilder('medicine')
            .where('medicine.Recipe_id = :id', {id: idRecipe})
            .leftJoinAndSelect('p._recipe', '_recipe')
            .leftJoinAndSelect('p._medicine', '_medicine')
            .getMany();
        } catch (error) {
            return null;
        }
    }

    public static async groupByMedicationCount(): Promise<PrescriptionMedication[] | null> {
        try {
            return await this.repository
            .createQueryBuilder('pre')
            .innerJoin('medicine', 'm', 'pre.Medicine_id = m._id')
            .select("COUNT(*), m._name")
            .addGroupBy('pre.Medicine_id')
            .orderBy('COUNT(*)', 'DESC')
            .limit(5)
            .getRawMany();
        } catch (error) {
            return null;
        }
    }
}