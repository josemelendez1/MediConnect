export function isset(values : Array<any>) : boolean {
    let check = true;

    for (let i = 0; i < values.length; i++) {
        if (values[i] === undefined || values[i] === null) {
            check = false;
            break;
        }
    }

    return check;
}

export function isDate(value: any) : boolean {
    const date = new Date(value);
    return date instanceof Date && !isNaN(date.getTime());
}

export function isNumeric(value: any) : boolean {
    try {
        let number = Number(value);
        return true;
    } catch (error) {
        return false;
    }
}