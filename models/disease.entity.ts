import { BaseEntity, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { DiagnosedDisease } from "./diagnosedDisease.entity";

@Entity()
export class Disease extends BaseEntity {
    @PrimaryGeneratedColumn()
    public _id!: number;

    @Column({nullable: true})
    public _idAdministrator!: number;

    @Column()
    public _name: string;

    @Column()
    public _scientificName: string;

    @Column()
    public _severity: string;

    @Column()
    public _description: string;

    @OneToMany(() => DiagnosedDisease, (diagnosedDisease) => diagnosedDisease._medicalRecord)
    public _diagnosedDiseases!: DiagnosedDisease[];

    private _imageURL!: string | undefined;

    @CreateDateColumn()
    public createdAt!: Date;

    @UpdateDateColumn()
    public updatedAt!: Date;

    public constructor(name: string, scientificName: string, severity: string, description: string) {
        super();
        this._name = name;
        this._scientificName = scientificName;
        this._severity = severity;
        this._description = description;
    }

    public get id(): number {
        return this._id;
    }

    public set id(value: number) {
        this._id = value;
    }

    public get idAdministrator(): number {
        return this._idAdministrator;
    }

    public set idAdministrator(value: number) {
        this._idAdministrator = value;
    }

    public get name(): string {
        return this._name;
    }

    public set name(value: string) {
        this._name = value;
    }

    public get scientificName(): string {
        return this._scientificName;
    }

    public set scientificName(value: string) {
        this._scientificName = value;
    }

    public get severity(): string {
        return this._severity;
    }

    public set severity(value: string) {
        this._severity = value;
    }

    public get description(): string {
        return this._description;
    }

    public set description(value: string) {
        this._description = value;
    }

    public get diagnosedDiseases(): DiagnosedDisease[] {
        return this._diagnosedDiseases;
    }
    
    public set diagnosedDiseases(value: DiagnosedDisease[]) {
        this._diagnosedDiseases = value;
    }

    public get imageURL(): string | undefined {
        return this._imageURL;
    }
    
    public set imageURL(value: string | undefined) {
        this._imageURL = value;
    }
}