const nodemailer = require("nodemailer")

const sendEmail = async options =>{
    // 1) Create a transporter
    const transporter = nodemailer.createTransport({
        host:  "sandbox.smtp.mailtrap.io",
        port: 25 || 465 || 587 || 2525,
        auth:{
            user: "2d904648694379",
            pass: "05c21ae97348cc"
        },
    })
    // 2) Define the email options
    const mailOptions = {
        from: "Momen@gmail.com",
        to: options.email,
        subject: options.subject,
        text: options.token,
    }
    // 3) Actually send the email
    await transporter.sendMail(mailOptions)
}

module.exports = sendEmail