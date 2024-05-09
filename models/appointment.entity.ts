import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToOne } from "typeorm";
import { Doctor } from "./doctor.entity";
import { MedicalRecord } from "./medicalRecord.entity";
import { Patient } from "./patient.entity";

@Entity()
export class Appointment extends BaseEntity {
    @PrimaryGeneratedColumn()
    public _id!: number;

    @ManyToOne(() => Doctor, (doctor) => doctor._appointments, {
        onDelete: 'SET NULL', onUpdate: 'CASCADE'
    })
    public _doctor!: Doctor | null;

    @ManyToOne(() => Patient, (patient) => patient._appointments, {
        onDelete: 'CASCADE', onUpdate: 'CASCADE'
    })
    public _patient!: Patient | null;

    @Column()
    public _type: string;

    @Column({type: 'text'})
    public _reason: string;

    @OneToOne(() => MedicalRecord, (medicalRecord) => medicalRecord._appointment, {
        onDelete: 'CASCADE', onUpdate: 'CASCADE'
    })
    public _medicalRecord!: MedicalRecord; 

    @Column()
    public _admission: boolean = false;

    @Column()
    public _date: Date;

    @CreateDateColumn()
    public _createdAt!: Date;

    @UpdateDateColumn()
    public _updatedAt!: Date;

    public constructor(type: string, reason: string, date: Date) {
        super();
        this._type = type;
        this._reason = reason;
        this._date = date;
    }

    public get id(): number {
        return this._id;
    }

    public set id(value: number) {
        this._id = value;
    }

    public get patient(): Patient | null {
        return this._patient;
    }

    public set patient(value: Patient | null) {
        this._patient = value;
    }

    public get doctor(): Doctor | null {
        return this._doctor;
    }

    public set doctor(value: Doctor | null) {
        this._doctor = value;
    }

    public get medicalRecord(): MedicalRecord {
        return this._medicalRecord;
    }

    public set medicalRecord(value: MedicalRecord) {
        this._medicalRecord = value;
    }

    public get type(): string {
        return this._type;
    }

    public set type(value: string) {
        this._type = value;
    }

    public get reason(): string {
        return this._reason;
    }

    public set reason(value: string) {
        this._reason = value;
    }
    
    public get admission(): boolean {
        return this._admission;
    }
    public set admission(value: boolean) {
        this._admission = value;
    }

    public get date(): Date {
        return this._date;
    }

    public set date(value: Date) {
        this._date = value;
    }

    public get createdAt(): Date {
        return this._createdAt;
    }

    public set createdAt(value: Date) {
        this._createdAt = value;
    }

    public get updatedAt(): Date {
        return this._updatedAt;
    }

    public set updatedAt(value: Date) {
        this._updatedAt = value;
    }
}