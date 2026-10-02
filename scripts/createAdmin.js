require('dotenv').config();

const dns = require('dns');

dns.setServers([
  '1.1.1.1',
  '1.0.0.1'
]);

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const Admin = require('../src/models/Admin');

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('Connected to MongoDB');

    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      throw new Error(
        'ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env'
      );
    }

    const existingAdmin = await Admin.findOne({
      email: email.toLowerCase()
    });

    if (existingAdmin) {
      console.log(`Admin already exists: ${email}`);
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const admin = await Admin.create({
      name: 'HADÉRA Admin',
      email: email.toLowerCase(),
      passwordHash,
      role: 'admin'
    });

    console.log(`Admin created successfully: ${admin.email}`);

    process.exit(0);
  } catch (error) {
    console.error('Failed to create admin:', error.message);
    process.exit(1);
  }
}

createAdmin();