import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface ChatMessage {
  id?: number;
  email: string;
  question: string;
  answer: string;
  timestamp?: string;
  vector?: any; // for future vector search
}

class SupabaseService {
  private supabase;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async initialize() {
    try {
      console.log('Initializing Supabase connection...');
      
      // Test the connection by trying to access the chat_history table
      const { data, error } = await this.supabase
        .from('chat_history')
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('Supabase connection test failed:', error);
        throw error;
      }
      
      console.log('Supabase connection established successfully');
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      throw error;
    }
  }

  async addChatMessage(email: string, question: string, answer: string): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from('chat_history')
        .insert({
          email,
          question,
          answer,
          timestamp: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) {
        console.error('Failed to insert chat message:', error);
        throw error;
      }

      console.log(`Added chat message with ID: ${data.id}`);
      return data.id;
    } catch (error) {
      console.error('Error adding chat message to Supabase:', error);
      throw error;
    }
  }

  async getChatHistory(email: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await this.supabase
        .from('chat_history')
        .select('id, email, question, answer, timestamp')
        .eq('email', email)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Failed to fetch chat history:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching chat history from Supabase:', error);
      throw error;
    }
  }

  async deleteChatHistory(email: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('chat_history')
        .delete()
        .eq('email', email);

      if (error) {
        console.error('Failed to delete chat history:', error);
        throw error;
      }

      console.log(`Deleted chat history for email: ${email}`);
    } catch (error) {
      console.error('Error deleting chat history from Supabase:', error);
      throw error;
    }
  }

  async getSupabaseClient() {
    return this.supabase;
  }
}

export default SupabaseService; 