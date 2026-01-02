
/**
 * Zenith AI WhatsApp CRM - PRO Backend v11 (ULTIMATE)
 * 
 * FIXES:
 * - Deletion "No record found" error via Triple-Check Algorithm.
 * - Added support for Campaign Metrics (Sent/Opened/Replied).
 */

function doGet(e) {
  const sheetName = e.parameter.sheet;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return createJsonResponse({ success: false, error: "Sheet '" + sheetName + "' not found" });
  const data = getRowsData(sheet);
  return createJsonResponse({ success: true, data: data });
}

function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(req.sheet);
    if (!sheet) return createJsonResponse({ success: false, error: "Sheet '" + req.sheet + "' not found" });
    
    const range = sheet.getDataRange();
    const data = range.getValues();
    const headers = data[0];

    const clean = (str) => str ? str.toString().toLowerCase().replace(/\s+/g, '') : '';
    const fuzzy = (str) => str ? str.toString().toLowerCase().replace(/[^a-z0-9]/g, '') : '';
    
    const findColIdx = (targetKey) => {
      const ck = clean(targetKey);
      const aliases = {
        'phone': ['phone', 'phonenumber', 'whatsapp', 'tel', 'mobile'],
        'client': ['client', 'clientname', 'customer', 'name'],
        'productid': ['productid', 'id', 'sku', 'productcode', 'product_id'],
        'campaignid': ['campaignid', 'id', 'campaign', 'campaign_id'],
        'username': ['username', 'user', 'login', 'id'],
        'key': ['key', 'name', 'id', 'variable']
      };

      let idx = headers.findIndex(h => clean(h) === ck);
      if (idx !== -1) return idx;

      for (let base in aliases) {
        if (ck === base || aliases[base].includes(ck)) {
          idx = headers.findIndex(h => {
            const ch = clean(h);
            return ch === base || aliases[base].includes(ch);
          });
          if (idx !== -1) return idx;
        }
      }
      return -1;
    };

    if (req.action === 'create') {
      const newRow = headers.map(h => {
        const payloadKey = Object.keys(req.data).find(k => clean(k) === clean(h));
        return payloadKey !== undefined ? req.data[payloadKey] : "";
      });
      sheet.appendRow(newRow);
      return createJsonResponse({ success: true, message: "Created" });
    }

    if (req.action === 'update' || req.action === 'delete') {
      const idIdx = findColIdx(req.idKey);
      if (idIdx === -1) return createJsonResponse({ success: false, error: "Column '" + req.idKey + "' not found" });

      const targetVal = req.idValue.toString();
      const targetFuzzy = fuzzy(targetVal);

      for (let i = 1; i < data.length; i++) {
        const rowValue = data[i][idIdx];
        const rowString = rowValue.toString();
        const rowFuzzy = fuzzy(rowValue);
        
        // Triple-Check Matching
        let isMatch = (rowString === targetVal) || (rowFuzzy === targetFuzzy);
        
        if (!isMatch && (req.idKey === 'phone' || req.idKey === 'whatsapp')) {
          const r = rowFuzzy.slice(-9);
          const t = targetFuzzy.slice(-9);
          isMatch = (r === t && r.length >= 9);
        }

        if (isMatch) {
          if (req.action === 'delete') {
            sheet.deleteRow(i + 1);
            return createJsonResponse({ success: true, message: "Deleted row " + (i + 1) });
          } else {
            const existingRow = data[i];
            const updatedRow = headers.map((h, hIdx) => {
              const payloadKey = Object.keys(req.data).find(k => clean(k) === clean(h));
              return payloadKey !== undefined ? req.data[payloadKey] : existingRow[hIdx];
            });
            sheet.getRange(i + 1, 1, 1, headers.length).setValues([updatedRow]);
            return createJsonResponse({ success: true, message: "Updated row " + (i + 1) });
          }
        }
      }
      return createJsonResponse({ success: false, error: "Record not found: " + targetVal });
    }
  } catch (err) { return createJsonResponse({ success: false, error: err.toString() }); }
}

function getRowsData(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { if (h) obj[h] = row[i]; });
    return obj;
  });
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
