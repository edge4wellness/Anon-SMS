import React from 'react';

export default function ProjectCard({ project, onSelect }) {
    return (
        <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 8, margin: '8px 0', backgroundColor: '#fff' }} onClick={onSelect}>
            <h3>📋 {project.customer_name || "Unnamed Walking Estimate"}</h3>
            <p style={{ margin: '4px 0', color: '#666' }}>📍 {project.customer_address || "No address listed"}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                <span style={{ background: '#eee', padding: '4px 8px', borderRadius: 4, fontSize: 12 }}>{project.project_type}</span>
                <strong style={{ color: '#2e7d32' }}>${project.total_bid.toFixed(2)}</strong>
            </div>
        </div>
    );
}
