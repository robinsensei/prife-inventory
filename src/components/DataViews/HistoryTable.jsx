import React, { useState, useMemo } from 'react';

const HistoryTable = ({ recordsWithRunningBalance }) => {
  const [filterDate, setFilterDate] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterTransactionType, setFilterTransactionType] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterProduct, setFilterProduct] = useState('');

  // Compute unique values for dropdowns
  const uniqueDates = useMemo(() => Array.from(new Set(recordsWithRunningBalance.map(r => String(r.date).split('T')[0]))).sort(), [recordsWithRunningBalance]);
  const uniqueActions = useMemo(() => Array.from(new Set(recordsWithRunningBalance.map(r => r.type))).sort(), [recordsWithRunningBalance]);
  const uniqueTransactionTypes = useMemo(() => Array.from(new Set(recordsWithRunningBalance.map(r => r.transactionType))).sort(), [recordsWithRunningBalance]);
  const uniqueSources = useMemo(() => Array.from(new Set(recordsWithRunningBalance.map(r => r.stockist || ''))).filter(Boolean).sort(), [recordsWithRunningBalance]);
  const uniqueProducts = useMemo(() => Array.from(new Set(recordsWithRunningBalance.map(r => r.product))).sort(), [recordsWithRunningBalance]);

  const filteredRecords = useMemo(() => {
    return recordsWithRunningBalance.slice().reverse().filter(row => {
      const rowDate = String(row.date).split('T')[0];
      const rowSource = row.stockist || '';
      const matchDate = filterDate === '' || rowDate === filterDate;
      const matchAction = filterAction === '' || row.type === filterAction;
      const matchTransactionType = filterTransactionType === '' || row.transactionType === filterTransactionType;
      const matchSource = filterSource === '' || rowSource === filterSource;
      const matchProduct = filterProduct === '' || row.product === filterProduct;
      return matchDate && matchAction && matchTransactionType && matchSource && matchProduct;
    })
  }, [recordsWithRunningBalance, filterDate, filterAction, filterTransactionType, filterSource, filterProduct]);

  return (
    <div className="table-responsive animate-fade-in">
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <select value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="number-input" style={{ flex: 1, padding: '8px' }}>
          <option value="">All Dates</option>
          {uniqueDates.map(val => <option key={val} value={val}>{val}</option>)}
        </select>
        <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className="number-input" style={{ flex: 1, padding: '8px' }}>
          <option value="">All Actions</option>
          {uniqueActions.map(val => <option key={val} value={val}>{val}</option>)}
        </select>
        <select value={filterTransactionType} onChange={(e) => setFilterTransactionType(e.target.value)} className="number-input" style={{ flex: 1, padding: '8px' }}>
          <option value="">All Trans. Types</option>
          {uniqueTransactionTypes.map(val => <option key={val} value={val}>{val}</option>)}
        </select>
        <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)} className="number-input" style={{ flex: 1, padding: '8px' }}>
          <option value="">All Sources</option>
          {uniqueSources.map(val => <option key={val} value={val}>{val}</option>)}
        </select>
        <select value={filterProduct} onChange={(e) => setFilterProduct(e.target.value)} className="number-input" style={{ flex: 1, padding: '8px' }}>
          <option value="">All Products</option>
          {uniqueProducts.map(val => <option key={val} value={val}>{val}</option>)}
        </select>
      </div>
      <table className="data-table" style={{ fontSize: '0.85rem' }}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Action</th>
            <th>Trans. Type</th>
            <th>Source/Dest</th>
            <th>Product</th>
            <th>Qty</th>
            <th style={{ color: '#38bdf8' }}>Run. Bal</th>
          </tr>
        </thead>
        <tbody>
          {filteredRecords.map(row => (
            <tr key={row.id}>
              <td className="text-secondary text-bold" style={{ whiteSpace: 'nowrap' }}>{String(row.date).split('T')[0]}</td>
              <td><span className={`badge badge-${row.type.toLowerCase()}`}>{row.type}</span></td>
              <td>{row.transactionType}</td>
              <td>{row.stockist}</td>
              <td><span className="table-highlight">{row.product}</span></td>
              <td><strong>{row.quantity}</strong></td>
              <td style={{ color: '#38bdf8', fontWeight: 'bold' }}>{row.runningBalance}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {recordsWithRunningBalance.length === 0 && <div className="placeholder-text">No data found yet. Start adding!</div>}
    </div>
  );
};

export default HistoryTable;
