import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { MedicalRecord } from "./medicalRecord.entity";
import { PrescriptionMedication } from "./prescriptionMedication.entity";

@Entity()
export class Recipe extends BaseEntity {
    @PrimaryGeneratedColumn()
    public _id!: number;
    
    @OneToOne(() => MedicalRecord, (medicalRecord) => medicalRecord._recipe, {
        onDelete: 'CASCADE', onUpdate: 'CASCADE'
    })
    @JoinColumn()
    public _medicalRecord!: MedicalRecord;

    @OneToMany(() => PrescriptionMedication, (prescriptionMedication) => prescriptionMedication._recipe, {
        onDelete: 'CASCADE', onUpdate: 'CASCADE'
    })
    public _prescriptionMedications!: PrescriptionMedication[];
    
    @Column({type: 'text'})
    public _preescription: string;

    @CreateDateColumn()
    public createdDate!: Date;

    @UpdateDateColumn()
    public updatedDate!: Date;
    
    public constructor(preescription: string) {
        super();
        this._preescription = preescription;
    }

    public get id(): number {
        return this._id;
    }

    public set id(value: number) {
        this._id = value;
    }

    public get medicalRecord(): MedicalRecord {
        return this._medicalRecord;
    }

    public set medicalRecord(value: MedicalRecord) {
        this._medicalRecord = value;
    }

    public get preescription(): string {
        return this._preescription;
    }

    public set preescription(value: string) {
        this._preescription = value;
    }

    public get prescriptionMedications(): PrescriptionMedication[] {
        return this._prescriptionMedications;
    }

    public set prescriptionMedications(value: PrescriptionMedication[]) {
        this._prescriptionMedications = value;
    }
}