import React, { useState, useEffect } from 'react';
import { auth, provider, signInWithPopup } from './firebase';
import { onAuthStateChanged, signOut, getRedirectResult } from 'firebase/auth';
import type { User } from 'firebase/auth';
import stanLogo from './assets/logo/campusqa-logo.png';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{id:number, question:string, answer:string, timestamp:string}[]>([]);

  // Handle redirect result for signInWithRedirect
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        // No need to manually set user if using onAuthStateChanged
      })
      .catch((error) => {
        console.error('Redirect sign-in error:', error);
      });
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user && user.email) {
        fetchHistory(user.email);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Sign-in error:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign-out error:', error);
    }
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;
    
    setLoading(true);
    setAnswer('');
    try {
      const res = await fetch('http://localhost:3001/api/ask?stream=true', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question, email: user.email }),
      });
      
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      
      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }
      
      const decoder = new TextDecoder();
      let streamedAnswer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        streamedAnswer += chunk;
        setAnswer(streamedAnswer);
      }
      
      setQuestion('');
      // Refetch history
      await fetchHistory(user.email);
    } catch (err) {
      setAnswer('Error contacting CampusQA backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!user?.email) return;
    
    if (window.confirm('Are you sure you want to clear your chat history? This action cannot be undone.')) {
      try {
        const res = await fetch('http://localhost:3001/api/history', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email }),
        });
        
        if (res.ok) {
          setHistory([]);
          setAnswer('');
          alert('Chat history cleared successfully!');
        } else {
          alert('Failed to clear chat history.');
        }
      } catch (err) {
        alert('Error clearing chat history.');
      }
    }
  };

  const fetchHistory = async (email: string) => {
    try {
      const histRes = await fetch(`http://localhost:3001/api/history?email=${encodeURIComponent(email)}`);
      const histData = await histRes.json();
      setHistory(histData.history || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-neutral-50 font-serif">
        <div className="w-full max-w-md mx-auto bg-white p-10 rounded-2xl shadow-2xl border border-neutral-200 flex flex-col items-center">
        <img src={stanLogo} alt="AskStan Logo" className="w-20 h-30 mb-4 object-contain" />
          <h1 className="text-4xl font-extrabold mb-2 text-[#8C1515] drop-shadow-lg" style={{color:'#1a1a1a'}}>CampusQA</h1>
          <p className="mb-8 text-[#8C1515]/80 font-medium" style={{color:'#1a1a1a'}}>Your Stanford AI Campus Assistant</p>
          <button
            onClick={handleSignIn}
            className="bg-[#8C1515] py-3 px-6 rounded font-bold text-lg hover:bg-[#A62626] transition mt-2 text-white"
            style={{background:'#8C1515', color:'#fff', border:'none'}}
          >
            Sign in
          </button>
        </div>
        <footer className="mt-12 text-neutral-400 text-sm opacity-80">Not affiliated with Stanford University yet, but for the people.</footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-neutral-50 font-serif" style={{color:'#1a1a1a'}}>
      {/* Top right user info */}
      <div className="fixed top-0 right-0 p-4 z-50 flex items-center space-x-4">
        <span className="text-sm text-[#8C1515] font-semibold">{user.displayName} ({user.email})</span>
        <button
          onClick={handleSignOut}
          className="text-xs underline hover:no-underline text-[#8C1515] border border-[#8C1515] rounded px-3 py-1 bg-white"
        >
          Sign out
        </button>
      </div>
      <div className="flex flex-col items-center w-full px-4">
        <img src={stanLogo} alt="AskStan Logo" className="w-20 h-30 mb-4 object-contain" />
        <h1 className="text-5xl font-extrabold mb-2 text-[#8C1515] drop-shadow-lg" style={{color:'#1a1a1a'}}>CampusQA</h1>
        <p className="mb-8 text-lg text-[#8C1515]/80 font-medium" style={{color:'#1a1a1a'}}>Your Stanford AI Campus Assistant</p>
        <form onSubmit={handleAsk} className="w-full max-w-2xl mx-auto flex flex-col gap-4 bg-white p-8 rounded-2xl shadow-2xl border border-neutral-200">
          <input
            type="text"
            className="border border-[#8C1515] rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#8C1515] text-lg bg-white"
            placeholder="Ask a question about Stanford..."
            value={question}
            onChange={e => setQuestion(e.target.value)}
            required
          />
          <button
            type="submit"
            className="bg-[#8C1515] py-3 rounded font-bold text-lg hover:bg-[#A62626] transition text-white"
            style={{background:'#8C1515', color:'#fff', border:'none'}}
            disabled={loading}
          >
            {loading ? 'Asking...' : 'Ask CampusQA'}
          </button>
        </form>
        {answer && (
          <div className="mt-8 w-full max-w-2xl mx-auto bg-neutral-100 border border-[#8C1515] rounded-xl p-6 shadow-lg text-lg" style={{color:'#1a1a1a'}}>
            <span className="block mb-2 font-bold text-[#8C1515]">Stan says:</span> 
            <div className="whitespace-pre-wrap">{answer}</div>
          </div>
        )}
        {/* Chat history below everything */}
        <div className="w-full max-w-2xl mx-auto mt-10 mb-6">
          {history.length > 0 && (
            <div className="bg-neutral-100 border border-[#8C1515] rounded-xl p-6 shadow-lg text-lg mb-4" style={{color:'#1a1a1a'}}>
              <div className="flex justify-between items-center mb-4">
                <div className="font-bold text-[#8C1515]">Your Chat History</div>
                <button
                  onClick={handleClearHistory}
                  className="text-xs bg-[#8C1515] text-white px-3 py-1 rounded"
                >
                  Clear History
                </button>
              </div>
              <ul className="space-y-4">
                {history.map(h => (
                  <li key={h.id}>
                    <div className="text-sm text-neutral-500 mb-1">{new Date(h.timestamp).toLocaleString()}</div>
                    <div><span className="font-semibold">You:</span> {h.question}</div>
                    <div><span className="font-semibold text-[#8C1515]">Stan:</span> {h.answer}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      <footer className="mt-12 text-neutral-400 text-sm opacity-80">Not affiliated with Stanford University yet, but for the people.</footer>
    </div>
  );
}

export default App;
