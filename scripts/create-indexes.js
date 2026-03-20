#!/usr/bin/env node

/**
 * Database Index Creation Script
 * Creates optimized indexes for better query performance with 500+ concurrent users
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function createIndexes() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        console.log(' Connected to MongoDB');
        
        const db = client.db('place value Portal');
        
        // User collection indexes
        console.log('Creating User collection indexes...');
        await db.collection('users').createIndex({ "email": 1 }, { unique: true, background: true });
        await db.collection('users').createIndex({ "registrationNo": 1 }, { unique: true, background: true });
        await db.collection('users').createIndex({ "role": 1 }, { background: true });
        await db.collection('users').createIndex({ "isActive": 1 }, { background: true });
        await db.collection('users').createIndex({ "createdAt": 1 }, { background: true });
        await db.collection('users').createIndex({ "isEmailVerified": 1 }, { background: true });
        await db.collection('users').createIndex({ "lastLogin": 1 }, { background: true });
        await db.collection('users').createIndex({ "college._id": 1, "branch._id": 1, "collegeYear": 1 }, { background: true });
        await db.collection('users').createIndex({ "firstName": "text", "lastName": "text", "email": "text" }, { background: true });
        
        // Assessment collection indexes
        console.log('Creating Assessment collection indexes...');
        await db.collection('assessments').createIndex({ "createdAt": 1 }, { background: true });
        await db.collection('assessments').createIndex({ "isActive": 1 }, { background: true });
        await db.collection('assessments').createIndex({ "status": 1 }, { background: true });
        await db.collection('assessments').createIndex({ "title": "text", "description": "text" }, { background: true });
        
        // Assessment Results collection indexes
        console.log('Creating Assessment Results collection indexes...');
        await db.collection('assessmentresults').createIndex({ "userId": 1, "assessmentId": 1 }, { unique: true, background: true });
        await db.collection('assessmentresults').createIndex({ "userId": 1 }, { background: true });
        await db.collection('assessmentresults').createIndex({ "assessmentId": 1 }, { background: true });
        await db.collection('assessmentresults').createIndex({ "submittedAt": 1 }, { background: true });
        await db.collection('assessmentresults').createIndex({ "score": 1 }, { background: true });
        await db.collection('assessmentresults').createIndex({ "status": 1 }, { background: true });
        
        // Questions collection indexes
        console.log('Creating Questions collection indexes...');
        await db.collection('questions').createIndex({ "assessmentId": 1 }, { background: true });
        await db.collection('questions').createIndex({ "type": 1 }, { background: true });
        await db.collection('questions').createIndex({ "difficulty": 1 }, { background: true });
        await db.collection('questions').createIndex({ "isActive": 1 }, { background: true });
        
        // Colleges collection indexes
        console.log('Creating Colleges collection indexes...');
        await db.collection('colleges').createIndex({ "name": 1 }, { unique: true, background: true });
        await db.collection('colleges').createIndex({ "isActive": 1 }, { background: true });
        
        // Branches collection indexes
        console.log('Creating Branches collection indexes...');
        await db.collection('branches').createIndex({ "name": 1 }, { background: true });
        await db.collection('branches').createIndex({ "collegeId": 1 }, { background: true });
        await db.collection('branches').createIndex({ "isActive": 1 }, { background: true });
        
        console.log('All indexes created successfully!');
        
        // Display index information
        const collections = ['users', 'assessments', 'assessmentresults', 'questions', 'colleges', 'branches'];
        
        for (const collectionName of collections) {
            const indexes = await db.collection(collectionName).listIndexes().toArray();
            console.log(`\n ${collectionName} indexes:`);
            indexes.forEach(index => {
                console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
            });
        }
        
    } catch (error) {
        console.error('Error creating indexes:', error);
        process.exit(1);
    } finally {
        await client.close();
        console.log('\n Disconnected from MongoDB');
    }
}

// Run the script
if (require.main === module) {
    createIndexes().catch(console.error);
}

module.exports = { createIndexes };
