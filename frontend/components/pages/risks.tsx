"use client";
import { useState } from "react";
import { CloudRain, Bug, Leaf, TrendingDown, Info, ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/cards";

export default function Risks() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 600 }}>Risk Center</h1>
          <p style={{ color: '#64748b' }}>Stay ahead with AI-powered risk predictions.</p>
        </div>
        <select style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', fontWeight: 500 }}>
          <option>Next 30 Days</option>
          <option>Next 7 Days</option>
          <option>This Season</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid #e2e8f0', marginBottom: '8px' }}>
        {[
          { id: 'overview', label: 'Risk Overview' },
          { id: 'weather', label: 'Weather Risks' },
          { id: 'pest', label: 'Pest & Disease' },
          { id: 'market', label: 'Market Risks' }
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

      {activeTab === 'overview' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {[
              { icon: CloudRain, title: "Weather Risk", level: "Low", desc: "No major threats", color: "#16a34a", bg: "#dcfce7" },
              { icon: Bug, title: "Pest Risk", level: "Medium", desc: "Monitor closely", color: "#eab308", bg: "#fef08a" },
              { icon: Leaf, title: "Disease Risk", level: "Low", desc: "Under control", color: "#16a34a", bg: "#dcfce7" },
              { icon: TrendingDown, title: "Market Risk", level: "Medium", desc: "Price volatility", color: "#eab308", bg: "#fef08a" }
            ].map((r, i) => (
              <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', background: 'white', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <r.icon size={24} color={r.color} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>{r.title}</div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: r.color }}>{r.level}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>{r.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
            <div className="panel" style={{ padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                <TrendingDown size={20} color="#16a34a" />
                <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Risk Forecast</h2>
              </div>
              
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', fontSize: '12px', fontWeight: 500 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></div> Weather</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></div> Pest & Disease</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#eab308' }}></div> Market</div>
              </div>

              <div style={{ height: '240px', width: '100%', background: 'white', position: 'relative' }}>
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

                      {/* Fake lines */}
                      <path d="M 40 180 L 120 170 L 200 150 L 280 160 L 360 170 L 440 160 L 520 180" stroke="#3b82f6" strokeWidth="2" fill="none" />
                      <path d="M 40 120 L 120 110 L 200 130 L 280 100 L 360 80 L 440 90 L 520 110" stroke="#ef4444" strokeWidth="2" fill="none" />
                      <path d="M 40 160 L 120 150 L 200 140 L 280 120 L 360 140 L 440 130 L 520 150" stroke="#eab308" strokeWidth="2" fill="none" />
                  </svg>
                  <div style={{ position: 'absolute', bottom: '10px', left: '40px', right: '0', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
                      <span>14 Apr</span><span>22 Apr</span><span>30 Apr</span><span>8 May</span><span>16 May</span><span>24 May</span><span>1 Jun</span>
                  </div>
                  <div style={{ position: 'absolute', left: '-20px', top: '100px', transform: 'rotate(-90deg)', fontSize: '10px', color: '#94a3b8' }}>Risk Level</div>
              </div>
            </div>

            <div className="panel" style={{ padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                <ShieldAlert size={20} color="#16a34a" />
                <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Recommendations</h2>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { icon: Leaf, text: "Apply preventive fungicide for possible leaf blight risk.", level: "Medium", color: "#f97316", bg: "#ffedd5" },
                  { icon: CloudRain, text: "Monitor rainfall in next 7 days (heavy rain expected).", level: "Low", color: "#16a34a", bg: "#dcfce7" },
                  { icon: TrendingDown, text: "Consider forward booking for better market price.", level: "Medium", color: "#f97316", bg: "#ffedd5" },
                  { icon: Bug, text: "Check for early signs of stem borer in maize.", level: "Low", color: "#16a34a", bg: "#dcfce7" }
                ].map((rec, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', paddingBottom: '16px', borderBottom: i === 3 ? 'none' : '1px solid #f1f5f9' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <rec.icon size={16} color="#64748b" />
                    </div>
                    <div style={{ flex: 1, fontSize: '13px', lineHeight: '1.4' }}>{rec.text}</div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: rec.color, background: rec.bg, padding: '2px 8px', borderRadius: '12px', border: `1px solid ${rec.color}40` }}>
                      {rec.level}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
