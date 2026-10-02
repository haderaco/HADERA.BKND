const express = require('express');

const ContactMessage = require('../models/ContactMessage');

const router = express.Router();


// Submit contact message
router.post('/', async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      message
    } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and message are required'
      });
    }

    const contactMessage = await ContactMessage.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || '',
      message: message.trim(),
      status: 'new'
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      contactMessage
    });
  } catch (error) {
    next(error);
  }
});


module.exports = router;