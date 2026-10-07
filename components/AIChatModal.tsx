import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Sparkles, Trash2, Bot, User, Zap, Target, TrendingUp } from 'lucide-react';
import { Modal } from './ui/GlassComponents';
import { UserProfile, DailyReport } from '../types';
import { sendCoachMessage, getOfflineResponse, ChatMessage, ChatRole } from '../services/aiService';

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  salesData: DailyReport[];
}

const CHAT_STORAGE_KEY = 'salestrack_gemini_chat_history_v2';
const ROLE_STORAGE_KEY = 'salestrack_gemini_chat_role_v2';

const SUGGESTION_PROMPTS: Record<ChatRole, string[]> = {
  general: [
    "Give me an energetic morning sales motivation boost 🚀",
    "How do I pitch a Morphy Richards 60L OTG to a baker? 🍰",
    "Best cross-selling combo with an Induction Cooktop?",
    "How to handle a customer saying 'It's cheaper online'?"
  ],
  fast: [
    "Specs of Morphy Richards Digichef 35L vs 52L?",
    "Key selling points of Bajaj Aerono 3L Instant Geyser?",
    "Warranty details for Bajaj GX15 & Kompact Mixers?",
    "Power consumption of MX 45 Steam Iron?"
  ],
  complex: [
    "Analyze my sales pace against my monthly target 📊",
    "High-margin appliance push strategy for this weekend",
    "Step-by-step objection handling for premium OTGs",
    "How to close indecisive customers looking at Cooktops?"
  ]
};

