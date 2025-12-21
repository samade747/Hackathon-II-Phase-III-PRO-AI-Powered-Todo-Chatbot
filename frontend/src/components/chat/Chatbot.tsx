'use client';

import { useState } from 'react';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ sender: 'user' | 'bot'; text: string }[]>([]);
  const [inputValue, setInputValue] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const toggleChat = () => setIsOpen(!isOpen);

  const handleSendMessage = async () => {
    if (inputValue.trim()) {
      const newUserMessage = { sender: 'user' as const, text: inputValue };
      setMessages(prevMessages => [...prevMessages, newUserMessage]);
      setInputValue('');
      setIsLoading(true);

      try {
        const response = await fetch('/api/agent/dispatch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: '123', // Hardcoded for now
            utterance: inputValue,
          }),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        const botMessage = { sender: 'bot' as const, text: data.result.message };
        setMessages(prevMessages => [...prevMessages, botMessage]);

      } catch (error) {
        console.error('Error sending message:', error);
        const errorMessage = { sender: 'bot' as const, text: 'Sorry, something went wrong.' };
        setMessages(prevMessages => [...prevMessages, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div>
      <button
        onClick={toggleChat}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50"
        aria-label="Toggle chat"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.745A9.025 9.025 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-4 w-96 h-[500px] bg-white rounded-lg shadow-xl flex flex-col">
          <div className="p-4 bg-blue-600 text-white rounded-t-lg">
            <h2 className="text-lg font-semibold">AI Todo Chatbot</h2>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            {messages.map((msg, index) => (
              <div key={index} className={`my-2 p-2 rounded-lg ${msg.sender === 'user' ? 'bg-blue-100 text-right' : 'bg-gray-200'}`}>
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div className="my-2 p-2 rounded-lg bg-gray-200">
                ...
              </div>
            )}
          </div>
          <div className="p-4 border-t">
            <div className="flex">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Type a message..."
              />
              <button
                onClick={handleSendMessage}
                className="bg-blue-600 text-white p-2 rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
