import { Request } from 'express';
import { ERROR, SUCCESS } from './codes';
import { isset } from './requests';
import { DiagnosedDisease } from '../models/diagnosedDisease.entity';
import { Repository } from 'typeorm';
import { AppDataSource } from '../models/db';
import { MedicalRecord } from '../models/medicalRecord.entity';
import { MedicalRecordController } from './medicalRecord-controller';
import { DiseaseController } from './disease-controller';
import { Disease } from '../models/disease.entity';

export class DiagnosedDiseaseController {
    private static repository: Repository<DiagnosedDisease> = AppDataSource.getRepository(DiagnosedDisease);

    public static async save(req: Request) {
        try {
            if (!isset([req.body.idRecord, req.body.diseases])) return;
            if (isNaN(req.body.idRecord) || !(req.body.diseases instanceof Array)) return;
            req.body.id = req.body.idRecord;
            const record = await MedicalRecordController.findId(req);
            if (!(record instanceof MedicalRecord)) return;

            const diseases = req.body.diseases;
            if (diseases instanceof Array) for (let i = 0; i < diseases.length; i++) {
                req.body.id = diseases[i];
                let disease = await DiseaseController.findId(req);
                if (!(disease instanceof Disease) || isNaN(disease.id)) continue;
                if (await this.repository.createQueryBuilder('d').where('d.MedicalRecord_id = :idRecord AND d.Disease_id = :idDisease', {idRecord: record.id, idDisease: disease.id}).getExists()) continue;
                await this.repository.save(new DiagnosedDisease(disease, record));
            }

            const diagnosedDiseases: DiagnosedDisease[] | null = await this.readByRecord(record.id);
            if (diagnosedDiseases instanceof Array && diseases instanceof Array) for (let i = 0; i < diagnosedDiseases.length; i++) {
                if (!diseases.includes(`${diagnosedDiseases[i].disease.id}`)) {
                    await this.delete(Number(diagnosedDiseases[i].id));
                }
            }
        } catch (err) {
            return;
        }
    }

    public static async delete(id: number | undefined): Promise<number> {
        try {
            if (!isset([id]) || id === undefined || isNaN(id)) return ERROR;

            let diagnosedDisease: DiagnosedDisease | null = await this.repository.findOneBy({_id: Number(id)});
            if (diagnosedDisease instanceof DiagnosedDisease && (await this.repository.remove(diagnosedDisease)) instanceof DiagnosedDisease) return SUCCESS;
            else return ERROR;
        } catch (error) {
            return ERROR;
        }
    }

    public static async read(): Promise<DiagnosedDisease[] | null> {
        try {
            return await this.repository.createQueryBuilder('d')
            .leftJoinAndSelect('d._medicalRecord', '_medicalRecord')
            .leftJoinAndSelect('d._disease', '_disease')   
            .getMany();
        } catch (error) {
            return null;
        }
    }

    public static async readByRecord(idRecord: number | undefined): Promise<DiagnosedDisease[] | null> {
        try {
            if (!isset([idRecord]) || idRecord === undefined || isNaN(idRecord)) return null;
            else return await this.repository.createQueryBuilder('d')
            .where('d.MedicalRecord_id = :id', {id: idRecord})
            .leftJoinAndSelect('d._medicalRecord', '_medicalRecord')
            .leftJoinAndSelect('d._disease', '_disease')
            .getMany();
        } catch (error) {
            return null;
        }
    }

    public static async groupByDiseaseCount(): Promise<DiagnosedDisease[] | null> {
        try {
            return await this.repository.createQueryBuilder('diagnosed')
            .innerJoin('disease', 'd', 'diagnosed.Disease_id = d._id')
            .select('COUNT(*), d._name')
            .addGroupBy('diagnosed.Disease_id')
            .orderBy('COUNT(*)', 'DESC')
            .limit(5)
            .getRawMany();
        } catch (error) {
            return null;
        }
    }
}