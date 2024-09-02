import { isDate, isset } from "./requests";
import { Request, Response } from "express";
import { Appointment } from "../models/appointment.entity";
import { Patient } from "../models/patient.entity";
import { DoctorController } from "./doctor-controller";
import { Doctor } from "../models/doctor.entity";
import puppeteer from "puppeteer";
import ejs from "ejs";
import path from 'path';
import fs from 'fs';
import { MedicalRecordController } from "./medicalRecord-controller";
import { MedicalRecord } from "../models/medicalRecord.entity";
import { Disease } from "../models/disease.entity";
import { RecipeController } from "./recipe-controller";
import { Recipe } from "../models/recipe.entity";
import { Medicine } from "../models/medicine.entity";

export class Pdf {
    public static async generateAppointments(req: Request, res: Response) : Promise<boolean> {
        let done = false;
        try {
            if (!isset([req.body.date]) || !isDate(req.body.date) || isNaN(req.body.idDoctor)) return done;

            const logo = Buffer.from(fs.readFileSync('./public/images/logo.png')).toString('base64');
            const date = new Date(req.body.date.replace(/-/g, '\/'));
            const doctor = await DoctorController.findByIdEager(Number(req.body.idDoctor));

            if (!(doctor instanceof Doctor) || !(doctor.appointments instanceof Array)) return done; 

            let appointments = doctor.appointments;
            appointments = appointments.filter(appointment => appointment.date.toLocaleDateString() === date.toLocaleDateString() && appointment.admission === true);
            appointments.sort((a, b) => {return new Date(a.date).getHours() - new Date(b.date).getHours()});

            let data = [];
            let patient: Patient | null | undefined;
            let appointment: Appointment | undefined;
            let dateDinamic = new Date();
            dateDinamic.setMinutes(0);
            dateDinamic.setSeconds(0);
            dateDinamic.setMilliseconds(0);

            for (let i = 0; i < 12; i++) {
                appointment = appointments.find(appointment => appointment.date.getHours() === (i + 6));
                patient = appointment?.patient;
                
                dateDinamic.setHours(i + 6);

                data.push({
                    index: (i + 1) + "",
                    patient: (patient !== undefined) ? patient?.name : "",
                    email: (patient !== undefined) ? patient?.email : "",
                    ext: (patient !== undefined) ? patient?.extensionTelephone : "",
                    tel: (patient !== undefined) ? patient?.telephone : "",
                    time: (appointment !== undefined) ? appointment.date.toLocaleTimeString() : dateDinamic.toLocaleTimeString(),
                    type: (appointment !== undefined) ? appointment.type : "",
                });
            }
            const template = path.resolve(__dirname, "../views/doctor/template-print-appointments.ejs");
            ejs.renderFile(template, {doctor: doctor.name, date: date.toLocaleDateString(), image: logo, appointments: data }, async function name(error, html) {
                if (error) console.error(error);
                
                const browser = await puppeteer.launch({headless: true});
                const page = await browser.newPage();
                await page.setContent(html);
                await page.addStyleTag({path: "./public/doctor/css/template-pdf.css"});
                const pdf = await page.pdf({
                    format: 'A4',
                    margin: {
                        top: '30px',
                        bottom: '30px',
                        left: '30px',
                        right: '30px'
                    }
                });

                await page.close();
                await browser.close();

                res.contentType("application/pdf");
                res.send(pdf);
            });
            done = true;
        } catch (error) {
            console.error(error);
        }
        return done;
    }

