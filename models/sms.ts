import { Twilio } from "twilio";

export class SMS {
    private _to!: string | undefined;
    private _msg!: string | undefined;
    private readonly accountSid;
    private readonly authToken;
    private readonly twilioNumber;
    
    public constructor(to: string | undefined, msg: string | undefined) {
        require('dotenv').config();
        this._to = to;
        this._msg = msg;
        this.accountSid = process.env.TWILIO_ACCOUNT_SID;
        this.authToken = process.env.TWILIO_ACCOUNT_AUTH_TOKEN;
        this.twilioNumber = process.env.TWILIO_FROM_NUMBER;
    }

    public send() {
        const client = new Twilio(this.accountSid, this.authToken);
        client.messages
        .create({
            from: this.twilioNumber,
            to: (this.to) ? this.to : '',
            body: this.msg,
        })
        .then((message) => {})
        .catch((error) => {});
    }

    public get to(): string | undefined {
        return this._to;
    }

    public set to(value: string) {
        this._to = value;
    }

    public get msg(): string | undefined {
        return this._msg;
    }

    public set msg(value: string) {
        this._msg = value;
    }
}