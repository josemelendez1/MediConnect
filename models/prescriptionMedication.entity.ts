import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Recipe } from "./recipe.entity";
import { Medicine } from "./medicine.entity";

@Entity()
export class PrescriptionMedication extends BaseEntity {
    @PrimaryGeneratedColumn()
    public _id!: number;

    @ManyToOne(() => Medicine, (medicine) => medicine._prescriptionMedications, {
        onDelete: 'CASCADE', onUpdate: 'CASCADE'
    })
    public _medicine!: Medicine;

    @ManyToOne(() => Recipe, (recipe) => recipe._prescriptionMedications, {
        onDelete: 'CASCADE', onUpdate: 'CASCADE'
    })
    public _recipe!: Recipe;

    public constructor(medicine: Medicine, recipe: Recipe) {
        super();
        this._medicine = medicine;
        this._recipe = recipe;
    }

    public get id(): number {
        return this._id;
    }
    
    public set id(value: number) {
        this._id = value;
    }

    public get medicine(): Medicine {
        return this._medicine;
    }

    public set medicine(value: Medicine) {
        this._medicine = value;
    }

    public get recipe(): Recipe {
        return this._recipe;
    }

    public set recipe(value: Recipe) {
        this._recipe = value;
    }
}