import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import Groq from 'groq-sdk';

dotenv.config();

const app = express();
const PORT = 5001;

// CORS configuration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://ai-resume-builder-tkb5.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  console.log(`${req.method} ${req.path}`);
  
  if (req.method === 'OPTIONS') {
    console.log('📋 OPTIONS preflight - responding with 200');
    return res.status(200).end();
  }
  
  next();
});

app.use(express.json());

// Initialize Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Store conversations temporarily (in production, use a database)
const conversations = new Map();

// Test route
app.get('/', (req, res) => {
  console.log('✅ Root GET request received');
  res.json({ message: 'AI Resume Assistant Server is running!' });
});

// 🆕 Chat endpoint - for conversational interaction
app.post('/api/chat', async (req, res) => {
  console.log('💬 CHAT REQUEST RECEIVED');
  
  const { message, conversationId } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: 'Groq API key missing' });
  }

  try {
    // Get or create conversation history
    let history = conversations.get(conversationId) || [];
    
    // Add user message to history
    history.push({
      role: 'user',
      content: message
    });

    // Create chat completion with conversation history
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: `You are a friendly and professional Resume Assistant. Your job is to:
1. Greet users warmly
2. Ask them about their professional background in a conversational way
3. Gather information about: name, contact info, work experience, education, skills, achievements
4. When the user says "generate resume" or "create my resume", use ALL the information from the conversation to create a professional, ATS-friendly resume
5. Be conversational, encouraging, and helpful
6. Ask follow-up questions to get more details
7. Remember everything the user tells you in the conversation

When generating a resume, format it professionally with clear sections:
- Contact Information
- Professional Summary
- Work Experience
- Education
- Skills
- Certifications/Awards (if mentioned)

Use the actual information the user provided during the conversation.`
        },
        ...history
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    const aiResponse = completion.choices[0]?.message?.content || 'I apologize, I could not generate a response.';
    
    // Add AI response to history
    history.push({
      role: 'assistant',
      content: aiResponse
    });

    // Save updated history
    conversations.set(conversationId, history);

    console.log('✅ Chat response generated');
    res.json({ 
      response: aiResponse,
      conversationId: conversationId
    });

  } catch (error) {
    console.error('❌ Groq API Error:', error);
    res.status(500).json({
      error: 'Failed to generate response',
      details: error.message
    });
  }
});

// 🆕 Clear conversation endpoint
app.post('/api/clear-conversation', (req, res) => {
  const { conversationId } = req.body;
  
  if (conversationId && conversations.has(conversationId)) {
    conversations.delete(conversationId);
    console.log(`🗑️ Cleared conversation: ${conversationId}`);
  }
  
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ AI Resume Assistant Server running on http://localhost:${PORT}`);
  console.log(`✅ CORS enabled for: http://localhost:5173`);
  console.log(`✅ Groq API Key: ${process.env.GROQ_API_KEY ? 'Loaded' : 'Missing'}`);
  console.log(`${'='.repeat(60)}\n`);
  console.log('Waiting for chat requests...\n');
});
