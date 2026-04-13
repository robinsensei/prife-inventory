import React from 'react';
import { KPIHelper } from '../../utils/dataProcessing';

const KPIProductCards = ({ products, records }) => {
  const activeProducts = products.filter(p => p.in + p.out > 0);

  return (
    <div style={{ marginTop: '30px' }}>
      <h3 style={{ textAlign: 'center', color: '#e2e8f0', marginBottom: '20px', fontSize: '1.4rem', fontWeight: '600' }}>
        Product Output Metrics (Current vs Previous Month)
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {activeProducts.map(ps => {
          const kpi = KPIHelper.getProductKpiMetrics(records, ps.product);
          
          const outDiff = kpi.currentOut - kpi.prevOut;
          const inDiff = kpi.currentIn - kpi.prevIn;
          
          return (
            <div key={ps.product} className="stat-card" style={{ padding: '20px', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '10px' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: '600', color: '#38bdf8' }}>{ps.product}</span>
              </div>
              
              {/* MAIN METRIC: CURRENT OUT */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#ef4444' }}>{kpi.currentOut}</span>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>OUT ({kpi.currentMonthStr})</span>
              </div>
              
              {/* VARIANCE INDICATOR: OUT */}
              <div style={{ marginTop: '5px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                {outDiff > 0 ? (
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>▲ {outDiff}</span>
                ) : outDiff < 0 ? (
                  <span style={{ color: '#ef4444', fontWeight: 'bold' }}>▼ {Math.abs(outDiff)}</span>
                ) : (
                  <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>— 0</span>
                )}
                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>vs {kpi.prevMonthStr} ({kpi.prevOut})</span>
              </div>

              <hr style={{ width: '100%', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', margin: '15px 0' }} />

              {/* SECONDARY METRIC: CURRENT IN */}
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <div>
                  <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#10b981' }}>{kpi.currentIn}</span>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginLeft: '5px' }}>IN</span>
                </div>
                
                <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#94a3b8' }}>
                  {inDiff > 0 ? (
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>▲ {inDiff}</span>
                  ) : inDiff < 0 ? (
                    <span style={{ color: '#ef4444', fontWeight: 'bold' }}>▼ {Math.abs(inDiff)}</span>
                  ) : (
                    <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>— 0</span>
                  )} vs prev ({kpi.prevIn})
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KPIProductCards;
