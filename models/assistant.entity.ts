import { Column, Entity, Repository } from "typeorm";
import { User } from "./user";

@Entity()
export class Assistant extends User {
    @Column()
    public _idType: string;

    @Column()
    public _idNumber: string;

    public constructor(name: string, email: string, pass: string, idType: string, idNumber: string) {
        super(name, email, pass);
        this._idType = idType;
        this._idNumber = idNumber;
    }

    public get idType(): string {
        return this._idType;
    }
    
    public set idType(value: string) {
        this._idType = value;
    }

    public get idNumber(): string {
        return this._idNumber;
    }

    public set idNumber(value: string) {
        this._idNumber = value;
    }
}