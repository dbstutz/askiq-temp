import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import ChromaDBService from './chromadb';
import SupabaseService from './supabase';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize services
const chromaDB = new ChromaDBService();
const supabase = new SupabaseService();

app.use(cors());
app.use(express.json());

app.post('/api/ask', async (req, res) => {
  const { question, email } = req.body;
  
  // Check if client wants streaming
  const wantsStreaming = req.query.stream === 'true';
  
  if (wantsStreaming) {
    // Set up streaming response
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    try {
      // Perform vector search to find relevant Stanford information
      let relevantInfo = '';
      
      try {
        const searchResults = await chromaDB.searchSimilar(question, 3);
        
        if (searchResults.documents && searchResults.documents[0] && searchResults.documents[0].length > 0) {
          const topResult = searchResults.documents[0][0];
          const distance = searchResults.distances?.[0]?.[0];
          
          // Only include results if they're reasonably relevant (distance < 1.5)
          if (distance && distance < 1.5 && topResult) {
            relevantInfo = topResult;
          }
        }
      } catch (searchError) {
        console.warn('Vector search failed:', searchError);
      }
      
      // Generate streaming answer using ChatGPT-4o Mini
      let fullAnswer = '';
      try {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });
        
        const systemPrompt = `You are CampusQA, a helpful AI assistant for Stanford University. You have access to Stanford-specific information to answer questions accurately and helpfully.

IMPORTANT GUIDELINES:
- Only answer questions that are relevant to Stanford students
- If the provided information doesn't answer the question, say you don't have enough information
- Be friendly, helpful, and accurate, like an upperclass mentor
- Keep responses concise but informative`;

        const userPrompt = relevantInfo 
          ? `Question: ${question}\n\nRelevant Stanford Information: ${relevantInfo}\n\nPlease answer the question using the provided information.`
          : `Question: ${question}\n\nI don't have specific Stanford information for this question. Please respond appropriately.`;

        const stream = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 500,
          temperature: 0.7,
          stream: true
        });
        
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            fullAnswer += content;
            res.write(content);
          }
        }
        
        res.end();
      } catch (openaiError) {
        console.error('OpenAI API error:', openaiError);
        const fallbackAnswer = relevantInfo 
          ? `Based on Stanford information: ${relevantInfo}\n\nThis is a fallback response. The AI service is temporarily unavailable.`
          : 'I\'m sorry, I don\'t have specific information about that Stanford topic, and the AI service is temporarily unavailable.';
        
        fullAnswer = fallbackAnswer;
        res.write(fallbackAnswer);
        res.end();
      }
      
      // Store in Supabase after streaming is complete
      if (email && fullAnswer) {
        try {
          await supabase.addChatMessage(email, question, fullAnswer);
        } catch (supabaseError) {
          console.warn('Failed to store in Supabase:', supabaseError);
        }
      }
      
    } catch (error) {
      console.error('Error in streaming /api/ask:', error);
      res.write('Sorry, something went wrong. Please try again.');
      res.end();
    }
  } else {
    // Non-streaming response (JSON)
    try {
      // Perform vector search to find relevant Stanford information
      let relevantInfo = '';
      let searchResults = null;
      
      try {
        searchResults = await chromaDB.searchSimilar(question, 3);
        
        if (searchResults.documents && searchResults.documents[0] && searchResults.documents[0].length > 0) {
          const topResult = searchResults.documents[0][0];
          const distance = searchResults.distances?.[0]?.[0];
          
          // Only include results if they're reasonably relevant (distance < 1.5)
          if (distance && distance < 1.5 && topResult) {
            relevantInfo = topResult;
          }
        }
      } catch (searchError) {
        console.warn('Vector search failed:', searchError);
      }
      
      // Generate answer using ChatGPT-4o Mini
      let answer = '';
      try {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });
        
        const systemPrompt = `You are CampusQA, a helpful AI assistant for Stanford University. You have access to Stanford-specific information to answer questions accurately and helpfully.

IMPORTANT GUIDELINES:
- Only answer questions that are relevant to Stanford students
- If the provided information doesn't answer the question, say you don't have enough information
- Be friendly, helpful, and accurate, like an upperclass mentor
- Keep responses concise but informative`;

        const userPrompt = relevantInfo 
          ? `Question: ${question}\n\nRelevant Stanford Information: ${relevantInfo}\n\nPlease answer the question using the provided information.`
          : `Question: ${question}\n\nI don't have specific Stanford information for this question. Please respond appropriately.`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 500,
          temperature: 0.7
        });
        
        answer = completion.choices[0].message.content || 'Sorry, I couldn\'t generate a response.';
      } catch (openaiError) {
        console.error('OpenAI API error:', openaiError);
        answer = relevantInfo 
          ? `Based on Stanford information: ${relevantInfo}\n\nThis is a fallback response. The AI service is temporarily unavailable.`
          : 'I\'m sorry, I don\'t have specific information about that Stanford topic, and the AI service is temporarily unavailable.';
      }
      
      // Store in Supabase
      if (email) {
        try {
          await supabase.addChatMessage(email, question, answer);
        } catch (supabaseError) {
          console.warn('Failed to store in Supabase:', supabaseError);
        }
      }
      
      res.json({ 
        answer,
        relevantInfo: relevantInfo || null,
        searchResults: searchResults ? {
          documents: searchResults.documents?.[0] || [],
          distances: searchResults.distances?.[0] || [],
          metadatas: searchResults.metadatas?.[0] || []
        } : null
      });
    } catch (error) {
      console.error('Error in /api/ask:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

app.get('/api/history', async (req, res) => {
  const email = req.query.email as string;
  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }
  
  try {
    const history = await supabase.getChatHistory(email);
    res.json({ history });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

app.delete('/api/history', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }
  
  try {
    await supabase.deleteChatHistory(email);
    res.json({ message: 'Chat history cleared successfully' });
  } catch (error) {
    console.error('Error clearing chat history:', error);
    res.status(500).json({ error: 'Failed to clear chat history' });
  }
});

// Vector search endpoint
app.post('/api/search', async (req, res) => {
  const { query, nResults = 5 } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: 'Missing query' });
  }
  
  try {
    const results = await chromaDB.searchSimilar(query, nResults);
    res.json({ results });
  } catch (error) {
    console.error('Error in vector search:', error);
    res.status(500).json({ error: 'Vector search failed' });
  }
});

// Initialize services and start server
async function startServer() {
  try {
    await chromaDB.initialize();
    await supabase.initialize();
    app.listen(PORT, () => {
      console.log(`CampusQA backend running on port ${PORT}`);
      console.log('ChromaDB vector database ready');
      console.log('Supabase chat history ready');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
