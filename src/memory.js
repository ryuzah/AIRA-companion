const fs = require('fs');
const path = require('path');

class MemoryManager {
  constructor(dataDir = './data') {
    this.dataDir = dataDir;
    this.conversationsFile = path.join(dataDir, 'conversations.json');
    this.usersFile = path.join(dataDir, 'users.json');
    
    // Create data directory if it doesn't exist
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Initialize files if they don't exist
    this.initializeFiles();
  }

  initializeFiles() {
    if (!fs.existsSync(this.conversationsFile)) {
      fs.writeFileSync(this.conversationsFile, JSON.stringify({}, null, 2));
    }
    if (!fs.existsSync(this.usersFile)) {
      fs.writeFileSync(this.usersFile, JSON.stringify({}, null, 2));
    }
  }

  // Get conversation history for a user
  getConversationHistory(userId, limit = 20) {
    try {
      const data = JSON.parse(fs.readFileSync(this.conversationsFile, 'utf8'));
      const userConversations = data[userId] || [];
      return userConversations.slice(-limit);
    } catch (error) {
      console.error('Error reading conversation history:', error);
      return [];
    }
  }

  // Add message to conversation history
  addMessage(userId, role, content) {
    try {
      const data = JSON.parse(fs.readFileSync(this.conversationsFile, 'utf8'));
      if (!data[userId]) {
        data[userId] = [];
      }
      
      data[userId].push({
        role,
        content,
        timestamp: new Date().toISOString()
      });
      
      fs.writeFileSync(this.conversationsFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error adding message to history:', error);
    }
  }

  // Get user profile
  getUserProfile(userId) {
    try {
      const data = JSON.parse(fs.readFileSync(this.usersFile, 'utf8'));
      return data[userId] || { userId, createdAt: new Date().toISOString(), preferences: {} };
    } catch (error) {
      console.error('Error reading user profile:', error);
      return { userId, createdAt: new Date().toISOString(), preferences: {} };
    }
  }

  // Update user profile
  updateUserProfile(userId, updates) {
    try {
      const data = JSON.parse(fs.readFileSync(this.usersFile, 'utf8'));
      if (!data[userId]) {
        data[userId] = { userId, createdAt: new Date().toISOString(), preferences: {} };
      }
      
      data[userId] = { ...data[userId], ...updates, lastUpdated: new Date().toISOString() };
      fs.writeFileSync(this.usersFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error updating user profile:', error);
    }
  }

  // Clear conversation history for a user
  clearConversationHistory(userId) {
    try {
      const data = JSON.parse(fs.readFileSync(this.conversationsFile, 'utf8'));
      delete data[userId];
      fs.writeFileSync(this.conversationsFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error clearing conversation history:', error);
    }
  }

  // Get context for AI (last N messages)
  getContextForAI(userId, contextLength = 10) {
    const history = this.getConversationHistory(userId, contextLength);
    return history.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }
}

module.exports = MemoryManager;
