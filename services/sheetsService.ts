
// Utility to clean phone numbers for Meta WhatsApp E.164 compatibility
export const cleanPhone = (phone: string) => {
  if (!phone) return '';
  // Remove all non-numeric characters
  let cleaned = phone.toString().replace(/\D/g, '');
  
  // Handle Moroccan local format (06... or 07... -> 2126... / 2127...)
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '212' + cleaned.substring(1);
  }
  
  // If user typed 21206... remove the extra zero
  if (cleaned.startsWith('2120') && cleaned.length === 13) {
    cleaned = '212' + cleaned.substring(4);
  }

  // Final check: ensure no leading zeros at all for Meta
  return cleaned;
};

// Normalizes sheet data to consistent frontend keys
const normalizeData = (data: any[], sheetName: string) => {
  if (!Array.isArray(data)) return [];
  return data.map(item => {
    const normalized: any = {};
    for (const key in item) {
      const cleanKey = key.toLowerCase().trim().replace(/\s+/g, '');
      
      if (sheetName === 'Clients') {
        if (['client', 'clientname', 'customer', 'name'].includes(cleanKey)) normalized['client'] = item[key];
        else if (['phone', 'phonenumber', 'whatsapp', 'tel', 'mobile'].includes(cleanKey)) normalized['phone'] = item[key];
        else if (['price', 'amount', 'total'].includes(cleanKey)) normalized['price'] = item[key];
        else if (['status', 'statuses', 'orderstatus'].includes(cleanKey)) normalized['statuses'] = item[key];
        else normalized[cleanKey] = item[key];
      } else if (sheetName === 'Keys') {
        const kValue = item[key] ? item[key].toString().toLowerCase().trim() : '';
        if (['key', 'variable', 'name'].includes(cleanKey)) normalized['key'] = kValue;
        else if (['value', 'secret', 'data'].includes(cleanKey)) normalized['value'] = item[key];
        else normalized[cleanKey] = item[key];
      } else {
        normalized[cleanKey] = item[key];
      }
    }
    return normalized;
  });
};

const getScriptUrl = () => localStorage.getItem('zenith_script_url') || '';

const postToScript = async (url: string, payload: any) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    return await response.json();
  } catch (error) {
    console.error("Zenith Bridge Error:", error);
    return { success: false, error: "Network error." };
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
    if (!url) return { success: false };
    return await postToScript(url, { action: 'delete', sheet: sheetName, idKey, idValue });
  },

  getMockData(sheetName: string) {
    switch(sheetName) {
      case 'Clients': return [{ client: 'Demo User', phone: '212600000000', price: 0, statuses: 'New' }];
      case 'Users': return [{ username: 'admin', password: '123', role: 'admin', name: 'Super Admin' }];
      case 'WhatsApp Templates': return [{ name: 'hello_world', language: 'en_US' }];
      default: return [];
    }
  }
};
