const nodemailer = require("nodemailer");


export const sendUserEmailGeneral = async (data) => {
    const transporter = nodemailer.createTransport({
        host: "smtp.zoho.com",
        port: 465,
        secure: true,
        auth: {
            user: "no-reply@futurx.media",
            pass: "2af5dyukKbRQ",
        },
    });

    return await transporter.sendMail({
        from: "no-reply@futurx.media",
        to: data.email,
        subject: data.subject,
        html: data.message,
    });
};