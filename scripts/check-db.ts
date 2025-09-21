import mongoose from 'mongoose';
import { Message } from '@/models/message';
import { Chat } from '@/models/chat';
import dbConnect from '@/lib/mongodb';

async function checkDatabase() {
  try {
    // Connect to the database
    console.log('Connecting to database...');
    await dbConnect();

    // Ensure the connection is established and db is available
    if (!mongoose.connection.db) {
      throw new Error('Database connection not established');
    }

    // Get the database instance with null check
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    
    // Get the database name
    const dbName = db.databaseName;
    console.log(`Connected to database: ${dbName}`);

    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\nCollections in database:');
    collections.forEach((collection) => {
      console.log(`- ${collection.name}`);
    });

    // Count documents in each collection
    console.log('\nDocument counts:');
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`- ${collection.name}: ${count} documents`);
    }

    // Check if messages collection exists
    const messagesExist = collections.some(c => c.name === 'messages');
    if (messagesExist) {
      console.log('\nSample messages:');
      const sampleMessages = await Message.find().limit(3).lean();
      console.log(sampleMessages);
    } else {
      console.log('\nMessages collection does not exist yet.');
    }

    // Check if chats collection exists
    const chatsExist = collections.some(c => c.name === 'chats');
    if (chatsExist) {
      console.log('\nSample chats:');
      const sampleChats = await Chat.find().limit(3).lean();
      console.log(sampleChats);
    } else {
      console.log('\nChats collection does not exist yet.');
    }

  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
}

// Run the check
checkDatabase();
