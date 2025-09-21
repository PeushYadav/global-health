// components/doctors/AIChatPanel.tsx
'use client';
import { useEffect, useRef, useState } from 'react';

interface ChatMessage {
  sender: 'user' | 'bot';
  message: string;
  timestamp: Date;
}

export default function AIChatPanel() {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      sender: 'bot',
      message: 'Hello Doctor! I\'m your AI medical assistant powered by advanced language models. I can help you with:\n\n• **Clinical Decision Support**: Differential diagnoses, treatment protocols\n• **Drug Information**: Interactions, contraindications, dosing guidelines\n• **Medical Research**: Latest evidence-based recommendations\n• **Case Analysis**: Patient scenario discussions and management\n• **Procedure Guidance**: Step-by-step medical procedures\n• **Lab Interpretation**: Understanding test results and values\n\nFeel free to ask me anything about medicine, patient care, or clinical practice. How can I assist you today?',
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
      const response = await fetch('/api/doctor/ai-chat', {
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
        message: '⚠️ Sorry, I\'m experiencing technical difficulties. Please try again in a moment.',
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
        message: 'Chat cleared. How can I assist you with your medical queries today?',
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">AI Medical Assistant</h2>
          <p className="text-sm text-slate-600">Get instant medical information and assistance</p>
        </div>
        <button
          onClick={clearChat}
          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-md transition-colors"
        >
          Clear Chat
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg p-4 space-y-4 min-h-0">
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
              className={`px-4 py-3 rounded-lg text-sm leading-relaxed whitespace-pre-wrap ${
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
            <div className="bg-slate-100 text-slate-800 px-4 py-3 rounded-lg rounded-bl-sm">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-slate-600">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={chatEndRef}></div>
      </div>

      {/* Input Area */}
      <div className="mt-4 flex gap-2">
        <div className="flex-1 relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about medicine, treatments, diagnoses..."
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-black placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={2}
            disabled={loading}
          />
          <div className="absolute bottom-2 right-2 text-xs text-slate-400">
            {input.length > 0 && `${input.length} chars`}
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors self-end"
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
        ⚠️ This AI assistant provides general information only. Always consult with qualified healthcare professionals for medical decisions.
      </div>
    </div>
  );
}