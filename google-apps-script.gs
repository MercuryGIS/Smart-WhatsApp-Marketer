
/**
 * WhatsAi Agent CRM - Backend v12.4 (META WEBHOOK CATEGORY PRO)
 * Enhanced to capture conversation categories: Marketing, Utility, Service.
 */

function doGet(e) {
  // META WEBHOOK VERIFICATION (HANDSHAKE)
  if (e.parameter['hub.mode'] === 'subscribe' && e.parameter['hub.challenge']) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const keySheet = ss.getSheetByName('Keys');
    let savedToken = "";
    if (keySheet) {
      const keys = getRowsData(keySheet);
      const record = keys.find(k => {
        const kName = Object.keys(k).find(key => key.toLowerCase() === 'key');
        return k[kName] === 'webhook_verify_token';
      });
      if (record) savedToken = record[Object.keys(record).find(key => key.toLowerCase() === 'value')];
    }
    if (e.parameter['hub.verify_token'] === savedToken && savedToken !== "") {
      return ContentService.createTextOutput(e.parameter['hub.challenge']).setMimeType(ContentService.MimeType.TEXT);
    }
    return ContentService.createTextOutput("Token Mismatch").setMimeType(ContentService.MimeType.TEXT);
  }

  // STANDARD DATA READ
  const sheetName = e.parameter.sheet;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return createJsonResponse({ success: false, error: "Sheet '" + sheetName + "' not found" });
  const data = getRowsData(sheet);
  return createJsonResponse({ success: true, data: data });
}

function doPost(e) {
  try {
    const postBody = e.postData.contents;
    const req = JSON.parse(postBody);

    // HANDLE META WEBHOOK NOTIFICATIONS
    if (req.object === 'whatsapp_business_account') {
      processMetaWebhook(req);
      return createJsonResponse({ success: true, message: "Webhook Processed" });
    }

    // STANDARD CRM OPERATIONS
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(req.sheet);
    if (!sheet) return createJsonResponse({ success: false, error: "Sheet '" + req.sheet + "' not found" });
    
    const range = sheet.getDataRange();
    const data = range.getValues();
    const headers = data[0];

    if (req.action === 'create') {
      const newRow = headers.map(h => {
        const payloadKey = Object.keys(req.data).find(k => k.toLowerCase().replace(/\s+/g, '') === h.toLowerCase().replace(/\s+/g, ''));
        return payloadKey !== undefined ? req.data[payloadKey] : "";
      });
      sheet.appendRow(newRow);
      return createJsonResponse({ success: true, message: "Created" });
    }

    if (req.action === 'update' || req.action === 'delete') {
      const idIdx = headers.findIndex(h => h.toLowerCase().replace(/\s+/g, '') === req.idKey.toLowerCase().replace(/\s+/g, ''));
      const targetVal = req.idValue.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
      for (let i = 1; i < data.length; i++) {
        const rowFuzzy = data[i][idIdx].toString().toLowerCase().replace(/[^a-z0-9]/g, '');
        if (rowFuzzy === targetVal || (rowFuzzy.slice(-9) === targetVal.slice(-9) && rowFuzzy.length >= 9)) {
          if (req.action === 'delete') {
            sheet.deleteRow(i + 1);
            return createJsonResponse({ success: true, message: "Deleted" });
          } else {
            const existingRow = data[i];
            const updatedRow = headers.map((h, hIdx) => {
              const payloadKey = Object.keys(req.data).find(k => k.toLowerCase().replace(/\s+/g, '') === h.toLowerCase().replace(/\s+/g, ''));
              return payloadKey !== undefined ? req.data[payloadKey] : existingRow[hIdx];
            });
            sheet.getRange(i + 1, 1, 1, headers.length).setValues([updatedRow]);
            return createJsonResponse({ success: true, message: "Updated" });
          }
        }
      }
    }
  } catch (err) { return createJsonResponse({ success: false, error: err.toString() }); }
}

function processMetaWebhook(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const campaignSheet = ss.getSheetByName('Campaigns');
  const clientSheet = ss.getSheetByName('Clients');
  if (!campaignSheet) return;
  
  const entries = payload.entry;
  entries.forEach(entry => {
    const changes = entry.changes;
    changes.forEach(change => {
      const value = change.value;
      
      // TRACK STATUS (READ/OPENED/DELIVERED)
      if (value.statuses) {
        value.statuses.forEach(status => {
          if (status.status === 'read' || status.status === 'delivered') {
            incrementCampaignStat(campaignSheet, status.status === 'read' ? 'opened' : 'sent');
          }
        });
      }
      
      // TRACK INCOMING REPLIES (MESSAGES RECEIVED)
      if (value.messages) {
        incrementCampaignStat(campaignSheet, 'replied');
        value.messages.forEach(msg => {
          updateClientLastInteraction(clientSheet, msg.from, msg.text ? msg.text.body : 'Media Message');
        });
      }
    });
  });
}

function incrementCampaignStat(sheet, columnKey) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const colIdx = headers.findIndex(h => h.toLowerCase().includes(columnKey.toLowerCase()));
  if (colIdx === -1) return;
  const lastRowIdx = data.length;
  if (lastRowIdx > 1) {
    const cell = sheet.getRange(lastRowIdx, colIdx + 1);
    const currentVal = Number(cell.getValue()) || 0;
    cell.setValue(currentVal + 1);
  }
}

function updateClientLastInteraction(sheet, phone, snippet) {
  if (!sheet) return;
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const phoneIdx = headers.findIndex(h => h.toLowerCase().includes('phone'));
  const noteIdx = headers.findIndex(h => h.toLowerCase().includes('note'));
  if (phoneIdx === -1) return;
  
  const target = phone.replace(/\D/g, '');
  for (let i = 1; i < data.length; i++) {
    const rowPhone = data[i][phoneIdx].toString().replace(/\D/g, '');
    if (rowPhone.slice(-9) === target.slice(-9)) {
       if (noteIdx !== -1) {
         sheet.getRange(i+1, noteIdx+1).setValue("LAST REPLY: " + snippet);
       }
       break;
    }
  }
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
