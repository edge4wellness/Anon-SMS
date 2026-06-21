import React, { useEffect, useReducer, useState, useMemo } from 'react';
import { localCache } from '../database/localCache';
import { pushPendingChanges } from '../database/syncEngine';
import { calculateProjectTotal } from '../utils/calcEngine';
import SaveProgressModal from '../components/SaveProgressModal';

// ── Reducer ───────────────────────────────────────────────────────────────────

function reducer(state, action) {
    switch (action.type) {
        case 'LOAD':
            return action.payload;
        case 'UPDATE_MATERIAL': {
            const { materialId, field, value } = action;
            return {
                ...state,
                materials: state.materials.map(m =>
                    m.material_id === materialId ? { ...m, [field]: value } : m
                ),
            };
        }
        case 'UPDATE_LABOR': {
            const { laborId, field, value } = action;
            return {
                ...state,
                labor: state.labor.map(l =>
                    l.labor_id === laborId ? { ...l, [field]: value } : l
                ),
            };
        }
        default:
            return state;
    }
}

const EMPTY = { sections: [], materials: [], labor: [] };

// ── Component ─────────────────────────────────────────────────────────────────

export default function EstimatorDashboard({ project, authToken, onBack }) {
    const [state, dispatch] = useReducer(reducer, EMPTY);
    const [dirty, setDirty] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        const { sections, materials, labor } = localCache.getSaveState();
        dispatch({ type: 'LOAD', payload: { sections, materials, labor } });
    }, [project.project_id]);

    const calc = useMemo(() => {
        if (!state.sections.length) return null;
        return calculateProjectTotal(
            project,
            state.sections,
            state.materials,
            state.labor,
            project.markup_percent ?? 20
        );
    }, [project, state]);

    const lumpSumById = useMemo(() => {
        if (!calc) return {};
        return Object.fromEntries(
            calc.client_proposal_view.sections.map(s => [s.section_id, s.lump_sum_price])
        );
    }, [calc]);

    function updateMaterial(materialId, field, value) {
        dispatch({ type: 'UPDATE_MATERIAL', materialId, field, value });
        setDirty(true);
    }

    function updateLabor(laborId, field, value) {
        dispatch({ type: 'UPDATE_LABOR', laborId, field, value });
        setDirty(true);
    }

    function persistLocally() {
        if (!calc) return;
        const updatedProject = { ...project, ...calc.database_update };
        localCache.saveProjectOffline(updatedProject, state.sections, state.materials, state.labor);
        setDirty(false);
    }

    async function handleSaveAccount(email, password) {
        persistLocally();
        setSyncing(true);
        try {
            const { pushed } = await pushPendingChanges(authToken);
            console.log(`Account secured. ${pushed} project(s) synced.`);
        } catch (e) {
            console.error('Sync error:', e.message);
        } finally {
            setSyncing(false);
            setModalOpen(false);
        }
    }

    function handleBack() {
        if (dirty) setModalOpen(true);
        else onBack();
    }

    // Group by section_id for rendering
    const materialsBySection = {};
    const laborBySection = {};
    state.materials.forEach(m => { (materialsBySection[m.section_id] ??= []).push(m); });
    state.labor.forEach(l => { (laborBySection[l.section_id] ??= []).push(l); });

    const grandTotal = calc?.client_proposal_view.grand_total ?? 0;
    const totalMaterials = calc?.database_update.total_materials_cost ?? 0;
    const totalLabor = calc?.database_update.total_labor_cost ?? 0;

    return (
        <div style={{ maxWidth: 480, margin: '0 auto', fontFamily: 'sans-serif' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #eee', background: '#fff', position: 'sticky', top: 0, zIndex: 10 }}>
                <button onClick={handleBack} style={{ background: 'none', border: 'none', color: '#1a73e8', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
                    ← Back
                </button>
                <strong style={{ fontSize: 15 }}>{project.customer_name || 'New Estimate'}</strong>
                <button onClick={() => { persistLocally(); setModalOpen(true); }} disabled={syncing} style={{ background: 'none', border: 'none', color: syncing ? '#aaa' : '#1a73e8', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
                    {syncing ? 'Saving…' : '💾 Save'}
                </button>
            </div>

            {/* Bid banner */}
            <div style={{ background: '#1a73e8', color: '#fff', padding: '14px 16px', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 6 }}>
                    <div>
                        <div style={{ fontSize: 11, opacity: 0.8 }}>Materials</div>
                        <div style={{ fontWeight: 700 }}>${totalMaterials.toFixed(2)}</div>
                    </div>
                    <div style={{ opacity: 0.3 }}>|</div>
                    <div>
                        <div style={{ fontSize: 11, opacity: 0.8 }}>Labor</div>
                        <div style={{ fontWeight: 700 }}>${totalLabor.toFixed(2)}</div>
                    </div>
                    <div style={{ opacity: 0.3 }}>|</div>
                    <div>
                        <div style={{ fontSize: 11, opacity: 0.8 }}>Total Bid</div>
                        <div style={{ fontWeight: 800, fontSize: 20 }}>${grandTotal.toFixed(2)}</div>
                    </div>
                </div>
                <div style={{ fontSize: 11, opacity: 0.6 }}>
                    {project.markup_percent ?? 20}% markup · client sees lump sum per section
                </div>
            </div>

            {/* Section cards */}
            <div style={{ padding: 16 }}>
                {state.sections.map(section => {
                    const mats = materialsBySection[section.section_id] ?? [];
                    const labs = laborBySection[section.section_id] ?? [];
                    const lumpSum = lumpSumById[section.section_id] ?? 0;

                    return (
                        <div key={section.section_id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 16, marginBottom: 12 }}>

                            {/* Section header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <strong style={{ fontSize: 15 }}>{section.area_name}</strong>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: 10, color: '#aaa', fontWeight: 600 }}>CLIENT PRICE</div>
                                    <div style={{ fontSize: 17, fontWeight: 800, color: '#2e7d32' }}>${lumpSum.toFixed(2)}</div>
                                </div>
                            </div>

                            {/* Materials */}
                            {mats.length > 0 && (
                                <>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', letterSpacing: 1, marginBottom: 6 }}>MATERIALS</div>
                                    {mats.map(m => (
                                        <div key={m.material_id} style={{ marginBottom: 10 }}>
                                            <div style={{ fontSize: 13, color: '#333', marginBottom: 4 }}>{m.item_name}</div>
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontSize: 10, color: '#999' }}>Qty</div>
                                                    <input type="number" value={m.qty} onChange={e => updateMaterial(m.material_id, 'qty', parseFloat(e.target.value) || 0)}
                                                        style={{ width: 60, padding: '4px 6px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, textAlign: 'center' }} />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: 10, color: '#999' }}>$/unit</div>
                                                    <input type="number" value={m.unit_cost} onChange={e => updateMaterial(m.material_id, 'unit_cost', parseFloat(e.target.value) || 0)}
                                                        style={{ width: 70, padding: '4px 6px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, textAlign: 'center' }} />
                                                </div>
                                                <strong style={{ marginLeft: 'auto', color: '#555', fontSize: 13 }}>
                                                    ${(m.qty * m.unit_cost).toFixed(2)}
                                                </strong>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}

                            {/* Labor */}
                            {labs.length > 0 && (
                                <>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', letterSpacing: 1, marginTop: 10, marginBottom: 6 }}>LABOR</div>
                                    {labs.map(l => (
                                        <div key={l.labor_id} style={{ marginBottom: 10 }}>
                                            <div style={{ fontSize: 13, color: '#333', marginBottom: 4 }}>{l.task_description}</div>
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontSize: 10, color: '#999' }}>Crew</div>
                                                    <input type="number" value={l.crew_size} onChange={e => updateLabor(l.labor_id, 'crew_size', parseFloat(e.target.value) || 0)}
                                                        style={{ width: 50, padding: '4px 6px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, textAlign: 'center' }} />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: 10, color: '#999' }}>Hrs</div>
                                                    <input type="number" value={l.hours_estimated} onChange={e => updateLabor(l.labor_id, 'hours_estimated', parseFloat(e.target.value) || 0)}
                                                        style={{ width: 55, padding: '4px 6px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, textAlign: 'center' }} />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: 10, color: '#999' }}>$/hr</div>
                                                    <input type="number" value={l.hourly_rate} onChange={e => updateLabor(l.labor_id, 'hourly_rate', parseFloat(e.target.value) || 0)}
                                                        style={{ width: 60, padding: '4px 6px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, textAlign: 'center' }} />
                                                </div>
                                                <strong style={{ marginLeft: 'auto', color: '#555', fontSize: 13 }}>
                                                    ${(l.crew_size * l.hours_estimated * l.hourly_rate).toFixed(2)}
                                                </strong>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Save Progress Modal — doubles as account creation gate */}
            <SaveProgressModal
                isOpen={modalOpen}
                onSave={handleSaveAccount}
                onClose={() => setModalOpen(false)}
            />
        </div>
    );
}
