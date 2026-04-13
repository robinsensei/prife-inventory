import { useState, useMemo, useEffect } from 'react';
import './index.css';

// Components
import DataEntryForm from './components/DataEntry/DataEntryForm';
import SummaryTable from './components/DataViews/SummaryTable';
import HistoryTable from './components/DataViews/HistoryTable';
import GraphsDashboard from './components/DataViews/GraphsDashboard';

const SCRIPT_URL = import.meta.env.VITE_APP_GAS_URL;

function App() {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [products, setProducts] = useState([
    'Classic', 'Premium', 'Premium Plus', 'Pro', 'Bio', 'Bio-Lite', 'Oxytap', 
    'Ion Shield', '7 Wonders', 'Prife Bangles(GOLD)', 'Prife Bangles(SILVER)', 
    'Envy Spec (BLUE)', 'Envy Spec (BLACK)', 'Envy Spec (RED)', 'Envy Spec (PURPLE)', 
    'Envy Spec (KID)', 'Aurora CLASSIC', 'Aurora PERSONALITY', 'Aurora INTELLECTUAL', 
    'Aurora TRENDY', 'Aurora UNIQUE', 'Aurora VINTAGE', 'Aurora ELEGANT', 
    'Aurora CONFIDENT', 'Cartridge', 'MIRACARE OIL (LOCAL PURCHASE)', 
    'HYDROGEN SPRAYER', 'MAGNOSEEK', 'Eco BAG'
  ]);
  
  const [allTransactions, setAllTransactions] = useState([
    'Beginning Balance', 'PURCHASE / IN', 'SALES', 'RESUBMISSION', 
    'REPLACEMENT / WARRANTY', 'PH OFFICE STOCK', 'REPEAT PURCHASE', 
    'LRW', 'PROMO / FREE', 'Marketing Support Items'
  ]);

  const stockists = [
    'PHILIPPINESHQ', 'BAGUIO', 'BATANGAS', 'BENGUET', 'BOHOL', 'BUKIDNON', 
    'CALOOCAN', 'CAPIZ', 'CEBU', 'COTABATO', 'DAGUPAN', 'DAVAO', 'FAIRVIEW', 
    'ILOILO', 'ISABELA01', 'LUCENA02', 'MALOLOS', 'MANDALUYONG', 'PASIG', 
    'QUEZONCITY', 'SANPEDRO', 'MALAYSIA HO'
  ];

  const [viewMode, setViewMode] = useState('summary');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();
        if (data && data.transactions) {
          setRecords(data.transactions);
          if (data.products && data.products.length > 0) setProducts(data.products);
          if (data.transactionTypes && data.transactionTypes.length > 0) setAllTransactions(data.transactionTypes);
        } else if (Array.isArray(data)) {
          setRecords(data);
        }
      } catch (err) {
        console.error("Failed to fetch:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleFormSubmit = async (payload) => {
    const { dateInput, stockist, transactionType, product, quantity } = payload;
    
    const type = ['Beginning Balance', 'PURCHASE / IN', 'RESUBMISSION'].includes(transactionType) ? 'IN' : 'OUT';

    const newRecord = {
      date: dateInput || new Date().toISOString(),
      type,
      transactionType, 
      stockist: stockist || '',
      product,
      quantity: Number(quantity)
    };

    setIsSubmitting(true);
    try {
      const response = await fetch(SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(newRecord)
      });
      const resData = await response.json();
      if (resData.status === 'success') {
        setRecords([...records, newRecord]);
        return true;
      } else {
        alert("Server error: " + resData.message);
        return false;
      }
    } catch (err) {
      alert("Network error: " + err.message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Heavy computations for summary tables
  const productSummary = useMemo(() => {
    const summary = {};
    products.forEach(p => summary[p] = { product: p, begBal: 0, in: 0, out: 0, balance: 0 });

    records.forEach(r => {
      if (!summary[r.product]) {
        summary[r.product] = { product: r.product, begBal: 0, in: 0, out: 0, balance: 0 };
      }
      if (r.type === 'IN') {
        if (r.transactionType === 'Beginning Balance') {
          summary[r.product].begBal += r.quantity;
        } else {
          summary[r.product].in += r.quantity;
        }
        summary[r.product].balance += r.quantity;
      } else if (r.type === 'OUT') {
        summary[r.product].out += r.quantity;
        summary[r.product].balance -= r.quantity;
      }
    });

    return Object.values(summary).sort((a,b) => b.balance - a.balance);
  }, [records, products]);

  const recordsWithRunningBalance = useMemo(() => {
    const localBalances = {};
    return [...records].sort((a,b) => new Date(a.date) - new Date(b.date)).map(r => {
      if (!localBalances[r.product]) localBalances[r.product] = 0;
      if (r.type === 'IN') localBalances[r.product] += r.quantity;
      if (r.type === 'OUT') localBalances[r.product] -= r.quantity;
      return { ...r, runningBalance: localBalances[r.product] };
    });
  }, [records]);

  // Global Quick Stats
  const { totalInQty, totalOutQty, totalBalance } = useMemo(() => {
    let tIn = 0, tOut = 0, tBal = 0;
    productSummary.forEach(ps => {
      tIn += (ps.begBal + ps.in);
      tOut += ps.out;
      tBal += ps.balance;
    });
    return { totalInQty: tIn, totalOutQty: tOut, totalBalance: tBal };
  }, [productSummary]);

  return (
    <div className="app-container">
      <div className="dashboard-layout" style={{ gridTemplateColumns: viewMode === 'graph' ? '1fr' : undefined }}>

        {viewMode !== 'graph' && (
          <div className="glass-panel main-dashboard" style={{ overflowY: 'auto' }}>
            <header className="dashboard-header">
              <h1 style={{ fontSize: '2rem' }}>Office inventory portal</h1>
              <p>Central Product Inventory Management</p>
            </header>

            <DataEntryForm 
              products={products} 
              productSummary={productSummary}
              stockists={stockists} 
              allTransactions={allTransactions} 
              isSubmitting={isSubmitting} 
              onSubmit={handleFormSubmit} 
            />

            <hr style={{ border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', margin: '10px 0' }} />

            <div className="stats-container">
              <div className="stat-card">
                <span className="stat-label">TOTAL IN</span>
                <h4 className="text-green">{totalInQty}</h4>
              </div>
              <div className="stat-card">
                <span className="stat-label">TOTAL OUT</span>
                <h4 className="text-red">{totalOutQty}</h4>
              </div>
              <div className="stat-card highlight-card" style={{ padding: '15px' }}>
                <span className="stat-label">GLOBAL BAL</span>
                <h4 className="text-glow" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{totalBalance}</h4>
              </div>
            </div>
          </div>
        )}

        <div className="glass-panel data-view-panel">
          <header className="dashboard-header compact-header" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2>Data Report</h2>
                <p>Prife Product Metrics</p>
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
                {viewMode === 'summary' && <SummaryTable productSummary={productSummary} />}
                {viewMode === 'recent' && <HistoryTable recordsWithRunningBalance={recordsWithRunningBalance} />}
                {viewMode === 'graph' && <GraphsDashboard records={records} productSummary={productSummary} />}
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
