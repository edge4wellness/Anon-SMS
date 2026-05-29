import React, { useState } from 'react';

export default function SaveProgressModal({ isOpen, onSave, onClose }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    if (!isOpen) return null;

    return (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#1a1a1a', color: '#fff', padding: 24, borderTopLeftRadius: 16, borderTopRightRadius: 16, boxShadow: '0 -4px 10px rgba(0,0,0,0.3)', zIndex: 1000 }}>
            <h2 style={{ margin: '0 0 8px 0' }}>🔒 Secure Your Progress</h2>
            <p style={{ color: '#ccc', fontSize: 14, marginBottom: 16 }}>
                Nice work. Your estimate is fully calculated using live regional pricing. Enter an email and password to lock in this record and claim your first 3 free projects.
            </p>
            <input type="email" placeholder="Your Email Address" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: 10, margin: '8px 0', borderRadius: 4, border: 'none' }} />
            <input type="password" placeholder="Create Password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: 10, margin: '8px 0', borderRadius: 4, border: 'none' }} />
            <button onClick={() => onSave(email, password)} style={{ width: '100%', padding: 12, background: '#2e7d32', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 'bold', marginTop: 12, cursor: 'pointer' }}>
                💥 SECURE MY ACCOUNT & SAVE BID
            </button>
            <button onClick={onClose} style={{ width: '100%', padding: 8, background: 'none', color: '#aaa', border: 'none', marginTop: 8, cursor: 'pointer', fontSize: 12 }}>Cancel</button>
        </div>
    );
}
