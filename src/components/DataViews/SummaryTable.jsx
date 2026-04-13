import React from 'react';

const SummaryTable = ({ productSummary }) => {
  return (
    <div className="table-responsive animate-fade-in">
      <table className="data-table complete-table">
        <thead>
          <tr>
            <th style={{ width: '25%' }}>Product</th>
            <th>Beg. Bal</th>
            <th>Extra IN</th>
            <th>Total OUT</th>
            <th>Global Bal</th>
          </tr>
        </thead>
        <tbody>
          {productSummary.map((row, idx) => (
            <tr key={idx}>
              <td><span className="table-highlight" style={{ fontSize: '1.1rem' }}>{row.product}</span></td>
              <td className="text-secondary text-bold">{row.begBal}</td>
              <td className="text-green text-bold">{row.in}</td>
              <td className="text-red text-bold">{row.out}</td>
              <td><span className="badge badge-in text-bold" style={{ fontSize: '1rem', padding: '6px 14px' }}>{row.balance}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SummaryTable;
