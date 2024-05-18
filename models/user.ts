import { Column, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export abstract class User {
    @PrimaryGeneratedColumn()
    public _id!: number;

    @Column()
    public _name: string;

    @Column({unique: true})
    public _email: string;

    @Column({unique: true})
    public _pass: string;

    @CreateDateColumn()
    public _createdAt!: Date;

    @UpdateDateColumn()
    public _updatedAt!: Date;

    @Column({ type: 'varchar', nullable: true})
    public _imageURL?: string | null;

    public constructor(name: string, email: string, pass: string) {
        this._name = name;
        this._email = email;
        this._pass = pass; 
    }

    public get id(): number {
        return this._id;
    }

    public set id(value: number) {
        this._id = value;
    }

    public get name(): string {
        return this._name;
    }

    public set name(value: string) {
        this._name = value;
    }

    public get email(): string {
        return this._email;
    }

    public set email(value: string) {
        this._email = value;
    }

    public get pass(): string {
        return this._pass;
    }
    
    public set pass(value: string) {
        this._pass = value;
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

    public get imageURL(): string | null | undefined {
        return this._imageURL;
    }

    public set imageURL(value: string | null | undefined) {
        this._imageURL = value;
    }
}