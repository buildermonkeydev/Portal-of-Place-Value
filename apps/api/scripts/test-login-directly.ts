import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function testLoginDirectly() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/compiler-db');
    
    const email = 'admin@compiler.com';
    const password = 'Admin@123';
    
    console.log('🔍 Testing login directly...\n');
    
    // Find user
    const user = await mongoose.connection.collection('users').findOne({ email });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found');
    console.log('📧 Email:', user.email);
    console.log('🎭 Role:', user.role);
    console.log('✅ isActive:', user.isActive);
    console.log('✅ isEmailVerified:', user.isEmailVerified);
    
    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log('🔑 Password matches:', passwordMatch);
    
    // Check for any fields that might cause issues
    const problematicFields = [
      'deletedAt', 'isDeleted', 'deleted', 'status',
      'accountLocked', 'isLocked', 'lockUntil', 'loginAttempts',
      'suspended', 'banned', 'archived'
    ];
    
    console.log('\n🔍 Checking for problematic fields:');
    problematicFields.forEach(field => {
      if (field in user) {
        console.log(`   ⚠️ Found ${field}:`, user[field]);
      }
    });
    
    // If all checks pass, login should work
    if (passwordMatch && user.isActive && user.isEmailVerified) {
      console.log('\n✅✅✅ All checks pass! Login SHOULD work! ✅✅✅');
      console.log('The issue must be in the UserService.login method implementation.');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

testLoginDirectly();