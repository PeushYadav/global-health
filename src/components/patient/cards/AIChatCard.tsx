// components/patient/cards/AIChatCard.tsx
'use client';
import { useEffect, useRef, useState } from 'react';

interface ChatMessage {
  sender: 'user' | 'bot';
  message: string;
  timestamp: Date;
}

export default function AIChatCard() {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      sender: 'bot',
      message: '👋 Hello! I\'m your personal health assistant. I\'m here to support you on your wellness journey!\n\n💡 **I can help you with:**\n• General health questions and wellness tips\n• Understanding your medications and side effects\n• Guidance on when to seek medical care\n• Healthy lifestyle advice (diet, exercise, sleep)\n• Preparing questions for your doctor visits\n• Managing common health concerns\n\n🔒 **Your privacy matters:** Our conversations are confidential and I won\'t store personal medical information.\n\n⚠️ **Important reminder:** I provide general health information only. For medical decisions, always consult your healthcare provider or doctor.\n\nWhat health topic would you like to discuss today?',
      timestamp: new Date(),
    },
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, loading]);

  const handleSubmit = async () => {
    if (!input.trim() || loading) return;
    
    const userMessage = input.trim();
    const newUserMessage: ChatMessage = {
      sender: 'user',
      message: userMessage,
      timestamp: new Date(),
    };
    
    setChatHistory((prev) => [...prev, newUserMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/patient/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userMessage }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      const botMessage: ChatMessage = {
        sender: 'bot',
        message: data.reply || 'I apologize, but I couldn\'t generate a response. Please try rephrasing your question.',
        timestamp: new Date(),
      };
      
      setChatHistory((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error fetching AI response:', error);
      const errorMessage: ChatMessage = {
        sender: 'bot',
        message: '⚠️ I\'m experiencing technical difficulties. Please try again in a moment.',
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const clearChat = () => {
    setChatHistory([
      {
        sender: 'bot',
        message: 'Chat cleared. How can I help you with your health questions today?',
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Health Assistant</h2>
          <p className="text-sm text-slate-600">Get instant health information and guidance</p>
        </div>
        <button
          onClick={clearChat}
          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-md transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Chat Messages */}
      <div className="h-64 overflow-y-auto border border-slate-200 rounded-lg p-3 space-y-3 mb-4">
        {chatHistory.map((msg, index) => (
          <div
            key={index}
            className={`max-w-[85%] ${
              msg.sender === 'user'
                ? 'ml-auto'
                : 'mr-auto'
            }`}
          >
            <div
              className={`px-3 py-2 rounded-lg text-sm leading-relaxed whitespace-pre-wrap ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-slate-100 text-slate-800 rounded-bl-sm'
              }`}
            >
              {msg.message}
            </div>
            <div className={`text-xs text-slate-500 mt-1 ${
              msg.sender === 'user' ? 'text-right' : 'text-left'
            }`}>
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="mr-auto max-w-[85%]">
            <div className="bg-slate-100 text-slate-800 px-3 py-2 rounded-lg rounded-bl-sm">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-slate-600">Assistant is typing...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={chatEndRef}></div>
      </div>

      {/* Input Area */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me about your health, medications, symptoms..."
          className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm text-black placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={loading}
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors"
        >
          {loading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            'Send'
          )}
        </button>
      </div>

      {/* Disclaimer */}
      <div className="mt-2 text-xs text-slate-500 text-center">
        ⚠️ This AI provides general health information only. Always consult your healthcare provider for medical advice.
      </div>
    </div>
  );
}