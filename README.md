# AskIQ

**AskIQ** is a full-stack, AI-powered knowledge assistant that answers questions using a **retrieval-augmented generation (RAG)** architecture to combine vector search over data with LLM-powered responses.

---

## 🔒 Disclaimer

This is a sanitized version of a full project.

---

## 🧠 Key Features

- 🧹 **Automated Web Scraper**  
  Crawls thousands of informational pages using a memory-optimized Python crawler with parallel browser sessions and sitemap-based discovery

- 🔍 **Semantic Search with Vector Embeddings**  
  Chunks scraped content and stores it in **ChromaDB** with OpenAI `text-embedding-3-small` vectors, filtered by similarity threshold

- 💬 **LLM-Powered Chat Interface**  
  Uses **GPT-4o** to generate streaming responses based on top-k relevant chunks, with fallback logic for unhandled queries

- 🔐 **User Accounts & Persistence**  
  Google SSO Auth via Firebase; chat history stored in **Supabase** (PostgreSQL)

- 🎨 **Modern, Responsive UI**  
  Branded React frontend with Tailwind CSS, real-time chat, and mobile responsiveness

---

## 🔧 Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite, Firebase Auth
- **Backend**: Node.js, Express, Supabase, OpenAI API
- **Scraper**: Python, `crawl4ai`
- **Vector DB**: ChromaDB (with metadata filtering)
- **LLM**: GPT-4o (via OpenAI API)

---

## 🧭 System Architecture

1. **Scraper** collects and chunks structured/unstructured content  
2. Chunks + metadata → **ChromaDB** with OpenAI embeddings  
3. User submits query → **backend** runs vector search  
4. Relevant docs passed to **GPT-4o** for context-based response  
5. **Streaming reply** returned to React frontend  
6. Conversation stored in Supabase with user association

---

## 🧪 Setup (Local Dev)

```bash
# Start scraper (Python)
cd scraper
pip install -r requirements.txt
python crawl_sitemap.py <sitemap_url> <category> <title>

# Start backend (Node.js)
cd backend
npm install
npm start

# Start frontend (React)
cd frontend
npm install
npm run dev
```

---

## 🚀 Deployment

The system is designed for cloud deployment with:
- **Frontend**: Vercel/Netlify
- **Backend**: Railway/Render
- **Database**: Supabase (PostgreSQL)
- **Vector DB**: ChromaDB Cloud
- **Auth**: Firebase

---

## 🔧 Environment Variables

```
OPENAI_API_KEY=your_openai_key
CHROMADB_API_KEY=your_chromadb_key
CHROMADB_TENANT=your_tenant
CHROMADB_DATABASE=your_database
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```
