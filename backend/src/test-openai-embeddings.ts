import ChromaDBService from './chromadb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testOpenAIEmbeddings() {
  try {
    console.log('Testing OpenAI embeddings with multiple texts...');
    
    // Check if API key is set
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY environment variable is not set');
      console.log('Please create a .env file with your OpenAI API key:');
      console.log('OPENAI_API_KEY=your_api_key_here');
      return;
    }

    const chromaService = new ChromaDBService();
    
    // Initialize the service
    await chromaService.initialize();
    
    // Test documents with various knowledge content
    const testDocuments = [
      {
        id: 'ai-overview',
        text: "Artificial Intelligence (AI) is a branch of computer science that aims to create intelligent machines that can perform tasks that typically require human intelligence. These tasks include learning, reasoning, problem-solving, perception, and language understanding. AI has applications in various fields including healthcare, finance, transportation, and entertainment.",
        metadata: { category: 'technology', topic: 'ai_overview' }
      },
      {
        id: 'machine-learning',
        text: "Machine Learning is a subset of AI that enables computers to learn and improve from experience without being explicitly programmed. It uses algorithms to identify patterns in data and make predictions or decisions. Common types include supervised learning, unsupervised learning, and reinforcement learning.",
        metadata: { category: 'technology', topic: 'machine_learning' }
      },
      {
        id: 'data-science',
        text: "Data Science is an interdisciplinary field that uses scientific methods, processes, algorithms, and systems to extract knowledge and insights from structured and unstructured data. It combines statistics, computer science, and domain expertise to solve complex problems and drive decision-making.",
        metadata: { category: 'technology', topic: 'data_science' }
      },
      {
        id: 'web-development',
        text: "Web development involves creating websites and web applications using various technologies like HTML, CSS, JavaScript, and backend frameworks. Modern web development includes frontend frameworks like React, Vue, and Angular, as well as backend technologies like Node.js, Python, and databases.",
        metadata: { category: 'technology', topic: 'web_development' }
      },
      {
        id: 'cloud-computing',
        text: "Cloud computing provides on-demand access to computing resources over the internet. It includes services like Infrastructure as a Service (IaaS), Platform as a Service (PaaS), and Software as a Service (SaaS). Major cloud providers include AWS, Google Cloud, and Microsoft Azure.",
        metadata: { category: 'technology', topic: 'cloud_computing' }
      },
      {
        id: 'cybersecurity',
        text: "Cybersecurity involves protecting computer systems, networks, and data from digital attacks, damage, or unauthorized access. It includes practices like encryption, authentication, network security, and incident response. With increasing digital threats, cybersecurity has become crucial for organizations and individuals.",
        metadata: { category: 'technology', topic: 'cybersecurity' }
      },
      {
        id: 'blockchain',
        text: "Blockchain is a distributed ledger technology that enables secure, transparent, and tamper-proof record-keeping. It's the foundation for cryptocurrencies like Bitcoin and Ethereum, but also has applications in supply chain management, voting systems, and digital identity verification.",
        metadata: { category: 'technology', topic: 'blockchain' }
      },
      {
        id: 'internet-of-things',
        text: "The Internet of Things (IoT) refers to the network of physical devices embedded with sensors, software, and connectivity that enables them to collect and exchange data. IoT applications include smart homes, industrial automation, healthcare monitoring, and environmental sensing.",
        metadata: { category: 'technology', topic: 'iot' }
      },
      {
        id: 'software-engineering',
        text: "Software engineering is the systematic approach to developing, testing, and maintaining software applications. It involves methodologies like Agile and DevOps, version control systems, testing frameworks, and deployment strategies to create reliable and scalable software solutions.",
        metadata: { category: 'technology', topic: 'software_engineering' }
      },
      {
        id: 'database-systems',
        text: "Database systems are organized collections of data that can be easily accessed, managed, and updated. They include relational databases like MySQL and PostgreSQL, NoSQL databases like MongoDB, and specialized systems for big data processing and analytics.",
        metadata: { category: 'technology', topic: 'databases' }
      }
    ];
    
    console.log(`Adding ${testDocuments.length} test documents...`);
    
    // Add all test documents
    for (const doc of testDocuments) {
      await chromaService.addDocument(doc.id, doc.text, doc.metadata);
      console.log(`✅ Added: ${doc.id}`);
    }
    
    // Test various search queries
    const searchQueries = [
      "What is artificial intelligence?",
      "How does machine learning work?",
      "Tell me about data science",
      "What is web development?",
      "Explain cloud computing",
      "How to secure computer systems?",
      "What is blockchain technology?",
      "Tell me about IoT devices",
      "What is software engineering?",
      "How do databases work?",
    ];
    
    console.log('\n🔍 Testing semantic search with various queries...\n');
    
    for (const query of searchQueries) {
      console.log(`\n📝 Query: "${query}"`);
      console.log('─'.repeat(50));
      
      const results = await chromaService.searchSimilar(query, 3);
      
      if (results.documents && results.documents[0]) {
        results.documents[0].forEach((doc: string | null, index: number) => {
          if (doc) {
            const distance = results.distances?.[0]?.[index];
            const metadata = results.metadatas?.[0]?.[index];
            console.log(`${index + 1}. ${doc.substring(0, 100)}...`);
            console.log(`   Distance: ${distance?.toFixed(4)} | Category: ${metadata?.category} | Topic: ${metadata?.topic}`);
          }
        });
      }
    }
    
    console.log('\n✅ OpenAI embeddings test completed successfully!');
    console.log(`📊 Added ${testDocuments.length} documents and tested ${searchQueries.length} queries`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testOpenAIEmbeddings(); 