    public static async generateMedicalRecord(req: Request, res: Response): Promise<boolean> {
        let done = false;
        try {
            if (!isset([req.body.id]) || isNaN(req.body.id)) return done;
            
            const medicalRecord = await MedicalRecordController.findId(req);
            if (!(medicalRecord instanceof MedicalRecord)) return done;
            if (!(medicalRecord.appointment instanceof Appointment)) return done;
            if (!(medicalRecord.appointment.patient instanceof Patient)) return done;

            let disease: Disease | null;
            const diseases: Disease[] = medicalRecord.diagnosedDiseases.map(d => {return d.disease;});
            const logo = Buffer.from(fs.readFileSync('./public/images/logo.png')).toString('base64');
            const template = path.resolve(__dirname, "../views/template-medical-record-pdf.ejs");
            ejs.renderFile(template, {medicalRecord: medicalRecord, appointment: medicalRecord.appointment, patient: medicalRecord.appointment.patient, diseases: diseases, logo: logo}, async function name(error, html) {
                if (error) console.error(error);

                const browser = await puppeteer.launch({headless: true});
                const page = await browser.newPage();
                await page.setContent(html);
                await page.addStyleTag({path: "./public/medical-record-pdf.css"});
                const pdf = await page.pdf({
                    format: 'A4',
                    margin: {
                        top: '30px',
                        bottom: '30px',
                        left: '30px',
                        right: '30px'
                    }
                });

                await page.close();
                await browser.close();

                res.contentType("application/pdf");
                res.send(pdf);
            });
            done = true;
        } catch (error) {
            console.error(error);
        }
        return done;
    }

    public static async generateRecipe(req: Request, res: Response): Promise<boolean> {
        let done = false;
        try {
            if (!isset([req.body.id]) || isNaN(req.body.id)) return done;
            
            const recipe = await RecipeController.findId(req);
            if (!(recipe instanceof Recipe)) return done;
            if (!(recipe.medicalRecord instanceof MedicalRecord)) return done;
            if (!(recipe.medicalRecord.appointment instanceof Appointment)) return done;
            if (!(recipe.medicalRecord.appointment.patient instanceof Patient)) return done;
            if (!(recipe.medicalRecord.appointment.doctor instanceof Doctor)) return done;

            let medicine: Medicine | null;
            const medicines: Medicine[] = recipe._prescriptionMedications.map(p => {return p.medicine});  
            const logo = Buffer.from(fs.readFileSync('./public/images/logo.png')).toString('base64');
            const template = path.resolve(__dirname, "../views/template-recipe-pdf.ejs");

            ejs.renderFile(template, {recipe: recipe, patient: recipe.medicalRecord.appointment.patient, doctor: recipe.medicalRecord.appointment.doctor, medicines: medicines, logo: logo}, async function name(error, html) {
                if (error) console.error(error);

                const browser = await puppeteer.launch({headless: true});
                const page = await browser.newPage();
                await page.setContent(html);
                await page.addStyleTag({path: "./public/recipe-pdf.css"});
                const pdf = await page.pdf({
                    format: 'A4',
                    margin: {
                        top: '30px',
                        bottom: '30px',
                        left: '30px',
                        right: '30px'
                    }
                });

                await page.close();
                await browser.close();

                res.contentType("application/pdf");
                res.send(pdf);
            });
            done = true;
        } catch (error) {
            console.error(error);
        }
        return done;
    }

    public static async getMedicalRecord(req: Request, res: Response): Promise<boolean> {
        let done = false;
        try {
            if (!isset([req.body.id]) || isNaN(req.body.id)) return done;
            
            const medicalRecord = await MedicalRecordController.findId(req);
            if (!(medicalRecord instanceof MedicalRecord)) return done;

            if (!(medicalRecord.appointment instanceof Appointment)) return done;
            if (!(medicalRecord.appointment.patient instanceof Patient)) return done;

            let disease: Disease | null;
            const diseases: Disease[] = medicalRecord.diagnosedDiseases.map(d => {return d.disease});
            const logo = Buffer.from(fs.readFileSync('./public/images/logo.png')).toString('base64');
            const template = path.resolve(__dirname, "../views/template-medical-record-pdf.ejs");
            ejs.renderFile(template, {medicalRecord: medicalRecord, appointment: medicalRecord.appointment, patient: medicalRecord.appointment.patient, diseases: diseases, logo: logo}, async function name(error, html) {
                if (error) console.error(error);

                const browser = await puppeteer.launch({headless: true});
                const page = await browser.newPage();
                await page.setContent(html);
                await page.addStyleTag({path: "./public/medical-record-pdf.css"});
                const pdf = await page.pdf({
                    format: 'A4',
                    margin: {
                        top: '30px',
                        bottom: '30px',
                        left: '30px',
                        right: '30px'
                    }
                });

                await page.close();
                await browser.close();

                res.send(JSON.stringify(pdf.toString('base64')));
            });
            done = true;
        } catch (error) {
            console.error(error);
        }
        return done;
    }
}