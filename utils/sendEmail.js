const nodemailer = require("nodemailer")

const sendEmail = async options =>{
    // 1) Create a transporter
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'momenelmesady4803@gmail.com', // Your email
            pass: 'qyqa fnyc tnel vhte',  // Your email password (or App password for Gmail)
        },
    })
    // 2) Define the email options
    const mailOptions = {
        from: "Momen@gmail.com",
        to: options.email,
        subject: options.subject,
        html: options.html,
    }
    // 3) Actually send the email
    await transporter.sendMail(mailOptions)
}

module.exports = sendEmail