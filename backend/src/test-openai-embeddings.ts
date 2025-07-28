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
    
    // Test documents with various Stanford-related content
    const testDocuments = [
      {
        id: 'stanford-overview',
        text: "Stanford University is a private research university in Stanford, California. It was founded in 1885 by Leland and Jane Stanford in memory of their only child, Leland Stanford Jr. The university is known for its academic achievements, wealth, and close proximity to Silicon Valley.",
        metadata: { category: 'university_info', topic: 'overview' }
      },
      {
        id: 'stanford-admissions',
        text: "Stanford University has one of the most competitive admission processes in the world. The acceptance rate is typically around 4-5%. Applicants are evaluated based on academic excellence, extracurricular activities, leadership potential, and personal qualities. The university looks for students who will contribute to the campus community.",
        metadata: { category: 'admissions', topic: 'process' }
      },
      {
        id: 'stanford-academics',
        text: "Stanford offers undergraduate and graduate programs across seven schools: Business, Earth Sciences, Education, Engineering, Humanities and Sciences, Law, and Medicine. The university is particularly renowned for its programs in computer science, engineering, business, and medicine. Students can choose from over 90 majors and minors.",
        metadata: { category: 'academics', topic: 'programs' }
      },
      {
        id: 'stanford-campus',
        text: "Stanford's campus spans 8,180 acres in the heart of Silicon Valley. The main campus features distinctive Mission Revival architecture with red tile roofs and sandstone buildings. Notable landmarks include the Main Quad, Memorial Church, Hoover Tower, and the Cantor Arts Center. The campus is known for its beautiful palm-lined driveways and open spaces.",
        metadata: { category: 'campus', topic: 'facilities' }
      },
      {
        id: 'stanford-research',
        text: "Stanford is a leading research institution with over $1 billion in annual research funding. The university is home to numerous research centers and institutes, including the Stanford Research Institute (SRI), SLAC National Accelerator Laboratory, and the Hoover Institution. Research areas include artificial intelligence, renewable energy, medicine, and social sciences.",
        metadata: { category: 'research', topic: 'institutes' }
      },
      {
        id: 'stanford-financial-aid',
        text: "Stanford is committed to making education accessible through generous financial aid. The university meets 100% of demonstrated financial need for admitted students. Families with incomes below $150,000 pay no tuition, and families with incomes below $75,000 pay no tuition, room, or board. Over 60% of students receive some form of financial assistance.",
        metadata: { category: 'financial_aid', topic: 'policies' }
      },
      {
        id: 'stanford-student-life',
        text: "Stanford offers a vibrant student life with over 600 student organizations, including cultural groups, academic clubs, and recreational activities. The university has a strong athletic tradition with 36 varsity sports teams competing in the Pac-12 Conference. Greek life, residential communities, and the Stanford Band are integral parts of campus culture.",
        metadata: { category: 'student_life', topic: 'activities' }
      },
      {
        id: 'stanford-alumni',
        text: "Stanford has produced numerous notable alumni including founders of Google, Netflix, Instagram, and other major tech companies. The university's alumni network is one of the most powerful in the world, particularly in technology and entrepreneurship. Stanford graduates have won Nobel Prizes, Pulitzer Prizes, and other prestigious awards.",
        metadata: { category: 'alumni', topic: 'achievements' }
      },
      {
        id: 'stanford-location',
        text: "Stanford is located in the San Francisco Bay Area, specifically in the city of Stanford, California. The university is situated between San Francisco and San Jose, making it easily accessible to major tech companies, venture capital firms, and cultural attractions. The proximity to Silicon Valley provides unique opportunities for internships and career development.",
        metadata: { category: 'location', topic: 'geography' }
      },
      {
        id: 'stanford-history',
        text: "Stanford University was established in 1885 by California Governor Leland Stanford and his wife, Jane Stanford. The university opened its doors in 1891 with 555 students. The Stanford family's vision was to create a university that would prepare students for practical success in life while contributing to the public welfare.",
        metadata: { category: 'history', topic: 'founding' }
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
      "How do I get into Stanford?",
      "What is the campus like?",
      "Tell me about financial aid",
      "What research opportunities are available?",
      "How much does Stanford cost?",
      "What majors can I study?",
      "Where is Stanford located?",
      "What are the admission requirements?",
      "Tell me about student organizations",
      "What famous people went to Stanford?",
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