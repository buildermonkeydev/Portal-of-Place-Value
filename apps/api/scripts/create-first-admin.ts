// apps/api/scripts/create-first-admin.ts
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the correct path
dotenv.config({ path: path.join(__dirname, '../.env') });

async function createFirstAdmin() {
  try {
    // Get MongoDB URI from environment or use default
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/compiler-db';
    
    console.log(' Connecting to MongoDB...');
    console.log(' URI:', mongoUri);
    
    await mongoose.connect(mongoUri);
    console.log(' Connected to MongoDB successfully');

    // Check if admin already exists
    const existingAdmin = await mongoose.connection.collection('users').findOne({ 
      email: 'admin@compiler.com' 
    });

    if (existingAdmin) {
      console.log(' Admin user already exists!');
      console.log(' Email:', existingAdmin.email);
      console.log(' ID:', existingAdmin._id);
      await mongoose.disconnect();
      return;
    }

    // Hash password
    const password = 'Admin@123';
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(' Password hashed successfully');

    // Create admin user object
    const adminUser = {
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@compiler.com',
      password: hashedPassword,
      mobileNumber: '9999999999',
      role: 'admin',
      isActive: true,
      isEmailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert into database
    const result = await mongoose.connection.collection('users').insertOne(adminUser);
    
    console.log('\n FIRST ADMIN CREATED SUCCESSFULLY! \n');
    console.log(' Email:', adminUser.email);
    console.log(' Password:', password);
    console.log(' User ID:', result.insertedId);
    console.log(' Name:', adminUser.firstName, adminUser.lastName);
    console.log(' Role:', adminUser.role);
    console.log('\n You can now login with these credentials!\n');

    await mongoose.disconnect();
    console.log(' Disconnected from MongoDB');
    
  } catch (error) {
    console.error(' Error creating admin:', error);
    process.exit(1);
  }
}

// Run the function
createFirstAdmin();