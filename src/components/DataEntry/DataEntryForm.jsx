import React, { useState } from 'react';
import { getParsedDateInfo } from '../../utils/dataProcessing';

const DataEntryForm = ({ products, productSummary, stockists, allTransactions, onSubmit, isSubmitting }) => {
  const [dateInput, setDateInput] = useState('');
  const [stockist, setStockist] = useState('');
  const [transactionType, setTransactionType] = useState('');
  const [product, setProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const parsedDate = getParsedDateInfo(dateInput);

  // Dynamic Transaction Types
  // if stockist === '' -> ONLY Beginning Balance.
  // if stockist !== '' -> FILTER OUT Beginning Balance.
  const dynamicTransactions = allTransactions.filter(tx => {
    if (stockist === '') return tx === 'Beginning Balance';
    return tx !== 'Beginning Balance';
  });

  // Dynamic Products
  // if transactionType && stockist !== '', ONLY SHOW products with global balance > 0 OR begBal > 0.
  // else SHOW all.
  let dynamicProducts = products;
  if (stockist !== '' && transactionType !== '') {
    dynamicProducts = products.filter(p => {
      const pSum = productSummary?.find(ps => ps.product === p);
      if (!pSum) return false;
      return pSum.balance > 0 || pSum.begBal > 0;
    });
  }

  // Selected Product details for warning
  const selectedProductDetails = productSummary?.find(ps => ps.product === product);
  const showNoBalanceWarning = selectedProductDetails && selectedProductDetails.begBal > 0 && selectedProductDetails.balance <= 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!product || !quantity || Number(quantity) <= 0) {
      alert("Please select a Product and enter a valid Quantity.");
      return;
    }
    if (!transactionType) {
      alert("Please select a Transaction Type.");
      return;
    }

    const payload = {
      dateInput,
      stockist,
      transactionType,
      product,
      quantity
    };

    // Submits the payload
    onSubmit(payload).then(success => {
      if (success) {
         // Show success modal instead of clearing directly
         setShowSuccessModal(true);
      }
    });
  };

  const handleModalClose = (clearFields) => {
    setShowSuccessModal(false);
    if (clearFields) {
      setDateInput('');
      setStockist('');
      setTransactionType('');
      setProduct('');
      setQuantity('');
    }
  };

  return (
    <>
      <div className="form-grid" style={{ opacity: isSubmitting ? 0.6 : 1, pointerEvents: isSubmitting ? 'none' : 'auto' }}>
        {/* Date Input */}
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
          {dateInput.length > 0 && (
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: parsedDate ? '#10b981' : '#ef4444', marginTop: '2px' }}>
              {parsedDate ? `Preview: ${parsedDate.label}` : 'Type full date (e.g. 11052024)'}
            </span>
          )}
        </div>

        <div className="input-group">
          <label>Stockist (Blank = Central)</label>
          <div className="select-wrapper">
            <select value={stockist} onChange={(e) => { setStockist(e.target.value); setTransactionType(''); setProduct(''); }}>
              <option value="">-- None / Previous monthly balance --</option>
              {stockists.map((st) => <option key={st} value={st}>{st}</option>)}
            </select>
          </div>
        </div>

        <div className="input-group">
          <label>Transaction Type</label>
          <div className="select-wrapper">
            <select value={transactionType} onChange={(e) => setTransactionType(e.target.value)}>
              <option value="" disabled>--- Select Transaction ---</option>
              {dynamicTransactions.map((tx) => (
                <option key={tx} value={tx}>{tx}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="input-group">
          <label>Product</label>
          <div className="select-wrapper">
            <select value={product} onChange={(e) => setProduct(e.target.value)}>
              <option value="" disabled>--- Select Product ---</option>
              {dynamicProducts.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          {/* Validation Warning */}
          {showNoBalanceWarning && (
            <span style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 'bold', marginTop: '4px' }}>
              No remaining balance
            </span>
          )}
        </div>

        <div className="input-group">
          <label>Quantity</label>
          <input type="number" min="1" className="number-input" placeholder="Enter quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>

        <div className="action-area" style={{ gridColumn: '1 / -1' }}>
          <button className="primary-btn" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
               <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>↻</span> Submitting...</>
            ) : (
              <>Add Transaction</>
            )}
          </button>
        </div>
      </div>

      {/* SUCCESS MODAL OVERLAY */}
      {showSuccessModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="glass-panel" style={{ width: '400px', textAlign: 'center', padding: '40px', border: '1px solid #10b981' }}>
            <h2 style={{ color: '#10b981', fontSize: '2rem', marginBottom: '10px' }}>Save Success!</h2>
            <p style={{ color: '#e2e8f0', fontSize: '1.1rem', marginBottom: '30px' }}>Do you want to clear the fields?</p>
            
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
              <button className="secondary-btn" onClick={() => handleModalClose(false)} style={{ flex: 1, justifyContent: 'center' }}>
                No
              </button>
              <button className="primary-btn" onClick={() => handleModalClose(true)} style={{ flex: 1, justifyContent: 'center', background: '#10b981' }}>
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DataEntryForm;
