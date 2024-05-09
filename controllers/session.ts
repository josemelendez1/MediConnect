import session, { Session, SessionData } from "express-session";
import { Request} from "express";

declare module "express-session" {
    interface SessionData {
        administrator: number,
        doctor: number,
        patient: number,
        assistant: number
    }
}

declare module 'http' {
    interface IncomingMessage {
        cookieHolder?: string;
        session: Session & Partial<session.SessionData>;
    }
}

export function sessionAdministrator(req: Request) {
    return req.session.administrator !== undefined && !isNaN(req.session.administrator);
}

export function sessionDoctor(req: Request) {
    return req.session.doctor !== undefined && !isNaN(req.session.doctor);
}

export function sessionAssistant(req: Request) {
    return req.session.assistant !== undefined && !isNaN(req.session.assistant);
}

export function sessionPatient(req: Request) {
    return req.session.patient !== undefined && !isNaN(req.session.patient);
}