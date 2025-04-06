import React, { useState, useRef, useEffect } from 'react';
import { streamCopilot } from '../api';

const DanPanel: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);

    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
    const assistantMessageIndex = messages.length + 1;

    setIsLoading(true);
    const userInput = input;
    setInput('');

    try {
      streamCopilot(
        userInput,
        (chunk) => {
          setMessages(prev => {
            const updated = [...prev];
            if (updated[assistantMessageIndex]) {
              updated[assistantMessageIndex] = {
                ...updated[assistantMessageIndex],
                content: updated[assistantMessageIndex].content + chunk
              };
            }
            return updated;
          });
        },
        () => {
          setIsLoading(false);
        },
        (error) => {
          console.error('Streaming error:', error);
          setIsLoading(false);
          setMessages(prev => [
            ...prev,
            { role: 'system', content: `Error: ${error.message}` }
          ]);
        }
      );
    } catch (error) {
      console.error('Error submitting message:', error);
      setIsLoading(false);
      setMessages(prev => [
        ...prev,
        { role: 'system', content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }
      ]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 text-white">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, index) => (
          <div key={index} className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block p-3 rounded-lg ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white'
                : msg.role === 'system'
                ? 'bg-red-600 text-white'
                : 'bg-gray-700 text-white'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
        <div className="flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-gray-700 text-white p-2 rounded-l-lg focus:outline-none"
            placeholder={isLoading ? "D.A.N. is thinking..." : "Ask D.A.N. something..."}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700 focus:outline-none disabled:opacity-50"
          >
            {isLoading ? "..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DanPanel;