export const AIChatModal: React.FC<AIChatModalProps> = ({
  isOpen,
  onClose,
  user,
  salesData
}) => {
  const [role, setRole] = useState<ChatRole>(() => {
    const saved = localStorage.getItem(ROLE_STORAGE_KEY);
    return (saved as ChatRole) || 'general';
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [inputMsg, setInputMsg] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync role to localStorage
  useEffect(() => {
    localStorage.setItem(ROLE_STORAGE_KEY, role);
  }, [role]);

  // Sync messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Initial welcome greeting if chat is fresh
  useEffect(() => {
    if (isOpen && messages.length === 0 && user) {
      const firstName = (user.name || 'Executive').split(' ')[0] || 'Executive';
      const welcomeText = role === 'fast'
        ? `Hey ${firstName}! ⚡ I'm your Fast Specs Assistant powered by Gemini Flash-Lite. Need instant specs, wattages, or comparisons? Ask away!`
        : role === 'complex'
        ? `Hello ${firstName}! 📊 I'm your Retail Sales Strategist powered by Gemini Pro. Ready to analyze targets, run rates, and tactical closing plans.`
        : `Hi ${firstName}! 🎯 I'm your Bajaj & Morphy Richards Sales Coach powered by Gemini. How's the floor today? Let's crush your targets! 🚀`;

      setMessages([{
        id: Date.now().toString(),
        role: 'model',
        text: welcomeText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: role === 'fast' ? 'gemini-3.1-flash-lite' : role === 'complex' ? 'gemini-3.1-pro-preview' : 'gemini-3.5-flash'
      }]);
    }
  }, [isOpen, messages.length, user, role]);

  // Auto-scroll to bottom of thread
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMsg).trim();
    if (!text || !user || isTyping) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMsg('');
    setIsTyping(true);

    try {
      const { text: replyText, modelUsed } = await sendCoachMessage(
        user,
        salesData,
        messages,
        text,
        role
      );

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: modelUsed || (role === 'fast' ? 'gemini-3.1-flash-lite' : role === 'complex' ? 'gemini-3.1-pro-preview' : 'gemini-3.5-flash')
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err: any) {
      console.warn("AI Coach network fallback:", err);
      const fallbackText = getOfflineResponse(text, user);
      
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: `${fallbackText}\n\n*(Note: Instant local coach response active)*`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            modelUsed: 'Local Fallback'
          }
        ]);
      }, 500);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearHistory = () => {
    localStorage.removeItem(CHAT_STORAGE_KEY);
    const firstName = (user.name || 'Executive').split(' ')[0] || 'Executive';
    setMessages([{
      id: Date.now().toString(),
      role: 'model',
      text: `Fresh session started, ${firstName}! How can I help you succeed today? ✨`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gemini AI Sales Coach">
      <div className="flex flex-col h-[75vh] sm:h-[580px] max-w-full">
        {/* Role & Model Selector Header */}
        <div className="pb-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Sparkles size={13} className="text-emerald-500 animate-pulse" />
              Assistant Role:
            </span>
            <button
              onClick={handleClearHistory}
              title="Clear chat history"
              className="text-xs text-zinc-500 hover:text-rose-500 dark:text-zinc-400 dark:hover:text-rose-400 flex items-center gap-1 transition-colors px-2 py-0.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Trash2 size={13} />
              <span>Clear</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-2xl">
            <button
              onClick={() => setRole('general')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-semibold transition-all ${
                role === 'general'
                  ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Target size={13} />
              <span className="truncate">Coach</span>
            </button>

            <button
              onClick={() => setRole('fast')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-semibold transition-all ${
                role === 'fast'
                  ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Zap size={13} />
              <span className="truncate">Fast Specs</span>
            </button>

            <button
              onClick={() => setRole('complex')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-semibold transition-all ${
                role === 'complex'
                  ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp size={13} />
              <span className="truncate">Strategy</span>
            </button>
          </div>
        </div>

        {/* Scrollable Message Thread */}
        <div className="flex-1 overflow-y-auto space-y-3.5 p-2 sm:p-3 scrollbar-hide my-1">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id || Math.random().toString()}
                className={`flex gap-2.5 items-end ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-full bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20 mb-1">
                    <Bot size={15} />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm transition-all ${
                    isUser
                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-br-xs'
                      : 'bg-zinc-100 dark:bg-zinc-800/90 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700/60 rounded-bl-xs'
                  }`}
                >
                  {isUser ? (
                    <div className="whitespace-pre-wrap break-words">{msg.text}</div>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-1.5 mt-1.5 opacity-60 text-[10px]">
                    {msg.modelUsed && !isUser && (
                      <span className="font-mono px-1 py-0.2 bg-black/5 dark:bg-white/10 rounded">
                        {msg.modelUsed}
                      </span>
                    )}
                    {msg.timestamp && <span>{msg.timestamp}</span>}
                  </div>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-full bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900 flex items-center justify-center shrink-0 mb-1 text-xs font-bold">
                    <User size={14} />
                  </div>
                )}
              </div>
            );
          })}

          {isTyping && (
            <div className="flex gap-2.5 items-end justify-start">
              <div className="w-7 h-7 rounded-full bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20 mb-1">
                <Bot size={15} />
              </div>
              <div className="bg-zinc-100 dark:bg-zinc-800/90 px-4 py-3 rounded-2xl rounded-bl-xs text-xs text-zinc-500 flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-700">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="ml-1 text-[11px] text-zinc-400">Thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        {messages.length <= 4 && (
          <div className="py-2 overflow-x-auto no-scrollbar flex gap-1.5 shrink-0">
            {SUGGESTION_PROMPTS[role].map((prompt, idx) => (
              <button
                key={idx}
                disabled={isTyping}
                onClick={() => handleSendMessage(prompt)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 transition-colors shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input Form */}
        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex gap-2 items-center"
          >
            <input
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              placeholder={
                role === 'fast'
                  ? 'Ask for instant specs, wattage, model comparisons...'
                  : role === 'complex'
                  ? 'Ask for target pacing, run rate, closing tactics...'
                  : 'Ask for pitch tips, objection handling, motivation...'
              }
              disabled={isTyping}
              className="flex-1 bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
            />
            <button
              type="submit"
              disabled={isTyping || !inputMsg.trim()}
              className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl disabled:opacity-40 disabled:hover:bg-emerald-600 transition-colors shrink-0 shadow-sm"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </Modal>
  );
};

export default AIChatModal;
