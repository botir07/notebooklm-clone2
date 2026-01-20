const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');

const CHATS_FILE = path.join(__dirname, '../data/chats.json');

// Auth middleware
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Helper functions
const readChats = async () => {
  const data = await fs.readFile(CHATS_FILE, 'utf-8');
  return JSON.parse(data);
};

const writeChats = async (chats) => {
  await fs.writeFile(CHATS_FILE, JSON.stringify(chats, null, 2));
};

// Send message to AI
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { message, conversationId } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Call OpenRouter API
    const response = await axios.post(
      process.env.OPENROUTER_API_URL,
      {
        model: process.env.AI_MODEL || 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'user',
            content: message
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5000',
          'X-Title': 'My AI Chat App'
        }
      }
    );

    const aiResponse = response.data.choices[0].message.content;

    // Save chat history
    const chats = await readChats();
    const chatEntry = {
      id: Date.now().toString(),
      userId: req.userId,
      conversationId: conversationId || Date.now().toString(),
      userMessage: message,
      aiResponse: aiResponse,
      timestamp: new Date().toISOString()
    };

    chats.push(chatEntry);
    await writeChats(chats);

    res.json({
      success: true,
      message: aiResponse,
      conversationId: chatEntry.conversationId
    });
  } catch (error) {
    console.error('OpenRouter API Error:', error.response?.data || error.message);
    res.status(500).json({ 
      message: 'Error communicating with AI', 
      error: error.response?.data?.error || error.message 
    });
  }
});

// Get chat history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const chats = await readChats();
    const userChats = chats.filter(chat => chat.userId === req.userId);
    
    res.json({
      success: true,
      chats: userChats
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
