export const capitalizeFirstLetter = (string) => {
    return string?.charAt(0).toUpperCase() + string?.slice(1);
}

export function numberGen(len = 12) {
    let text = "";
    let charset = "0123456789";
    for (let i = 0; i < len; i++)
        text += charset.charAt(Math.floor(Math.random() * charset.length));
    return text;
}

export function generateOTP(length = 4) {
    let digits = '0123456789';
    let OTP = '';
    for (let i = 0; i < length; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
}

export function passwordGen(len = 8) {
    const generator = require('generate-password');
    return generator.generate({
        length: len,
        numbers: true,
        excludeSimilarCharacters: true,
        exclude: `.\\<>/?;:'"|[{}]!~#%*90-+=`,
        symbols: true,
        strict: true,
    });
}

export function objectToKeyValuePair(obj) {
    let details: any = [];
    const keys = Object.keys(obj);
    const values = Object.values(obj);
    for (let i = 0; i < keys.length; i++) {
        details.push(
            {
                key: keys[i],
                value: values[i],
            }
        )
    }
    return details;
}

export function keyValuePairToObject(arr) {
    const decode = {}
    for (let i = 0; i < arr.length; i++) {
        decode[arr[i].key] = arr[i].value
    }
    return decode;
}

export async function getDistance(source, destination) {
    const mode = 'driving';
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${source?.latitude},${source?.longitude}&destinations=${destination?.latitude},${destination?.longitude}&key=${process.env.GOOGLE_API_KEY}&mode=${mode}`;
    let request = await fetch(url)
    let {status, rows} = await request.json()
    if (status === 'OK') {
        return rows[0]?.elements[0]
    }
    return undefined
}