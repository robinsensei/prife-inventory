import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import KPIProductCards from './KPIProductCards';

const PIE_COLORS = ['#38bdf8', '#818cf8', '#f472b6', '#34d399', '#fbbf24', '#fb7185', '#a78bfa', '#2dd4bf', '#fca5a5', '#c084fc', '#94a3b8', '#10b981', '#6366f1'];

const GraphsDashboard = ({ records, productSummary }) => {
  // Aggregate Total IN and Total OUT for Pie Chart
  const pieDataInOut = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    records.forEach(r => {
      if (r.type === 'IN') totalIn += r.quantity;
      if (r.type === 'OUT') totalOut += r.quantity;
    });
    return [
      { name: 'Total IN', value: totalIn },
      { name: 'Total OUT', value: totalOut }
    ];
  }, [records]);

  // Balance Distribution Pie Chart Data
  const pieDataProducts = useMemo(() => {
    return productSummary
      .filter(ps => ps.balance > 0)
      .map(ps => ({ name: ps.product, value: ps.balance }))
      .sort((a, b) => b.value - a.value);
  }, [productSummary]);

  // Product Cumulative Transaction Volume Pie Chart Data
  const pieDataProductVolume = useMemo(() => {
    return productSummary
      .filter(ps => (ps.in + ps.out) > 0)
      .map(ps => ({ name: ps.product, value: ps.in + ps.out }))
      .sort((a, b) => b.value - a.value);
  }, [productSummary]);

  // Data for the Graph based on records (Product Level)
  const graphData = useMemo(() => {
     return productSummary.map(ps => ({
      name: ps.product,
      "Beg Bal": ps.begBal,
      "Extra IN": ps.in,
      "OUT": ps.out
    }));
  }, [productSummary]);

  // Group by Month for Transaction Vol
  const monthlyGraphData = useMemo(() => {
    const map = {};
    records.forEach(r => {
      const dateStr = String(r.date).split('T')[0];
      const monthYear = new Date(dateStr).toLocaleString('en-US', { month: 'short', year: 'numeric' });
      if (!map[monthYear]) {
        map[monthYear] = { name: monthYear, IN: 0, OUT: 0 };
      }
      if (r.type === 'IN') map[monthYear].IN += r.quantity;
      if (r.type === 'OUT') map[monthYear].OUT += r.quantity;
    });
    // Sort by actual date
    return Object.values(map).sort((a,b) => new Date(a.name) - new Date(b.name));
  }, [records]);

  // Group by Date for Transaction Vol
  const dailyGraphData = useMemo(() => {
    const map = {};
    records.forEach(r => {
      const dateStr = String(r.date).split('T')[0];
      if (!map[dateStr]) {
        map[dateStr] = { name: dateStr, IN: 0, OUT: 0 };
      }
      if (r.type === 'IN') map[dateStr].IN += r.quantity;
      if (r.type === 'OUT') map[dateStr].OUT += r.quantity;
    });
    return Object.values(map).sort((a,b) => new Date(a.name) - new Date(b.name));
  }, [records]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '40px', marginTop: '20px', paddingBottom: '30px', height: '100%', overflowY: 'auto' }}>
      
      {/* TOP PIE CHARTS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '20px' }}>
        <div className="graph-container" style={{ width: '100%', minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ textAlign: 'center', color: '#e2e8f0', marginBottom: '10px', fontSize: '1.1rem', fontWeight: '600' }}>Overall IN vs OUT</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieDataInOut} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                {pieDataInOut.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.name === 'Total IN' ? '#10b981' : '#ef4444'} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#16192b', borderColor: '#ffffff1a', borderRadius: '12px' }} itemStyle={{ color: '#e2e8f0' }} />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="graph-container" style={{ width: '100%', minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ textAlign: 'center', color: '#e2e8f0', marginBottom: '10px', fontSize: '1.1rem', fontWeight: '600' }}>Product Balance Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieDataProducts} cx="50%" cy="50%" innerRadius={0} outerRadius={90} paddingAngle={2} dataKey="value">
                {pieDataProducts.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#16192b', borderColor: '#ffffff1a', borderRadius: '12px' }} itemStyle={{ color: '#e2e8f0' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="graph-container" style={{ width: '100%', minHeight: '350px' }}>
        <h3 style={{ textAlign: 'center', color: '#e2e8f0', marginBottom: '15px', fontWeight: '600' }}>Overall Product Inventory Balances</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={graphData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" vertical={false} />
            <XAxis dataKey="name" stroke="#94a3b8" tick={{fontSize: 12}} />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ backgroundColor: '#16192b', borderColor: '#ffffff1a', borderRadius: '12px' }} itemStyle={{ color: '#e2e8f0' }} />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            <Bar dataKey="Beg Bal" fill="#94a3b8" radius={[4, 4, 0, 0]} stackId="a" />
            <Bar dataKey="Extra IN" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" />
            <Bar dataKey="OUT" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="graph-container" style={{ width: '100%', minHeight: '350px' }}>
        <h3 style={{ textAlign: 'center', color: '#38bdf8', marginBottom: '15px', fontWeight: '600' }}>Monthly Transaction Volumes</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyGraphData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" vertical={false} />
            <XAxis dataKey="name" stroke="#94a3b8" tick={{fontSize: 12}} />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ backgroundColor: '#16192b', borderColor: '#ffffff1a', borderRadius: '12px' }} itemStyle={{ color: '#e2e8f0' }} />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            <Bar dataKey="IN" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="OUT" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="graph-container" style={{ width: '100%', minHeight: '350px' }}>
        <h3 style={{ textAlign: 'center', color: '#f472b6', marginBottom: '15px', fontWeight: '600' }}>Daily Activity Records</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dailyGraphData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" vertical={false} />
            <XAxis dataKey="name" stroke="#94a3b8" tick={{fontSize: 10}} />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ backgroundColor: '#16192b', borderColor: '#ffffff1a', borderRadius: '12px' }} itemStyle={{ color: '#e2e8f0' }} />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            <Bar dataKey="IN" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" />
            <Bar dataKey="OUT" fill="#ef4444" radius={[4, 4, 0, 0]} stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* NEW BIG PIE CHART FOR PRODUCT COMPARISON */}
      <div className="graph-container" style={{ width: '100%', minHeight: '500px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h3 style={{ textAlign: 'center', color: '#e2e8f0', marginBottom: '10px', fontSize: '1.4rem', fontWeight: '600' }}>Overall Transaction Activity by Product</h3>
        <ResponsiveContainer width="100%" height={450}>
          <PieChart>
            <Pie data={pieDataProductVolume} cx="50%" cy="50%" innerRadius={0} outerRadius={180} paddingAngle={2} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={true}>
              {pieDataProductVolume.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#16192b', borderColor: '#ffffff1a', borderRadius: '12px' }} itemStyle={{ color: '#e2e8f0' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* RENDER NEW KPI CARDS HERE */}
      <KPIProductCards products={productSummary} records={records} />

    </div>
  );
};

export default GraphsDashboard;
