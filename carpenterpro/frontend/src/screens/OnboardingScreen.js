import React, { useState } from 'react';

export default function OnboardingScreen({ onNext }) {
    const [bizName, setBizName] = useState('');
    const [zip, setZip] = useState('');

    return (
        <div style={{ padding: 24, maxWidth: 400, margin: '0 auto' }}>
            <h1>⚒️ CarpenterPro</h1>
            <p style={{ color: '#555' }}>Ditch the desktop. Build accurate framing & carpentry estimates directly from your phone in under 60 seconds.</p>
            <label style={{ display: 'block', marginTop: 16, fontWeight: 'bold' }}>Business Name</label>
            <input type="text" placeholder="e.g. BECK BUILDER" value={bizName} onChange={e => setBizName(e.target.value)} style={{ width: '100%', padding: 10, marginTop: 4, borderRadius: 4, border: '1px solid #ccc' }} />
            <label style={{ display: 'block', marginTop: 16, fontWeight: 'bold' }}>Local Target ZIP Code</label>
            <input type="text" placeholder="e.g. 62568" value={zip} onChange={e => setZip(e.target.value)} style={{ width: '100%', padding: 10, marginTop: 4, borderRadius: 4, border: '1px solid #ccc' }} />
            <button onClick={() => onNext({ bizName, zip })} style={{ width: '100%', padding: 12, background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 4, marginTop: 24, fontWeight: 'bold', cursor: 'pointer' }}>
                LET'S BUILD AN ESTIMATE →
            </button>
        </div>
    );
}
