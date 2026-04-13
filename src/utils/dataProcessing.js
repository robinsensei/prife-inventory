export const getParsedDateInfo = (input) => {
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

export const KPIHelper = {
  getCurrentAndPreviousMonthsString: () => {
    const curr = new Date();
    const prev = new Date();
    prev.setMonth(prev.getMonth() - 1);
    
    return {
      currentMonthStr: curr.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
      prevMonthStr: prev.toLocaleString('en-US', { month: 'short', year: 'numeric' })
    };
  },
  
  // returns { currentOut, prevOut, currentIn, prevIn }
  getProductKpiMetrics: (records, product) => {
    const { currentMonthStr, prevMonthStr } = KPIHelper.getCurrentAndPreviousMonthsString();
    let currentOut = 0;
    let prevOut = 0;
    let currentIn = 0;
    let prevIn = 0;
    
    records.forEach(r => {
      if (r.product !== product) return;
      
      const dateStr = String(r.date).split('T')[0];
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return;
      const recMonthYear = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      
      if (recMonthYear === currentMonthStr) {
        if (r.type === 'OUT') currentOut += r.quantity;
        if (r.type === 'IN') currentIn += r.quantity;
      } else if (recMonthYear === prevMonthStr) {
        if (r.type === 'OUT') prevOut += r.quantity;
        if (r.type === 'IN') prevIn += r.quantity;
      }
    });

    return { currentOut, prevOut, currentIn, prevIn, currentMonthStr, prevMonthStr };
  }
};
