import React, { useEffect, useMemo, useRef, useState } from 'react';

const SUGGESTED_QUESTIONS = [
  'How do I add a subscription?',
  'Why do I see Access denied?',
  'How are email alerts sent?',
  'How do I edit or delete a subscription?',
  'What plans are available for Zee5 and SunNXT?'
];

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'bot',
      text:
        'Hi! I\'m Subscribely Assistant. Ask me about adding subscriptions, renewals, alerts, or troubleshooting.'
    }
  ]);

  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const faqs = useMemo(
    () => [
      {
        id: 'add-sub',
        match: ['add subscription', 'new subscription', 'how add', 'create subscription'],
        answer:
          'Go to Add tab, choose a service, pick a plan and duration. Required fields are Service Name, Plan, Price, and Renewal Date. Then click Add Subscription.'
      },
      {
        id: 'access-denied',
        match: ['access denied', 'no token', 'authorization', 'logged out'],
        answer:
          'This happens when you are not authenticated. Please Sign up or Log in first. After login, a token is stored and all protected actions (like adding subscriptions) will work.'
      },
      {
        id: 'email-alerts',
        match: ['email alerts', 'automatic email', 'renewal reminder', 'daily email'],
        answer:
          'Renewal reminder emails are sent automatically every day at 10:00 AM to the logged-in user\'s email for any active subscriptions expiring within 7 days (or already expired). Ensure SMTP is configured in the backend.'
      },
      {
        id: 'edit-delete',
        match: ['edit subscription', 'delete subscription', 'update subscription'],
        answer:
          'Open the List tab. Use the Edit button to update fields and Save. Use the Delete button to remove a subscription.'
      },
      {
        id: 'plans',
        match: ['zee5', 'sunnxt', 'plans', 'pricing'],
        answer:
          'Zee5: Mobile, Premium, Premium 4K, Annual Premium. SunNXT: Mobile, Standard, Premium, Annual Premium. Netflix offers Basic, Standard, Premium.'
      },
      {
        id: 'backend-down',
        match: ['server not running', 'backend not running', 'failed to connect'],
        answer:
          'Please ensure the backend server is running on http://localhost:5000 and that CORS and environment variables are configured.'
      }
    ],
    []
  );

  async function findAnswer(question) {
    const q = normalize(question);
    for (const f of faqs) {
      const hits = f.match.filter((m) => q.includes(normalize(m)) || normalize(m).includes(q));
      if (hits.length > 0) return f.answer;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch((process.env.REACT_APP_API_URL || 'http://localhost:5000/api') + '/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ message: question })
      });
      const data = await res.json();
      if (data.success && data.reply) return data.reply;
      if (!data.success && data.message) return data.message;
    } catch (_) {}
    return "Sorry, I couldn't find an exact answer right now.";
  }

  async function submit(text) {
    const userText = text ?? input;
    if (!normalize(userText)) return;

    const id = Date.now();
    setMessages((prev) => [
      ...prev,
      { id: `u-${id}`, role: 'user', text: userText },
      { id: `b-${id + 1}`, role: 'bot', text: 'Thinking…' }
    ]);
    const reply = await findAnswer(userText);
    setMessages((prev) => prev.map(m => m.id === `b-${id + 1}` ? { ...m, text: reply } : m));
    setInput('');
  }

  const styles = {
    fab: {
      position: 'fixed',
      right: 20,
      bottom: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      border: 'none',
      background: '#4f46e5',
      color: '#fff',
      cursor: 'pointer',
      boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
      fontSize: 18,
      zIndex: 1000
    },
    panel: {
      position: 'fixed',
      right: 20,
      bottom: 90,
      width: 340,
      maxHeight: 480,
      background: '#fff',
      borderRadius: 12,
      boxShadow: '0 16px 40px rgba(0,0,0,0.2)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      zIndex: 1000
    },
    header: {
      padding: '12px 16px',
      background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
      color: '#fff',
      fontWeight: 600
    },
    body: {
      padding: 12,
      overflowY: 'auto',
      background: '#f8fafc',
      flex: 1
    },
    msg: {
      margin: '6px 0',
      padding: '10px 12px',
      borderRadius: 10,
      maxWidth: '85%',
      lineHeight: 1.35,
      fontSize: 14
    },
    user: {
      alignSelf: 'flex-end',
      background: '#e0e7ff',
      color: '#1e3a8a'
    },
    bot: {
      alignSelf: 'flex-start',
      background: '#ffffff',
      color: '#111827',
      border: '1px solid #e5e7eb'
    },
    inputRow: {
      display: 'flex',
      gap: 8,
      padding: 12,
      borderTop: '1px solid #e5e7eb',
      background: '#fff'
    },
    input: {
      flex: 1,
      border: '1px solid #e5e7eb',
      borderRadius: 8,
      padding: '10px 12px',
      outline: 'none'
    },
    send: {
      border: 'none',
      background: '#4f46e5',
      color: '#fff',
      padding: '10px 14px',
      borderRadius: 8,
      cursor: 'pointer'
    },
    suggestions: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
      padding: '8px 12px 12px'
    },
    pill: {
      border: '1px solid #e5e7eb',
      background: '#fff',
      color: '#111827',
      borderRadius: 999,
      padding: '6px 10px',
      fontSize: 12,
      cursor: 'pointer'
    }
  };

  return (
    <>
      {isOpen && (
        <div style={styles.panel}>
          <div style={styles.header}>Subscribely Assistant</div>
          <div style={styles.body}>
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  ...styles.msg,
                  ...(m.role === 'user' ? styles.user : styles.bot)
                }}
              >
                {m.text}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div style={styles.suggestions}>
            {SUGGESTED_QUESTIONS.map((q) => (
              <button key={q} style={styles.pill} onClick={() => submit(q)}>
                {q}
              </button>
            ))}
          </div>
          <div style={styles.inputRow}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit();
              }}
              placeholder="Type your question..."
              style={styles.input}
            />
            <button style={styles.send} onClick={() => submit()}>Send</button>
          </div>
        </div>
      )}
      <button
        aria-label="Open chatbot"
        style={styles.fab}
        onClick={() => setIsOpen((v) => !v)}
        title={isOpen ? 'Close chat' : 'Chat with us'}
      >
        {isOpen ? '×' : '💬'}
      </button>
    </>
  );
}

export default Chatbot;


