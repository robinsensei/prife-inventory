const TX_SHEET_NAME = 'Transactions';
const SETTINGS_SHEET_NAME = 'Settings';
const STOCK_SHEET_NAME = 'On Hand Stock';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(TX_SHEET_NAME);
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Sheet "Transactions" not found!'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 1. Record the Transaction
    const newRow = [
      data.id || new Date().getTime(),
      data.date || "",
      data.stockist || "",
      data.transactionType || "",
      data.product || "",
      data.type || "",
      data.quantity || 0
    ];
    
    sheet.appendRow(newRow);
    
    // 2. Update the "On Hand Stock" Tab automatically
    const stockSheet = ss.getSheetByName(STOCK_SHEET_NAME);
    if (stockSheet) {
      const stockData = stockSheet.getDataRange().getValues();
      let found = false;
      const qty = Number(data.quantity) || 0;
      
      // Compute deduction or addition
      const multiplier = (data.type === 'IN') ? 1 : (data.type === 'OUT' ? -1 : 0);
      const amountChange = qty * multiplier;
      
      for (let i = 1; i < stockData.length; i++) {
        // Find existing product in Column A
        if (stockData[i][0] === data.product) {
          const currentTotal = Number(stockData[i][1]) || 0;
          stockSheet.getRange(i + 1, 2).setValue(currentTotal + amountChange);
          found = true;
          break;
        }
      }
      
      // If product is not yet listed, add it to the bottom
      if (!found) {
        stockSheet.appendRow([data.product, amountChange]);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Added successfully and Stock Updated'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const txSheet = ss.getSheetByName(TX_SHEET_NAME);
  const settingsSheet = ss.getSheetByName(SETTINGS_SHEET_NAME);
  
  if (!txSheet || !settingsSheet) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'May kulang na tab! Tiyaking may tab kang "Transactions" at "Settings".'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  // Get Transactions
  const txData = txSheet.getDataRange().getValues();
  const transactions = [];
  for (let i = 1; i < txData.length; i++) { 
    const row = txData[i];
    if (row[0]) {
      transactions.push({
        id: row[0],
        date: row[1],
        stockist: row[2],
        transactionType: row[3],
        product: row[4],
        type: row[5],
        quantity: Number(row[6])
      });
    }
  }

  // Get Settings (Dropdown Items)
  const settingsData = settingsSheet.getDataRange().getValues();
  const products = [];
  const transactionTypes = [];
  
  for (let i = 1; i < settingsData.length; i++) {
     const row = settingsData[i];
     // A Column
     if (row[0]) products.push(row[0].toString().trim());
     // B Column
     if (row[1]) transactionTypes.push(row[1].toString().trim());
  }
  
  // Return Combined JSON Payload
  return ContentService.createTextOutput(JSON.stringify({
    transactions: transactions,
    products: products,
    transactionTypes: transactionTypes
  })).setMimeType(ContentService.MimeType.JSON);
}

function doOptions(e) {
  return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);
}
