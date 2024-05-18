import { BaseEntity, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { PrescriptionMedication } from "./prescriptionMedication.entity";

@Entity()
export class Medicine extends BaseEntity {
    @PrimaryGeneratedColumn()
    public _id!: number;

    @Column({nullable: true})
    public _idAdministrator!: number;

    @Column()
    public _name: string;

    @Column()
    public _quantities: string;

    @Column()
    public _presentations: string;

    @Column()
    public _information: string;

    @CreateDateColumn()
    public createdAt!: Date;

    @UpdateDateColumn()
    public updatedAt!: Date;

    @OneToMany(() => PrescriptionMedication, (prescriptionMedication) => prescriptionMedication._recipe)
    public _prescriptionMedications!: PrescriptionMedication[];

    private _imageURL!: string | null;

    public constructor(name: string, quantities: string, presetnations: string, information: string) {
        super();
        this._name = name;
        this._quantities = quantities;
        this._presentations = presetnations;
        this._information = information;
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

    public get quantities(): string {
        return this._quantities;
    }

    public set quantities(value: string) {
        this._quantities = value;
    }

    public get presentations(): string {
        return this._presentations;
    }

    public set presentations(value: string) {
        this._presentations = value;
    }

    public get information(): string {
        return this._information;
    }

    public set information(value: string) {
        this._information = value;
    }

    public get imageURL(): string | null {
        return this._imageURL;
    }

    public set imageURL(value: string | null) {
        this._imageURL = value;
    }

    public get prescriptionMedications(): PrescriptionMedication[] {
        return this._prescriptionMedications;
    }

    public set prescriptionMedications(value: PrescriptionMedication[]) {
        this._prescriptionMedications = value;
    }
}