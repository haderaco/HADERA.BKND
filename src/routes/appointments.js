const express = require('express');

const Appointment = require('../models/Appointment');
const { sendEmail } = require('../services/email');

const router = express.Router();


// Create appointment
router.post('/', async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      service,
      date,
      time,
      message
    } = req.body;

    if (
      !name ||
      !email ||
      !phone ||
      !service ||
      !date ||
      !time
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Name, email, phone, service, date and time are required'
      });
    }

    const appointment = await Appointment.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      service: service.trim(),
      date: date.trim(),
      time: time.trim(),
      message: message?.trim() || '',
      status: 'pending'
    });

    // Send appointment notification to the business email.
    try {
      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: `New HADÉRA Appointment Request`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#222">
            <h2>New Appointment Request</h2>

            <p>You have received a new appointment request through the HADÉRA website.</p>

            <hr>

            <p><strong>Name:</strong> ${appointment.name}</p>
            <p><strong>Email:</strong> ${appointment.email}</p>
            <p><strong>Phone:</strong> ${appointment.phone}</p>
            <p><strong>Service:</strong> ${appointment.service}</p>
            <p><strong>Date:</strong> ${appointment.date}</p>
            <p><strong>Time:</strong> ${appointment.time}</p>
            <p><strong>Message:</strong> ${appointment.message || 'No additional message'
          }</p>

            <hr>

            <p><strong>Appointment ID:</strong> ${appointment._id}</p>
            <p><strong>Status:</strong> ${appointment.status}</p>
          </div>
        `
      });
    } catch (emailError) {
      // Do not fail the appointment submission just because email failed.
      console.error(
        'Appointment notification email failed:',
        emailError.message
      );
    }

    res.status(201).json({
      success: true,
      message: 'Appointment submitted successfully',
      appointment
    });

  } catch (error) {
    next(error);
  }
});


module.exports = router;