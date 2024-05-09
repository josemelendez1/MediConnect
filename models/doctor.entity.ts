import { Appointment } from "./appointment.entity";
import { User } from "./user";
import { Column, Entity, OneToMany } from "typeorm";

@Entity()
export class Doctor extends User {
    @Column()
    public _idType: string;

    @Column()
    public _idNumber: string;

    @Column()
    public _address: string;

    @Column()
    public _telephone: string;

    @OneToMany(() => Appointment, (appointment) => appointment._doctor, {
        onDelete: 'SET NULL', onUpdate: 'CASCADE'
    })
    public _appointments!: Appointment[];

    public constructor(name: string, email: string, pass: string, idType: string, idNumber: string, address : string, telephone : string) {
        super(name, email, pass);
        this._idType = idType;
        this._idNumber = idNumber;
        this._address = address;
        this._telephone = telephone;
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

    public get appointments(): Appointment[] {
        return this._appointments;
    }
    
    public set appointments(value: Appointment[]) {
        this._appointments = value;
    }

    public get address(): string {
        return this._address;
    }

    public set address(value: string) {
        this._address = value;
    }

    public get telephone(): string {
        return this._telephone;
    }

    public set telephone(value: string) {
        this._telephone = value;
    }
}