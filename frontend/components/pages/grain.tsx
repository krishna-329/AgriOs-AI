"use client";
import { useState } from "react";
import { Box, Thermometer, Droplets, Bug, AlertTriangle, Plus, CloudRain } from "lucide-react";
import { EmptyState } from "@/components/cards";

export default function Grain() {
  const [activeTab, setActiveTab] = useState("status");

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 600 }}>GrainGuard</h1>
          <p style={{ color: '#64748b' }}>Protect your harvest. Reduce post-harvest losses.</p>
        </div>
        <button style={{ background: '#16a34a', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} /> Add Storage Unit
        </button>
      </div>

      <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid #e2e8f0', marginBottom: '8px' }}>
        {[
          { id: 'status', label: 'Storage Status' },
          { id: 'quality', label: 'Quality Analysis' },
          { id: 'pest', label: 'Pest Monitoring' },
          { id: 'alerts', label: 'Alerts & Recommendations' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 4px',
              borderBottom: activeTab === tab.id ? '2px solid #16a34a' : '2px solid transparent',
              color: activeTab === tab.id ? '#16a34a' : '#64748b',
              fontWeight: activeTab === tab.id ? 600 : 400,
              background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'status' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {[
              { id: 1, title: 'Storage Bin 1', loc: 'North Plot', cap: 200, curr: 130, pct: 65, cond: 'Good' },
              { id: 2, title: 'Storage Bin 2', loc: 'Main Farm', cap: 150, curr: 90, pct: 60, cond: 'Good' },
              { id: 3, title: 'Storage Warehouse', loc: 'East Plot', cap: 500, curr: 320, pct: 64, cond: 'Good' }
            ].map(b => (
              <div key={b.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', background: 'white' }}>
                <div style={{ height: '140px', background: '#f1f5f9' }}>
                    <img src="/images/silo-generated.png" alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.src = '/images/silo.jpg'; }} />
                </div>
                <div style={{ padding: '16px' }}>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>{b.title}</h3>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>{b.loc}</div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                    <span style={{ color: '#64748b' }}>Capacity</span>
                    <span style={{ fontWeight: 600 }}>{b.cap} tons</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                    <span style={{ color: '#64748b' }}>Current Stock</span>
                    <span style={{ fontWeight: 600 }}>{b.curr} tons ({b.pct}%)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '16px' }}>
                    <span style={{ color: '#64748b' }}>Condition</span>
                    <span style={{ fontWeight: 600, color: '#16a34a' }}>{b.cond}</span>
                  </div>
                  
                  <button style={{ width: '100%', padding: '8px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 500, cursor: 'pointer' }}>
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', background: 'white' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Box size={18} color="#16a34a" /> Storage Conditions - Bin 1
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '24px' }}>Last updated: 14 Apr 2025, 10:30 AM</div>
                
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', fontSize: '12px', fontWeight: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f97316' }}></div> Temperature (°C)</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></div> Humidity (%)</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a' }}></div> Grain Moisture (%)</div>
                </div>

                <div style={{ height: '240px', width: '100%', background: 'white', border: 'none', position: 'relative' }}>
                    <svg width="100%" height="240" preserveAspectRatio="none">
                        <line x1="0" y1="40" x2="100%" y2="40" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="0" y1="80" x2="100%" y2="80" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="0" y1="120" x2="100%" y2="120" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="0" y1="160" x2="100%" y2="160" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="0" y1="200" x2="100%" y2="200" stroke="#e2e8f0" strokeWidth="1" />
                        
                        <text x="0" y="44" fill="#94a3b8" fontSize="10">80</text>
                        <text x="0" y="84" fill="#94a3b8" fontSize="10">60</text>
                        <text x="0" y="124" fill="#94a3b8" fontSize="10">40</text>
                        <text x="0" y="164" fill="#94a3b8" fontSize="10">20</text>
                        <text x="0" y="204" fill="#94a3b8" fontSize="10">0</text>

                        <path d="M 40 120 L 140 125 L 240 115 L 340 122 L 440 118 L 540 125 L 640 115" stroke="#f97316" strokeWidth="2" fill="none" />
                        <path d="M 40 140 L 140 145 L 240 142 L 340 148 L 440 145 L 540 140 L 640 145" stroke="#16a34a" strokeWidth="2" fill="none" />
                        <path d="M 40 80 L 140 75 L 240 85 L 340 70 L 440 80 L 540 75 L 640 85" stroke="#3b82f6" strokeWidth="2" fill="none" />
                    </svg>
                    <div style={{ position: 'absolute', bottom: '10px', left: '40px', right: '0', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
                        <span>8 Apr</span><span>9 Apr</span><span>10 Apr</span><span>11 Apr</span><span>12 Apr</span><span>13 Apr</span><span>14 Apr</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                    { label: "Temperature", val: "24.8°C", stat: "Optimal", color: "#f97316", icon: Thermometer },
                    { label: "Grain Moisture", val: "12.4%", stat: "Optimal", color: "#16a34a", icon: Droplets },
                    { label: "Humidity", val: "58%", stat: "Optimal", color: "#3b82f6", icon: CloudRain },
                    { label: "Insect Activity", val: "Low", stat: "No activity", color: "#16a34a", icon: Bug }
                ].map((s, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', background: 'white' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <s.icon size={20} color={s.color} />
                            <span style={{ fontSize: '14px', fontWeight: 500 }}>{s.label}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 600 }}>{s.val}</div>
                            <div style={{ fontSize: '12px', color: '#16a34a' }}>{s.stat}</div>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
