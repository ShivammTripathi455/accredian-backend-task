const express = require('express');
const bodyParser = require('body-parser');
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(bodyParser.json());

const validateEmail = (email) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
};

app.post('/api/referral', async (req, res) => {
    const { referrer, referee, email } = req.body;

    if (!referrer || !referee || !email) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (!validateEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    try {
        const newReferral = await prisma.referral.create({
            data: { referrer, referee, email },
        });

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Referral Successful',
            text: `Thank you ${referrer} for referring ${referee}.`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return res.status(500).json({ error: 'Error sending email' });
            } else {
                res.status(201).json(newReferral);
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(4000, () => {
    console.log('Server is running on port 4000');
});
