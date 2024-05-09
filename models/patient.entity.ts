import { Column, Entity, OneToMany } from "typeorm";
import { User } from "./user";
import { Appointment } from "./appointment.entity";

@Entity()
export class Patient extends User {
    @Column()
    public _extensionTelephone: string;

    @Column()
    public _telephone: string;

    @Column()
    public _birthdate: Date;

    @OneToMany(() => Appointment, (appointment) => appointment._patient, {
        onDelete: 'CASCADE', onUpdate: 'CASCADE'
    })
    public _appointments!: Appointment[];

    public constructor(name: string, email: string, pass: string, extensionTelephone: string, telephone: string, birthdate: Date) {
        super(name, email, pass);
        this._extensionTelephone = extensionTelephone;
        this._telephone = telephone;
        this._birthdate = birthdate;
    }

    public get extensionTelephone(): string {
        return this._extensionTelephone;
    }
    
    public set extensionTelephone(value: string) {
        this._extensionTelephone = value;
    }

    public get telephone(): string {
        return this._telephone;
    }

    public set telephone(value: string) {
        this._telephone = value;
    }

    public get birthdate(): Date {
        return this._birthdate;
    }

    public set birthdate(value: Date) {
        this._birthdate = value;
    }

    public get appointments(): Appointment[] {
        return this._appointments;
    }

    public set appointments(value: Appointment[]) {
        this._appointments = value;
    }
}