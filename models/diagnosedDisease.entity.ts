import { BaseEntity, Column, Entity, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { MedicalRecord } from "./medicalRecord.entity";
import { Disease } from "./disease.entity";

@Entity()
export class DiagnosedDisease extends BaseEntity {
    @PrimaryGeneratedColumn()
    public _id!: number;

    @ManyToOne(() => Disease, (disease) => disease._diagnosedDiseases, {
        onDelete: 'CASCADE', onUpdate: 'CASCADE'
    })
    public _disease!: Disease;

    @ManyToOne(() => MedicalRecord, (medicalRecord) => medicalRecord._diagnosedDiseases, {
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
    })
    public _medicalRecord!: MedicalRecord;

    public constructor(disease: Disease, medicalRecord: MedicalRecord) {
        super();
        this._disease = disease;
        this._medicalRecord = medicalRecord;
    }
    
    public get id(): number {
        return this._id;
    }

    public set id(value: number) {
        this._id = value;
    }

    public get disease(): Disease {
        return this._disease;
    }

    public set disease(value: Disease) {
        this._disease = value;
    }

    public get medicalRecord(): MedicalRecord {
        return this._medicalRecord;
    }

    public set medicalRecord(value: MedicalRecord) {
        this._medicalRecord = value;
    }
}