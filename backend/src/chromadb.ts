import { CloudClient, Collection } from 'chromadb';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class ChromaDBService {
  private client: CloudClient;
  private collection: Collection | null = null;
  private openai: OpenAI;
  private readonly COLLECTION_NAME = 'campusqa_vectors';

  constructor() {
    // Initialize OpenAI client
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    
    this.openai = new OpenAI({
      apiKey: apiKey
    });

    // Initialize ChromaDB client - supports both local and cloud
    const chromaApiKey = process.env.CHROMADB_API_KEY;
    const chromaTenant = process.env.CHROMADB_TENANT;
    const chromaDatabase = process.env.CHROMADB_DATABASE;
    const chromaHost = process.env.CHROMADB_HOST;
    
    if (chromaApiKey && chromaTenant && chromaDatabase) {
      // Use ChromaDB cloud with tenant and database
      this.client = new CloudClient({
        apiKey: chromaApiKey,
        tenant: chromaTenant,
        database: chromaDatabase
      });
      console.log(`Using ChromaDB cloud service (tenant: ${chromaTenant}, database: ${chromaDatabase})`);
    } else {
      throw new Error('CHROMADB_API_KEY, CHROMADB_TENANT, and CHROMADB_DATABASE environment variables are required');
    }
  }

  async initialize() {
    try {
      console.log('Initializing ChromaDB connection...');
      
      // Check if collection exists, create if it doesn't
      const collections = await this.client.listCollections();
      const collectionExists = collections.some(col => col.name === this.COLLECTION_NAME);
      
      if (!collectionExists) {
        console.log(`Creating collection: ${this.COLLECTION_NAME}`);
        this.collection = await this.client.createCollection({
          name: this.COLLECTION_NAME,
          metadata: {
            desc: 'CampusQA vectors'
          },
          embeddingFunction: {
            generate: async (texts: string[]) => {
              return await this.generateOpenAIEmbeddings(texts);
            }
          }
        });
      } else {
        console.log(`Using existing collection: ${this.COLLECTION_NAME}`);
        this.collection = await this.client.getCollection({
          name: this.COLLECTION_NAME
        });
      }
      
      console.log('ChromaDB initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ChromaDB:', error);
      throw error;
    }
  }

  async addDocument(id: string, text: string, metadata: Record<string, any> = {}) {
    if (!this.collection) {
      throw new Error('ChromaDB collection not initialized');
    }

    try {
      // Generate embedding using OpenAI
      const embedding = await this.generateOpenAIEmbedding(text);
      
      await this.collection.add({
        ids: [id],
        embeddings: [embedding],
        documents: [text],
        metadatas: [metadata]
      });
      
      console.log(`Added document with ID: ${id}`);
    } catch (error) {
      console.error('Failed to add document to ChromaDB:', error);
      throw error;
    }
  }

  async searchSimilar(query: string, nResults: number = 5) {
    if (!this.collection) {
      throw new Error('ChromaDB collection not initialized');
    }

    try {
      // Generate embedding for the query using OpenAI
      const queryEmbedding = await this.generateOpenAIEmbedding(query);
      
      const results = await this.collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: nResults
      });
      
      return results;
    } catch (error) {
      console.error('Failed to search ChromaDB:', error);
      throw error;
    }
  }

  async getCollection() {
    return this.collection;
  }

  // Generate OpenAI embeddings for a single text
  private async generateOpenAIEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float'
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.error('Failed to generate OpenAI embedding:', error);
      throw error;
    }
  }

  // Generate OpenAI embeddings for multiple texts
  private async generateOpenAIEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: texts,
        encoding_format: 'float'
      });
      
      return response.data.map(item => item.embedding);
    } catch (error) {
      console.error('Failed to generate OpenAI embeddings:', error);
      throw error;
    }
  }
}

export default ChromaDBService; 