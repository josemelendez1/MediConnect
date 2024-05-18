import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class CarrouselImage extends BaseEntity {
    @PrimaryGeneratedColumn()
    public _id!: number | undefined;

    @Column({ nullable: true })
    public _name!: string;

    @Column({ nullable: true })
    public _extension!: string;

    @CreateDateColumn({})
    public createdAt!: Date;

    @UpdateDateColumn()
    public updatedAt!: Date
    
    private _imageURL!: string | null;

    public constructor(name: string, extension: string) {
        super();
        this._name = name;
        this._extension = extension;
    }

    public get id(): number | undefined {
        return this._id;
    }

    public set id(value: number | undefined) {
        this._id = value;
    }

    public get name(): string | undefined {
        return this._name;
    }

    public set name(value: string) {
        this._name = value;
    }

    public get extension(): string | undefined {
        return this._extension;
    }
    public set extension(value: string) {
        this._extension = value;
    }

    public get imageURL(): string | null {
        return this._imageURL;
    }

    public set imageURL(value: string | null) {
        this._imageURL = value;
    }
}