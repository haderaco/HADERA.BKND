const express = require('express');

const Settings = require('../models/Settings');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();


// Get settings
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    let settings = await Settings.findOne({
      key: 'main'
    });

    if (!settings) {
      settings = await Settings.create({
        key: 'main'
      });
    }

    res.json({
      success: true,
      settings
    });
  } catch (error) {
    next(error);
  }
});


// Update settings
router.patch('/', requireAdmin, async (req, res, next) => {
  try {
    const {
      businessName,
      tagline,
      email,
      phone,
      whatsapp,
      address,
      instagram,
      facebook,
      tiktok,
      paymentProvider
    } = req.body;

    let settings = await Settings.findOne({
      key: 'main'
    });

    if (!settings) {
      settings = new Settings({
        key: 'main'
      });
    }

    if (businessName !== undefined) {
      settings.businessName = businessName.trim();
    }

    if (tagline !== undefined) {
      settings.tagline = tagline.trim();
    }

    if (email !== undefined) {
      settings.email = email.trim();
    }

    if (phone !== undefined) {
      settings.phone = phone.trim();
    }

    if (whatsapp !== undefined) {
      settings.whatsapp = whatsapp.trim();
    }

    if (address !== undefined) {
      settings.address = address.trim();
    }

    if (instagram !== undefined) {
      settings.instagram = instagram.trim();
    }

    if (facebook !== undefined) {
      settings.facebook = facebook.trim();
    }

    if (tiktok !== undefined) {
      settings.tiktok = tiktok.trim();
    }

    if (paymentProvider !== undefined) {
      if (!['flutterwave', 'paystack'].includes(paymentProvider)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment provider'
        });
      }

      settings.paymentProvider = paymentProvider;
    }

    await settings.save();

    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings
    });
  } catch (error) {
    next(error);
  }
});


module.exports = router;