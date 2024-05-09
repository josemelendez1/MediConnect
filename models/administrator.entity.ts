import { ChildEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user";

@Entity()
export class Administrator extends User {
    @Column()
    public _telephone: string;
    
    @Column()
    public _area: string;

    public constructor(name: string, email: string, pass: string, telephone: string, area: string) {
        super(name, email, pass);
        this._telephone = telephone;
        this._area = area;
    }

    public get telephone(): string {
        return this._telephone;
    }

    public set telephone(value: string) {
        this._telephone = value;
    }

    public get area(): string {
        return this._area;
    }

    public set area(value: string) {
        this._area = value;
    }
}