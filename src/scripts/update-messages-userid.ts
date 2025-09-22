require('dotenv').config();
const mongoose = require('mongoose');
const { Message: MessageModel } = require('../src/models/message');
const { Chat } = require('../src/models/chat');

async function updateMessagesWithUserId() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gptclone';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      dbName: 'gpt-clone',
      retryWrites: true,
      retryReads: true
    });
    console.log('Connected to MongoDB');

    // Get all chats
    const chats = await Chat.find({});
    
    for (const chat of chats) {
      console.log(`Updating messages for chat ${chat._id} with user ${chat.userId}`);
      
      // Update all messages in this chat with the chat's userId
      await MessageModel.updateMany(
        { chatId: chat._id },
        { $set: { userId: chat.userId } }
      );
    }

    console.log('Successfully updated all messages with user IDs');
    process.exit(0);
  } catch (error) {
    console.error('Error updating messages:', error);
    process.exit(1);
  }
}

updateMessagesWithUserId();
