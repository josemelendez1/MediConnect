import fs from 'fs';
import { UploadedFile } from "express-fileupload";
import express, { Request } from "express";
import { isNumeric } from './requests';

async function upload(req: Request, url: string, id: number | undefined) : Promise<boolean> {
    let image : UploadedFile;
    let upload : string;
    let files : Array<string>;
    let send : boolean = false;

    if (id === undefined || id === null) {
        return send;
    }

    try {
        if (!fs.existsSync(url)) return send;
        files = await fs.promises.readdir(url);

        if (!req.files || Object.keys(req.files).length === 0) {
            return send;
        }

        image = req.files.image as UploadedFile;
    
        if (image === undefined || image === null) {
            return send;
        }

        for (let i = 0; i < files.length; i++) {
            let name : string = files[i].substring(0, files[i].lastIndexOf('.'));
            if (isNumeric(name) && name === id.toString()) {
                await fs.promises.unlink(url + files[i]); 
            }
        }
    
        upload = url + id + image.name.substring(image.name.lastIndexOf('.'));
    
        await image.mv(upload);
        send = true;
    } catch (error) {
        console.error(error);
    }

    return send;
}

async function remove(url: string, id:number | undefined ) : Promise<boolean> {
    let done = false;
    let files: Array<string>;
    
    if (id === undefined || id === null) {
        return done;
    }

    try {
        if (!fs.existsSync(url)) return done;
        files = await fs.promises.readdir(url);
        for (let i = 0; i < files.length; i++) {
            let name : string = files[i].substring(0, files[i].lastIndexOf('.'));
            if (isNumeric(name) && name === id.toString()) {
                await fs.promises.unlink(url + files[i]);
            }
        }
        done = true;
    } catch (error) {
        console.error(error);
    }

    return done;
}

async function read(url: string, id: number | undefined) : Promise<string | null> {
    let imageURL: string | null = null;

    if (id === undefined || id === null) {
        return imageURL;
    }

    try {
        if (!fs.existsSync(url)) return imageURL;
        const files = await fs.promises.readdir(url);
        for (let i = 0; i < files.length; i++) {
            let name : string = files[i].substring(0, files[i].lastIndexOf('.'));
            if (isNumeric(name) && name === id.toString()) {
                imageURL = url.replace('D:/proyectos/MediConnect/uploads', '') + files[i];
                imageURL = url.replace((__dirname + '/uploads/').replace(/\\/g, '/').replace('/controllers', ''), '') + files[i];
                break;
            }
        }
    } catch (error) {
        console.error(error);
    }
    
    return imageURL;
}
 
export { upload, remove, read };