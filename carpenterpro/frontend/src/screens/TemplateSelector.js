import React from 'react';

const TEMPLATES = [
    { id: 'BLU-001', title: 'Deck Construction', desc: 'Standard 12x16 Pressure Treated Deck' },
    { id: 'BLU-002', title: 'Framing Run', desc: 'Standard partition or load-bearing wall framing' },
    { id: 'BLU-003', title: 'Finish Trim / Baseboard', desc: 'Linear run trimming and installation templates' },
    { id: 'BLU-004', title: 'Wood & LVP Flooring', desc: 'Square footage estimation models for click-lock systems' }
];

export default function TemplateSelector({ onSelect }) {
    return (
        <div style={{ padding: 24, maxWidth: 400, margin: '0 auto' }}>
            <h2>🪵 Choose Your Project Blueprint</h2>
            <p style={{ color: '#666', marginBottom: 16 }}>Select a configuration layout to automatically load material schedules and labor components.</p>
            {TEMPLATES.map(tmpl => (
                <div key={tmpl.id} onClick={() => onSelect(tmpl)} style={{ padding: 16, border: '2px solid #eee', borderRadius: 8, marginBottom: 12, cursor: 'pointer', backgroundColor: '#fafafa' }}>
                    <h4 style={{ margin: 0, color: '#333' }}>{tmpl.title}</h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#666' }}>{tmpl.desc}</p>
                </div>
            ))}
        </div>
    );
}
