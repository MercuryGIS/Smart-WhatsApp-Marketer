
// Utility to clean phone numbers for WhatsApp compatibility
export const cleanPhone = (phone: string) => {
  if (!phone) return '';
  let cleaned = phone.toString().replace(/\D/g, '');
  // Normalize Morocco numbers (convert 06... to 2126...)
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '212' + cleaned.substring(1);
  }
  return cleaned;
};

// Fuzzy match helper for row identification
const fuzzyClean = (val: any) => val ? val.toString().toLowerCase().replace(/\D/g, '') : '';

// Normalizes sheet data to consistent frontend keys based on the specific sheet name
const normalizeData = (data: any[], sheetName: string) => {
  if (!Array.isArray(data)) return [];
  return data.map(item => {
    const normalized: any = {};
    for (const key in item) {
      const cleanKey = key.toLowerCase().replace(/\s+/g, '');
      
      // Contextual mapping logic
      if (sheetName === 'Clients') {
        if (['client', 'clientname', 'customer', 'name'].includes(cleanKey)) normalized['client'] = item[key];
        else if (['phone', 'phonenumber', 'whatsapp', 'tel', 'mobile'].includes(cleanKey)) normalized['phone'] = item[key];
        else if (['price', 'amount', 'total'].includes(cleanKey)) normalized['price'] = item[key];
        else if (['status', 'statuses', 'orderstatus'].includes(cleanKey)) normalized['statuses'] = item[key];
        else normalized[cleanKey] = item[key];
      } else if (sheetName === 'Users') {
        if (['username', 'user'].includes(cleanKey)) normalized['username'] = item[key];
        else if (['password', 'pass'].includes(cleanKey)) normalized['password'] = item[key];
        else if (['name', 'fullname'].includes(cleanKey)) normalized['name'] = item[key];
        else if (['commissionvalue', 'commvalue'].includes(cleanKey)) normalized['commissionvalue'] = item[key];
        else if (['commissiontype', 'commtype'].includes(cleanKey)) normalized['commissiontype'] = item[key];
        else normalized[cleanKey] = item[key];
      } else if (sheetName === 'Product Info') {
        if (['productid', 'id', 'product_id'].includes(cleanKey)) normalized['productid'] = item[key];
        else if (['productname', 'name'].includes(cleanKey)) normalized['productname'] = item[key];
        else normalized[cleanKey] = item[key];
      } else if (sheetName === 'Keys') {
        if (['key', 'variable'].includes(cleanKey)) normalized['key'] = item[key];
        else if (['value', 'secret'].includes(cleanKey)) normalized['value'] = item[key];
        else normalized[cleanKey] = item[key];
      } else if (sheetName === 'Campaigns') {
        if (['campaignid', 'id', 'campaign_id'].includes(cleanKey)) normalized['campaignid'] = item[key];
        else normalized[cleanKey] = item[key];
      } else {
        // Fallback for generic sheets
        normalized[cleanKey] = item[key];
      }
    }
    return normalized;
  });
};

const getScriptUrl = () => localStorage.getItem('zenith_script_url') || '';

// POST helper to handle Google Apps Script with proper CORS
const postToScript = async (url: string, payload: any) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Zenith Bridge Error:", error);
    return { success: false, error: "Network error. Check Script Deployment or VPN." };
  }
};

export const sheetsService = {
  async fetchData(sheetName: string) {
    const url = getScriptUrl();
    if (!url) return normalizeData(this.getMockData(sheetName), sheetName);
    
    try {
      const response = await fetch(`${url}?action=read&sheet=${sheetName}`);
      const result = await response.json();
      if (result.success) return normalizeData(result.data, sheetName);
      return normalizeData(this.getMockData(sheetName), sheetName);
    } catch (error) {
      return normalizeData(this.getMockData(sheetName), sheetName);
    }
  },

  async createData(sheetName: string, data: any) {
    const url = getScriptUrl();
    if (!url) return { success: true };
    return await postToScript(url, { action: 'create', sheet: sheetName, data });
  },

  async updateData(sheetName: string, data: any, idKey: string, idValue: any) {
    const url = getScriptUrl();
    if (!url) return { success: true };
    return await postToScript(url, { action: 'update', sheet: sheetName, data, idKey, idValue });
  },

  async deleteData(sheetName: string, idKey: string, idValue: any) {
    const url = getScriptUrl();
    if (!url) {
      alert("Configure Apps Script URL in Settings first.");
      return { success: false };
    }
    const result = await postToScript(url, { action: 'delete', sheet: sheetName, idKey, idValue });
    if (!result.success) {
      alert(`Delete Error: ${result.error || 'Record match failed in Google Sheets'}`);
    } else {
      // Subtle alert or we could just return and let the page reload
      console.log("Zenith Bridge: Successfully deleted row.");
    }
    return result;
  },

  getMockData(sheetName: string) {
    switch(sheetName) {
      case 'Clients':
        return [{ client: 'Demo User', phone: '212600000000', price: 0, statuses: 'New' }];
      case 'Users':
        return [{ username: 'admin', password: '123', role: 'admin', name: 'Super Admin' }];
      default: return [];
    }
  }
};
