const bcrypt = require('bcryptjs');

// The hash from your database
const storedHash = '$2b$10$75VQzOBANtTQ8ENdNoXC4OCrKSViPTCOuyteudd1GSOkfio0lnoRq';
const testPassword = 'Admin@123';

// Test if the password matches
bcrypt.compare(testPassword, storedHash).then(isMatch => {
  console.log('Password test result:', isMatch);
  if (isMatch) {
    console.log('✅ Password matches! The issue is NOT with the password hash.');
  } else {
    console.log('❌ Password does NOT match! The hash is for a different password.');
  }
});