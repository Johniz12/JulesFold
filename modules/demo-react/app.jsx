import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

export function ReactDemoApp() {
  const [messages, setMessages] = useState([]);
  const [subStatus, setSubStatus] = useState('Connecting to host broker...');

  useEffect(() => {
    let subId = null;

    async function initSubscription() {
      if (!window.alfred || !window.alfred.events) {
        setSubStatus('Host alfred.events API unavailable');
        return;
      }

      try {
        subId = await window.alfred.events.subscribe('demo.message', (envelope) => {
          setMessages((prev) => [
            {
              id: Date.now() + Math.random(),
              text: envelope.payload?.text || 'Empty message',
              source: envelope.sourceModuleId,
              time: new Date(envelope.timestamp).toLocaleTimeString(),
            },
            ...prev,
          ]);
        });
        setSubStatus(`Subscribed to "demo.message" (ID: ${subId})`);
      } catch (err) {
        setSubStatus(`Subscription error: ${err.message}`);
      }
    }

    initSubscription();

    return () => {
      if (subId && window.alfred && window.alfred.events) {
        window.alfred.events.unsubscribe(subId);
      }
    };
  }, []);

  return (
    <div className="react-app">
      <header className="react-header">
        <h2>React Demo</h2>
        <span className="react-badge">AMCS v1 Subscriber</span>
      </header>
      <p className="react-desc">
        This module is an independent React application that subscribes to events published via ALFRED central broker.
      </p>
      <div className="subscription-card">
        <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Topic: demo.message</span>
        <span className="sub-status">{subStatus}</span>
      </div>
      <div className="messages-container">
        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#cbd5e1' }}>Received Messages:</h4>
        {messages.length === 0 ? (
          <div className="no-messages">Waiting for messages from other modules...</div>
        ) : (
          <div className="messages-list">
            {messages.map((m) => (
              <div key={m.id} className="message-item">
                <div className="msg-header">
                  <span>From: {m.source}</span>
                  <span>{m.time}</span>
                </div>
                <div className="msg-text">{m.text}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<ReactDemoApp />);
}
