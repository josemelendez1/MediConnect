import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Recipe } from "./recipe.entity";
import { Appointment } from "./appointment.entity";
import { DiagnosedDisease } from "./diagnosedDisease.entity";

@Entity()
export class MedicalRecord extends BaseEntity {
    @PrimaryGeneratedColumn()
    public _id!: number;
    
    @Column()
    public _risk: number;

    @Column({type: 'text'})
    public _reason: string;

    @OneToOne(() => Appointment, (appoinment) => appoinment._medicalRecord, {
        onDelete: 'CASCADE', onUpdate: 'CASCADE'
    })
    @JoinColumn()
    public _appointment!: Appointment | null; 

    @OneToOne(() => Recipe, (recipe) => recipe._medicalRecord, {
        onDelete: 'SET NULL', onUpdate: 'CASCADE'
    })
    public _recipe!: Recipe;

    @OneToMany(() => DiagnosedDisease, (diagnosedDisease) => diagnosedDisease._medicalRecord, {
        onDelete: 'SET NULL', onUpdate: 'CASCADE'
    })
    public _diagnosedDiseases!: DiagnosedDisease[];

    @CreateDateColumn()
    public createdAt!: Date;

    @UpdateDateColumn()
    public updatedAt!: Date;

    public constructor(risk: number, reason: string) {
        super();
        this._risk = risk;
        this._reason = reason;
    }

    public get id(): number {
        return this._id;
    }

    public set id(value: number) {
        this._id = value;
    }

    public get appointment(): Appointment | null {
        return this._appointment;
    }

    public set appointment(value: Appointment | null) {
        this._appointment = value;
    }

    public get diagnosedDiseases(): DiagnosedDisease[] {
        return this._diagnosedDiseases;
    }
    
    public set diagnosedDiseases(value: DiagnosedDisease[]) {
        this._diagnosedDiseases = value;
    }
    
    public get risk(): number {
        return this._risk;
    }

    public set risk(value: number) {
        this._risk = value;
    }

    public get reason(): string {
        return this._reason;
    }

    public set reason(value: string) {
        this._reason = value;
    }

    public get recipe(): Recipe {
        return this._recipe;
    }
    
    public set recipe(value: Recipe) {
        this._recipe = value;
    }
}