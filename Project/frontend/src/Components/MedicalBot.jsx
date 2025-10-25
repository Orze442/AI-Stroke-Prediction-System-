import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import '../App.css';

function MedicalBot({ role }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const location = useLocation();

  // Extract patient_id from URL
  const queryParams = new URLSearchParams(location.search);
  const patientId = queryParams.get('patient_id');

  // Track if fetchInsight has already run
  const hasFetched = useRef(false);

  // Auto-load message if patient_id is present
  useEffect(() => {
    const fetchInsight = async () => {
      console.log('Fetching insight for', patientId);
      if (!patientId) return;

      const systemMsg = { sender: 'user', text: `Get insights for patient ${patientId}` };
      setMessages((prev) => [...prev, systemMsg]);

      try {
        const res = await fetch(`http://localhost:8000/chatbot/clinical-insight/${patientId}`);
        const data = await res.json();

        if (data.error) {
          setMessages((prev) => [...prev, { sender: 'bot', text: `Error: ${data.error}` }]);
                } else {
          const sourceList = data.source?.map((src, i) => `• ${src}`).join('\n') || null;

          const newMessages = [
            { sender: 'bot', text: `📋 Patient Summary:\n${data.summary}` },
            { sender: 'bot', text: data.answer }
          ];

          if (sourceList) {
            newMessages.push({ sender: 'bot', text: `📚 Sources:\n${sourceList}` });
          }

          setMessages((prev) => [...prev, ...newMessages]);
        }
      } catch (error) {
        setMessages((prev) => [...prev, { sender: 'bot', text: 'Failed to fetch insight.' }]);
      }
    };

    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchInsight();
    }
  }, [patientId]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      const response = await fetch('http://localhost:8000/chatbot/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: input,}),
      });

      const data = await response.json();
      const botReply = { sender: 'bot', text: data.answer };
      const sourceList = data.source?.map((src, i) => `• ${src}`).join('\n') || null;

      setMessages((prev) => {
        const updated = [...prev, botReply];
        if (sourceList) {
           updated.push({ sender: 'bot', text: `📚 Sources:\n${sourceList}` });
        }
         return updated;
        });
    } catch (error) {
      setMessages((prev) => [...prev, { sender: 'bot', text: 'Failed to get response.' }]);
    }
  };

  return (
    <div className="bot-container">
      <div className="chat-box">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`chat-message ${msg.sender === 'user' ? 'user-msg' : 'bot-msg'}`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask a question as ${role}...`}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default MedicalBot;
