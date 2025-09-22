import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testConnection() {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI:', process.env.MONGODB_URI ? '***URI is set***' : 'URI is NOT set');
    
    const connection = await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Successfully connected to MongoDB');
    
    // List all collections to verify access
    if (!connection.connection.db) {
      throw new Error('Database connection not established');
    }
    const collections = await connection.connection.db.collections();
    console.log('\nAvailable collections:');
    collections.forEach(collection => {
      console.log(`- ${collection.namespace}`);
    });
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB connection error:');
    console.error(error);
    process.exit(1);
  }
}

testConnection();
