import { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import './index.css';

// The Google Apps Script Web App URL from the deployment (loaded securely from env variable)
const SCRIPT_URL = import.meta.env.VITE_APP_GAS_URL;

// Helper to parse DDMMYYYY cleanly
const getParsedDateInfo = (input) => {
  if (!input) return null;
  const cleaned = input.replace(/\D/g, '');
  if (cleaned.length >= 8) {
    const dd = parseInt(cleaned.substring(0, 2), 10);
    const mm = parseInt(cleaned.substring(2, 4), 10);
    const yyyy = parseInt(cleaned.substring(4, 8), 10);

    if (dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12 && yyyy >= 1900) {
      const dateObj = new Date(yyyy, mm - 1, dd);
      if (!isNaN(dateObj.valueOf())) {
        return {
          label: dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        };
      }
    }
  }
  return null;
}

function App() {
  const [records, setRecords] = useState([]); // Default empty, loads from GAS
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [dateInput, setDateInput] = useState('');
  const [stockist, setStockist] = useState('');
  const [transactionType, setTransactionType] = useState('');
  const [product, setProduct] = useState('');
  const [quantity, setQuantity] = useState('');

  // View Mode: 'summary', 'recent', 'graph'
  const [viewMode, setViewMode] = useState('summary');

  // Load Data on App Mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();

        // If data is array (normal case), load it into state
        if (Array.isArray(data)) {
          setRecords(data);
        } else if (data && data.status === 'error') {
          console.error("Apps script error: ", data.message);
          alert("Error loading from database: " + data.message);
        }
      } catch (err) {
        console.error("Failed to fetch Google Sheets data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Static options
  const stockists = [
    'PHILIPPINESHQ', 'BAGUIO', 'BATANGAS', 'BENGUET', 'BOHOL', 'BUKIDNON',
    'CALOOCAN', 'CAPIZ', 'CEBU', 'COTABATO', 'DAGUPAN', 'DAVAO', 'FAIRVIEW',
    'ILOILO', 'ISABELA01', 'LUCENA02', 'MALOLOS', 'MANDALUYONG', 'PASIG',
    'QUEZONCITY', 'SANPEDRO', 'MALAYSIA HO'
  ];
  const allTransactions = [
    'Beginning Balance', 'PURCHASE / IN', 'SALES', 'RESUBMISSION',
    'REPLACEMENT / WARRANTY', 'PH OFFICE STOCK', 'REPEAT PURCHASE',
    'LRW', 'PROMO / FREE', 'Marketing Support Items'
  ];
  const products = [
    'Classic', 'Premium', 'Premium Plus', 'Pro', 'Bio', 'Bio-Lite', 'Oxytap',
    'Ion Shield', '7 Wonders', 'Prife Bangles(GOLD)', 'Prife Bangles(SILVER)',
    'Envy Spec (BLUE)', 'Envy Spec (BLACK)', 'Envy Spec (RED)', 'Envy Spec (PURPLE)',
    'Envy Spec (KID)', 'Aurora CLASSIC', 'Aurora PERSONALITY', 'Aurora INTELLECTUAL',
    'Aurora TRENDY', 'Aurora UNIQUE', 'Aurora VINTAGE', 'Aurora ELEGANT',
    'Aurora CONFIDENT', 'Cartridge', 'MIRACARE OIL (LOCAL PURCHASE)',
    'HYDROGEN SPRAYER', 'MAGNOSEEK', 'Eco BAG'
  ];

  // Parse Date UI State
  const parsedDate = getParsedDateInfo(dateInput);

  // Dynamic Transaction dropdown logic:
  const availableTransactions = useMemo(() => {
    if (stockist === '') {
      return ['Beginning Balance'];
    } else {
      return allTransactions.filter(t => t !== 'Beginning Balance');
    }
  }, [stockist]);

  // Determine which products have history already
  const usedProducts = useMemo(() => {
    return Array.from(new Set(records.map(r => r.product)));
  }, [records]);

  // Dynamic Product dropdown logic based on Beginning balance usage
  const availableProducts = useMemo(() => {
    if (transactionType === 'Beginning Balance') {
      return products.filter(p => !usedProducts.includes(p));
    }
    return products;
  }, [transactionType, usedProducts]);

  // Current stats for the left-side dashboard based on the PRODUCT selected
  const currentStat = useMemo(() => {
    if (!product) return null;
    let begBal = 0; let totalIn = 0; let totalOut = 0;
    records.forEach(item => {
      if (item.product === product) {
        if (item.transactionType === 'Beginning Balance') {
          begBal += item.quantity;
        } else if (item.type === 'IN') {
          totalIn += item.quantity;
        } else if (item.type === 'OUT') {
          totalOut += item.quantity;
        }
      }
    });
    return {
      begBal,
      in: totalIn,
      out: totalOut,
      balance: begBal + totalIn - totalOut
    };
  }, [records, product]);

  // Aggregated Summary for the Data View (ONLY GROUPED BY PRODUCT)
  const productSummary = useMemo(() => {
    const map = {};
    products.forEach(p => { map[p] = { product: p, begBal: 0, in: 0, out: 0, balance: 0 }; });
    records.forEach(r => {
      if (!map[r.product]) return;
      if (r.transactionType === 'Beginning Balance') {
        map[r.product].begBal += r.quantity;
      } else if (r.type === 'IN') {
        map[r.product].in += r.quantity;
      } else if (r.type === 'OUT') {
        map[r.product].out += r.quantity;
      }
      map[r.product].balance = map[r.product].begBal + map[r.product].in - map[r.product].out;
    });
    return Object.values(map);
  }, [records]);

  // Generate records map array including RUNNING BALANCE 
  const recordsWithRunningBalance = useMemo(() => {
    const currentBals = {};
    return records.map(r => {
      if (!currentBals[r.product]) currentBals[r.product] = 0;
      if (r.type === 'IN') currentBals[r.product] += r.quantity;
      if (r.type === 'OUT') currentBals[r.product] -= r.quantity;
      return { ...r, runningBalance: currentBals[r.product] };
    });
  }, [records]);

  // Data for the Graph based on records (Product Level)
  const graphData = productSummary.map(ps => ({
    name: ps.product,
    "Beg Bal": ps.begBal,
    "Extra IN": ps.in,
    "OUT": ps.out
  }));

  const handleAddData = async (typeIndicator) => {
    if (!transactionType || !product || !quantity) {
      return alert("Please fill out Transaction, Product, and Quantity");
    }
    const qtyNum = Number(quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      return alert("Please enter a valid positive number for Quantity");
    }

    if (typeIndicator === 'OUT' && currentStat && currentStat.balance < qtyNum) {
      return alert(`Insufficient Inventory! You are trying to deduct ${qtyNum} but only ${currentStat.balance} is available for ${product}.`);
    }

    // Determine finalized date
    let finalDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    if (dateInput) {
      if (parsedDate) {
        finalDate = parsedDate.label;
      } else {
        return alert("Please enter a complete Valid Date format e.g. 11/05/2024 or 11052024, or leave blank to capture today automatically.");
      }
    }

    const newRecord = {
      id: Date.now(),
      date: finalDate,
      stockist: stockist === '' ? 'Previous monthly balance' : stockist,
      transactionType,
      product,
      type: typeIndicator,
      quantity: qtyNum
    };

    setIsSubmitting(true);
    try {
      const response = await fetch(SCRIPT_URL, {
        method: "POST",
        headers: {
          // Using text/plain prevents strict CORS preflight blocking in GAS
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(newRecord)
      });

      const resData = await response.json();

      if (resData.status === 'success') {
        // Appends safely to UI only if server succeeded
        setRecords([...records, newRecord]);
        setQuantity('');
        setDateInput('');

        if (transactionType === 'Beginning Balance') setStockist('');
      } else {
        alert("Failed to save to Database: " + resData.message);
      }
    } catch (err) {
      alert("Network Error, couldn't connect to Google Sheets.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine which button to show based on logic rules
  const renderActionButtons = () => {
    if (!transactionType || !product) return null;

    if (stockist === '' && transactionType === 'Beginning Balance') {
      return (
        <button className="primary-btn in-btn animate-pop" onClick={() => handleAddData('IN')} style={{ width: '100%', justifyContent: 'center' }}>
          <span className="icon">📥</span> ADD IN (Set Beginning Balance)
        </button>
      );
    }

    if (stockist === 'PHILIPPINESHQ' && transactionType === 'PH OFFICE STOCK') {
      return (
        <button className="primary-btn in-btn animate-pop" onClick={() => handleAddData('IN')} style={{ width: '100%', justifyContent: 'center' }}>
          <span className="icon">📥</span> ADD IN (Receive PH Office Stock)
        </button>
      );
    }

    if (stockist !== '' && transactionType !== 'Beginning Balance' && transactionType !== 'PH OFFICE STOCK') {
      const isZeroBalance = !currentStat || currentStat.balance <= 0;
      return (
        <button
          className="primary-btn out-btn animate-pop"
          onClick={() => handleAddData('OUT')}
          disabled={isZeroBalance}
          style={{ width: '100%', justifyContent: 'center', opacity: isZeroBalance ? 0.5 : 1, cursor: isZeroBalance ? 'not-allowed' : 'pointer' }}
        >
          <span className="icon">📤</span> {isZeroBalance ? 'OUT OF STOCK (Balance is 0)' : 'ADD OUT (Deduct from Global Pool)'}
        </button>
      );
    }

    return <div className="placeholder-text" style={{ padding: '10px' }}>Invalid combination</div>;
  };

  return (
    <div className="app-container">
      <div className="dashboard-layout">

        {/* LEFT COLUMN: Data Entry & Summary */}
        <div className="glass-panel main-dashboard" style={{ overflowY: 'auto' }}>
          <header className="dashboard-header">
            <h1 style={{ fontSize: '2rem' }}>Stockist Portal</h1>
            <p>Central Product Inventory Management</p>
          </header>

          <div className="form-grid" style={{ opacity: isSubmitting ? 0.6 : 1, pointerEvents: isSubmitting ? 'none' : 'auto' }}>

            {/* New Date Input */}
            <div className="input-group">
              <label>Record Date (DD/MM/YYYY)</label>
              <input
                type="text"
                className="number-input"
                placeholder="Leave blank for today"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                maxLength={10}
              />
              {/* Dynamic Sub Label for Date parsing confirmation */}
              {dateInput.length > 0 && (
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: parsedDate ? '#10b981' : '#ef4444', marginTop: '2px' }}>
                  {parsedDate ? `Preview: ${parsedDate.label}` : 'Type full date (e.g. 11052024)'}
                </span>
              )}
            </div>

            <div className="input-group">
              <label>Stockist (Blank = Central)</label>
              <div className="select-wrapper">
                <select
                  value={stockist}
                  onChange={(e) => {
                    setStockist(e.target.value);
                    setTransactionType('');
                  }}
                >
                  <option value="">-- None / Previous monthly balance --</option>
                  {stockists.map((st) => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
            </div>

            <div className="input-group">
              <label>Transaction Type</label>
              <div className="select-wrapper">
                <select
                  value={transactionType}
                  onChange={(e) => {
                    setTransactionType(e.target.value);
                    setProduct('');
                  }}
                >
                  <option value="" disabled>-- Select Transaction --</option>
                  {availableTransactions.map((tr) => <option key={tr} value={tr}>{tr}</option>)}
                </select>
              </div>
            </div>

            <div className="input-group">
              <label>Product</label>
              <div className="select-wrapper">
                <select value={product} onChange={(e) => setProduct(e.target.value)}>
                  <option value="" disabled>-- Select Product --</option>
                  {availableProducts.map((pr) => <option key={pr} value={pr}>{pr}</option>)}
                </select>
              </div>
            </div>

            <div className="input-group">
              <label>Quantity</label>
              <input
                type="number"
                className="number-input"
                placeholder="e.g. 150"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
          </div>

          <div className="action-area action-area-form" style={{ minHeight: '52px' }}>
            {isSubmitting ? (
              <div className="placeholder-text" style={{ padding: '10px', color: '#38bdf8', fontWeight: 'bold' }}>
                Syncing with Database... ⏳
              </div>
            ) : (
              renderActionButtons()
            )}
          </div>

          {product && (
            <div className="stats-container animate-fade-in" style={{ gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="stat-card" style={{ padding: '15px' }}>
                <span className="stat-label">Beginning Bal</span>
                <h4 className="text-secondary" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{currentStat?.begBal || 0}</h4>
              </div>
              <div className="stat-card" style={{ padding: '15px' }}>
                <span className="stat-label">Extra IN</span>
                <h4 className="text-green" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{currentStat?.in || 0}</h4>
              </div>
              <div className="stat-card" style={{ padding: '15px' }}>
                <span className="stat-label">Total OUT</span>
                <h4 className="text-red" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{currentStat?.out || 0}</h4>
              </div>
              <div className="stat-card highlight-card" style={{ padding: '15px' }}>
                <span className="stat-label">GLOBAL BAL</span>
                <h4 className="text-glow" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{currentStat?.balance || 0}</h4>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Multi-View Panel */}
        <div className="glass-panel data-view-panel">
          <header className="dashboard-header compact-header" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2>Data View</h2>
                <p>Global Product Metrics</p>
              </div>

              <div className="view-toggle">
                <label className={`toggle-btn ${viewMode === 'summary' ? 'active' : ''}`}>
                  <input type="radio" checked={viewMode === 'summary'} onChange={() => setViewMode('summary')} />
                  Summary
                </label>
                <label className={`toggle-btn ${viewMode === 'recent' ? 'active' : ''}`}>
                  <input type="radio" checked={viewMode === 'recent'} onChange={() => setViewMode('recent')} />
                  History
                </label>
                <label className={`toggle-btn ${viewMode === 'graph' ? 'active' : ''}`}>
                  <input type="radio" checked={viewMode === 'graph'} onChange={() => setViewMode('graph')} />
                  Graph
                </label>
              </div>
            </div>
          </header>

          <div className="view-content-wrapper">
            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '300px', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ border: '4px solid #334155', borderTop: '4px solid #38bdf8', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
                <p style={{ marginTop: '15px', color: '#94a3b8', fontWeight: 600 }}>Loading from Google Sheets...</p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
              </div>
            ) : (
              <>
                {viewMode === 'summary' && (
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
                )}

                {viewMode === 'recent' && (
                  <div className="table-responsive animate-fade-in">
                    <table className="data-table" style={{ fontSize: '0.85rem' }}>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Action</th>
                          <th>Source/Dest</th>
                          <th>Product</th>
                          <th>Qty</th>
                          <th style={{ color: '#38bdf8' }}>Run. Bal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recordsWithRunningBalance.slice().reverse().slice(0, 15).map(row => (
                          <tr key={row.id}>
                            <td className="text-secondary text-bold" style={{ whiteSpace: 'nowrap' }}>{row.date}</td>
                            <td><span className={`badge badge-${row.type.toLowerCase()}`}>{row.type}</span></td>
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
                )}

                {viewMode === 'graph' && (
                  <div className="graph-container animate-fade-in" style={{ width: '100%', height: '400px', marginTop: '20px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={graphData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" vertical={false} />
                        <XAxis dataKey="name" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#16192b', borderColor: '#ffffff1a', borderRadius: '12px' }}
                          itemStyle={{ color: '#e2e8f0' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar dataKey="Beg Bal" fill="#94a3b8" radius={[4, 4, 0, 0]} stackId="a" />
                        <Bar dataKey="Extra IN" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" />
                        <Bar dataKey="OUT" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>
    </div>
  );
}

export default App;
