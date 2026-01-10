
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { sheetsService, cleanPhone } from '../services/sheetsService.ts';
import { 
  generateMarketingTemplate, generateAIImage, generateAIVideo, generateAIAudio 
} from '../services/geminiService.ts';
import { Campaign, Product, Client } from '../types.ts';
import { ICONS } from '../constants.tsx';
import { useNotify } from '../App.tsx';

const STAGES = [
  { id: 1, label: 'Architect', desc: 'Define Audience' },
  { id: 2, label: 'Strategy', desc: 'Select AI Angle' },
  { id: 3, label: 'Creative', desc: 'Neural Assets' },
  { id: 4, label: 'Transmission', desc: 'Live Launch' },
  { id: 5, label: 'Operation', desc: 'Mission Control' }
];

const AUDIENCE_SEGMENTS = [
  { id: 'ALL', label: 'Broadcast All', desc: 'Every client in database', icon: '🌍' },
  { id: 'VIP', label: 'VIP Network', desc: 'Confirmed status only', icon: '💎' },
  { id: 'COLD', label: 'Cold Leads', desc: 'New status only', icon: '❄️' },
  { id: 'RETURN', label: 'Returning', desc: 'Delivered status only', icon: '🔄' },
  { id: 'RECOVERY', label: 'Cart Recovery', desc: 'Pending status only', icon: '🛒' }
];

const API_VERSION = 'v21.0';

const WhatsAppHub: React.FC = () => {
  const { notify } = useNotify();
  const [currentStage, setCurrentStage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [keys, setKeys] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mediaLoading, setMediaLoading] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  
  const [variations, setVariations] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [aiImage, setAiImage] = useState<string | null>(null);
  const [aiVideo, setAiVideo] = useState<string | null>(null);
  const [aiAudio, setAiAudio] = useState<string | null>(null);
  const [activeAssetType, setActiveAssetType] = useState<'image' | 'video' | 'audio' | 'none'>('none');
  
  const [customMessage, setCustomMessage] = useState('');
  const [useCustomMessage, setUseCustomMessage] = useState(false);

  const [msgMode, setMsgMode] = useState<'text' | 'template'>('text');
  const [selectedTemplate, setSelectedTemplate] = useState({ name: 'hello_world', language: 'en_US' });
  const [templateButtonSuffix, setTemplateButtonSuffix] = useState('');

  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastLog, setBroadcastLog] = useState<{name: string, status: string, isError: boolean, details?: string}[]>([]);
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  const [selectedSenderAlias, setSelectedSenderAlias] = useState('');

  const [lastMission, setLastMission] = useState<any>(() => {
    const saved = localStorage.getItem('zenith_last_mission');
    return saved ? JSON.parse(saved) : null;
  });

  const [genPrompt, setGenPrompt] = useState({ 
    product: '', angle: 'Direct Benefit', audience: 'ALL', 
    language: localStorage.getItem('zenith_lang') || 'Moroccan Darija' 
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pData, clData, kData, tData] = await Promise.all([
        sheetsService.fetchData('Product Info'),
        sheetsService.fetchData('Clients'),
        sheetsService.fetchData('Keys'),
        sheetsService.fetchData('WhatsApp Templates')
      ]);
      setProducts(Array.isArray(pData) ? pData : []);
      setClients(Array.isArray(clData) ? clData : []);
      setKeys(Array.isArray(kData) ? kData : []);
      setTemplates(Array.isArray(tData) ? tData : []);
      
      const nodes = (Array.isArray(kData) ? kData : []).filter(k => k.key?.toLowerCase().trim().startsWith('whatsapp_node_'));
      if (nodes.length > 0) {
        setSelectedSenderAlias(nodes[0].key.replace(/whatsapp_node_/i, ''));
      } else {
        const genKey = (Array.isArray(kData) ? kData : []).find(k => k.key?.toLowerCase().trim() === 'whatsapp_phone_id');
        if (genKey) setSelectedSenderAlias('Default');
      }
    } catch (err) {
      notify("Failed to sync sheet data.", "error");
    }
    setLoading(false);
  };

  const currentAudience = useMemo(() => {
    if (!clients.length) return [];
    if (genPrompt.audience === 'ALL') return clients;
    if (genPrompt.audience === 'VIP') return clients.filter(c => c.statuses === 'Confirmed');
    if (genPrompt.audience === 'COLD') return clients.filter(c => c.statuses === 'New');
    if (genPrompt.audience === 'RETURN') return clients.filter(c => c.statuses === 'Delivered');
    if (genPrompt.audience === 'RECOVERY') return clients.filter(c => c.statuses === 'Pending');
    return clients;
  }, [clients, genPrompt.audience]);

  const systemCheck = useMemo(() => {
    const hasToken = keys.some(k => k.key?.toLowerCase().trim() === 'whatsapp_access_token');
    const hasPhone = keys.some(k => k.key?.toLowerCase().trim() === 'whatsapp_phone_id' || k.key?.toLowerCase().trim().startsWith('whatsapp_node_'));
    const missing = [];
    if (!hasToken) missing.push("whatsapp_access_token");
    if (!hasPhone) missing.push("whatsapp_phone_id");
    return { hasToken, hasPhone, ready: hasToken && hasPhone, missing };
  }, [keys]);

  const senderNodes = useMemo(() => {
    const nodes = keys.filter(k => k.key?.toLowerCase().trim().startsWith('whatsapp_node_')).map(k => ({
      alias: k.key.replace(/whatsapp_node_/i, ''),
      id: String(k.value || '').trim()
    }));
    if (nodes.length === 0) {
      const gen = keys.find(k => k.key?.toLowerCase().trim() === 'whatsapp_phone_id');
      if (gen) nodes.push({ alias: 'Default', id: String(gen.value || '').trim() });
    }
    return nodes;
  }, [keys]);

  const startArchitect = async () => {
    if (!genPrompt.product) return notify("Please select a product first.", "error");
    if (currentAudience.length === 0) return notify(`No recipients found for: ${genPrompt.audience}.`, "error");
    
    setIsGenerating(true);
    setCurrentStage(2); 
    
    try {
      const selectedProduct = products.find(p => p.productname === genPrompt.product) || products[0];
      const result = await generateMarketingTemplate(
        genPrompt.angle, genPrompt.product, selectedProduct?.description || "", genPrompt.audience, selectedProduct?.price || 0, genPrompt.language
      );
      if (result && result.variations) setVariations(result.variations);
      else throw new Error("Invalid variations response");
    } catch (e) { 
      notify("Neural Engine Encountered an Error.", "error"); 
      setCurrentStage(1);
    }
    setIsGenerating(false);
  };

  const createAsset = async (type: 'image' | 'video' | 'audio') => {
    if (selectedIndex === -1 && !useCustomMessage) return notify("Select a strategy first.", "error");
    const current = variations[selectedIndex] || { imagePrompt: 'Product photography', videoPrompt: 'Cinematic product showcase', audioScript: 'Exclusive offer for you' };
    setMediaLoading(type); setActiveAssetType(type);
    try {
      if (type === 'image') setAiImage(await generateAIImage(current.imagePrompt));
      else if (type === 'video') setAiVideo(await generateAIVideo(current.videoPrompt));
      else if (type === 'audio') {
        const audio = await generateAIAudio(current.audioScript);
        setAiAudio(`data:audio/mp4;base64,${audio}`);
      }
      notify(`Neural ${type} complete.`);
    } catch (e) { notify(`Neural synthesis failed.`, "error"); setActiveAssetType('none'); }
    setMediaLoading(null);
  };

  const handleLocalFile = (type: 'image' | 'video' | 'audio', file: File) => {
    setActiveAssetType(type);
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'image') setAiImage(reader.result as string);
      else if (type === 'video') setAiVideo(reader.result as string);
      else if (type === 'audio') setAiAudio(reader.result as string);
    };
    reader.readAsDataURL(file);
    notify(`Local ${type} linked.`);
  };

  const uploadToMeta = async (file: File, phoneId: string, token: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('messaging_product', 'whatsapp');
    const res = await fetch(`https://graph.facebook.com/${API_VERSION}/${phoneId}/media`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const data = await res.json();
    if (!res.ok) {
      if (data.error?.code === 190) throw new Error("Meta Session Expired. Please update your WhatsApp Access Token in Integrations.");
      throw new Error(data.error?.message || "Meta media upload failed");
    }
    return data.id;
  };

  const executeLaunch = async () => {
    if (currentAudience.length === 0) return notify("Error: Recipient list is empty.", "error");
    
    const activeNode = senderNodes.find(n => n.alias === selectedSenderAlias) || senderNodes[0];
    const phoneId = activeNode?.id;
    const rawAccessToken = keys.find(k => k.key?.toLowerCase().trim() === 'whatsapp_access_token')?.value;
    const accessToken = rawAccessToken ? String(rawAccessToken).trim() : '';
    
    if (!phoneId || !accessToken) return notify("Keys missing in Integrations.", "error");

    setIsBroadcasting(true); setProgress(0); setBroadcastLog([]);
    const activeDraft = useCustomMessage ? { messageText: customMessage } : variations[selectedIndex];
    if (!activeDraft) return notify("No message content selected.", "error");

    let mediaId = "";
    const missionStartTime = Date.now();

    try {
      if (activeAssetType !== 'none') {
        setBroadcastLog([{ name: "SYSTEM", status: "SYNCING MEDIA...", isError: false }]);
        const mediaData = activeAssetType === 'image' ? aiImage : activeAssetType === 'video' ? aiVideo : aiAudio;
        
        if (mediaData) {
          let file: File;
          const mimeMap: any = { image: 'image/jpeg', video: 'video/mp4', audio: 'audio/mp4' };
          const extMap: any = { image: 'jpg', video: 'mp4', audio: 'mp4' };

          if (mediaData.startsWith('data:')) {
            const arr = mediaData.split(',');
            const bstr = atob(arr[1]);
            let n = bstr.length; const u8arr = new Uint8Array(n);
            while(n--) u8arr[n] = bstr.charCodeAt(n);
            file = new File([u8arr], `media.${extMap[activeAssetType]}`, {type: mimeMap[activeAssetType]});
          } else {
            // It's an external URL (e.g. Veo video link)
            const response = await fetch(mediaData);
            const blob = await response.blob();
            file = new File([blob], `media.${extMap[activeAssetType]}`, { type: mimeMap[activeAssetType] });
          }

          mediaId = await uploadToMeta(file, phoneId, accessToken);
          setBroadcastLog([{ name: "SYSTEM", status: "MEDIA OK", isError: false }]);
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    } catch (e: any) { 
      setIsBroadcasting(false);
      const isExpired = e.message.toLowerCase().includes("expired");
      notify(isExpired ? "Meta Session Expired" : "Media Sync Failure", "error");
      return setBroadcastLog([{ name: "CRITICAL", status: isExpired ? "TOKEN EXPIRED" : "MEDIA FAIL", isError: true, details: e.message }]); 
    }

    let successCount = 0; let failedCount = 0;

    for (let i = 0; i < currentAudience.length; i++) {
      const client = currentAudience[i];
      const phone = cleanPhone(client.phone); 
      setTimeLeft(Math.ceil((currentAudience.length - i) * 1.5));
      setBroadcastLog(prev => [{ name: client.client, status: 'TRANSMITTING...', isError: false }, ...prev].slice(0, 20));

      try {
        let finalBody = activeDraft.messageText;
        if (templateButtonSuffix && msgMode === 'text') {
            finalBody += `\n\n🔗 Link: ${templateButtonSuffix}`;
        }

        let payload: any = { 
            messaging_product: "whatsapp", 
            to: phone, 
            recipient_type: "individual" 
        };

        if (msgMode === 'template') {
          payload.type = "template";
          payload.template = { 
            name: selectedTemplate.name, 
            language: { code: selectedTemplate.language } 
          };
          const components: any[] = [];
          
          if (selectedTemplate.name !== 'hello_world') {
             // Media Header
             if (mediaId && activeAssetType !== 'none' && activeAssetType !== 'audio') {
                components.push({ 
                    type: "header", 
                    parameters: [{ 
                        type: activeAssetType, 
                        [activeAssetType]: { id: mediaId } 
                    }] 
                });
             }
             // Body Mapping
             components.push({ 
                type: "body", 
                parameters: [{ type: "text", text: finalBody }] 
             });
             // Button Mapping
             if (templateButtonSuffix) {
                components.push({ 
                    type: "button", 
                    sub_type: "url", 
                    index: "0", 
                    parameters: [{ type: "text", text: templateButtonSuffix }] 
                });
             }
          }
          if (components.length > 0) payload.template.components = components;
        } else {
          // Direct Mode
          if (activeAssetType !== 'none' && mediaId) {
            payload.type = activeAssetType;
            payload[activeAssetType] = { id: mediaId };
            if (activeAssetType !== 'audio') payload[activeAssetType].caption = finalBody;
          } else {
            payload.type = "text";
            payload.text = { body: finalBody, preview_url: true };
          }
        }

        const res = await fetch(`https://graph.facebook.com/${API_VERSION}/${phoneId}/messages`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${accessToken}`, 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify(payload),
        });

        const resData = await res.json();
        if (res.ok) {
          successCount++;
          setBroadcastLog(prev => { const u = [...prev]; u[0].status = 'SUCCESS ✅'; return u; });
        } else {
          failedCount++;
          const errorMsg = resData.error?.message || "Rejection from Meta Cloud.";
          setBroadcastLog(prev => { 
            const u = [...prev]; 
            u[0].status = `ERROR ${resData.error?.code || 'Meta'}`; 
            u[0].isError = true;
            u[0].details = errorMsg;
            return u; 
          });
          if (resData.error?.code === 190) {
             notify("Session Expired Mid-Batch. Aborting.", "error");
             break;
          }
        }
      } catch (e: any) { 
        failedCount++;
        setBroadcastLog(prev => { const u = [...prev]; u[0].status = 'NETWORK FAIL'; u[0].isError = true; return u; });
      }
      setProgress(Math.round(((i + 1) / currentAudience.length) * 100));
      await new Promise(r => setTimeout(r, 1200));
    }

    const missionData = { sent: successCount, failed: failedCount, total: currentAudience.length, startTime: missionStartTime, endTime: Date.now(), productName: genPrompt.product, angleTitle: activeDraft.title || 'Manual', sender: selectedSenderAlias };
    setLastMission(missionData);
    localStorage.setItem('zenith_last_mission', JSON.stringify(missionData));
    setIsBroadcasting(false);
    setCurrentStage(5);
  };

  return (
    <div className="space-y-12 pb-24 animate-in fade-in duration-700">
      <input type="file" ref={imageInputRef} onChange={e => e.target.files?.[0] && handleLocalFile('image', e.target.files[0])} className="hidden" accept="image/*" />
      <input type="file" ref={videoInputRef} onChange={e => e.target.files?.[0] && handleLocalFile('video', e.target.files[0])} className="hidden" accept="video/*" />
      <input type="file" ref={audioInputRef} onChange={e => e.target.files?.[0] && handleLocalFile('audio', e.target.files[0])} className="hidden" accept="audio/*" />
      
      <div className="flex items-center justify-between max-w-5xl mx-auto mb-20 relative px-4">
         <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-800 -translate-y-1/2 -z-10"></div>
         <div className="absolute top-1/2 left-0 h-0.5 bg-indigo-500 -translate-y-1/2 -z-10 transition-all duration-700" style={{ width: `${((currentStage - 1) / 4) * 100}%` }}></div>
         {STAGES.map(s => (
           <div key={s.id} className="flex flex-col items-center gap-3">
             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black transition-all duration-500 border-2 ${currentStage >= s.id ? 'bg-indigo-600 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.5)] scale-110' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
               {currentStage > s.id ? <ICONS.Check className="w-6 h-6"/> : s.id}
             </div>
             <p className={`text-[10px] font-black uppercase tracking-widest ${currentStage >= s.id ? 'text-white' : 'text-slate-600'}`}>{s.label}</p>
           </div>
         ))}
      </div>

      {currentStage === 1 && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-10">
             <div className="glass-panel rounded-[3.5rem] p-12 border border-slate-800 shadow-2xl space-y-10">
                <div className="flex justify-between items-center">
                   <h2 className="text-3xl font-black uppercase italic tracking-tighter">Campaign Architect</h2>
                   <div className="flex gap-2">
                      <button onClick={() => setUseCustomMessage(!useCustomMessage)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${useCustomMessage ? 'bg-indigo-600 border-indigo-400' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                        {useCustomMessage ? 'Manual Mode: ON' : 'AI Mode: ON'}
                      </button>
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-4">Target Product</label>
                      <select value={genPrompt.product} onChange={e => setGenPrompt({...genPrompt, product: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-3xl p-6 font-black text-sm outline-none focus:border-indigo-500">
                         <option value="">Choose Inventory...</option>
                         {products.map(p => <option key={p.productid} value={p.productname}>{p.productname}</option>)}
                      </select>
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-4">Audience Cluster</label>
                      <select value={genPrompt.audience} onChange={e => setGenPrompt({...genPrompt, audience: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-3xl p-6 font-black text-sm outline-none focus:border-indigo-500">
                         {AUDIENCE_SEGMENTS.map(a => <option key={a.id} value={a.id}>{a.icon} {a.label}</option>)}
                      </select>
                   </div>
                </div>
                {useCustomMessage && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-4">Custom Message Content</label>
                    <textarea value={customMessage} onChange={e => setCustomMessage(e.target.value)} rows={4} className="w-full bg-slate-950 border border-slate-800 rounded-3xl p-6 font-medium text-sm outline-none focus:border-indigo-500 italic" placeholder="Type your WhatsApp message here..." dir="auto" />
                  </div>
                )}
                <button 
                  onClick={useCustomMessage ? () => setCurrentStage(3) : startArchitect} 
                  disabled={loading || (useCustomMessage ? !customMessage : !genPrompt.product)} 
                  className={`w-full py-8 rounded-full font-black text-xs uppercase tracking-[0.4em] shadow-2xl transition-all ${currentAudience.length === 0 ? 'bg-rose-900/50 text-rose-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
                >
                   {currentAudience.length === 0 ? 'NO RECIPIENTS FOUND' : (useCustomMessage ? 'PROCEED TO CREATIVE' : 'INITIATE NEURAL ENGINE')}
                </button>
             </div>
          </div>
          <div className="lg:col-span-4 space-y-6">
             <div className="glass-panel rounded-[3.5rem] p-10 border border-slate-800 shadow-2xl text-center">
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4">Recipient Reach</p>
                <h3 className="text-6xl font-black">{currentAudience.length}</h3>
                <p className="text-slate-400 text-xs font-bold mt-2">Active Targets</p>
             </div>
             <div className="glass-panel rounded-[2rem] p-6 border border-slate-800 overflow-y-auto max-h-[300px] space-y-2">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2 mb-4">Sync Preview</p>
                {currentAudience.map((c, i) => (
                  <div key={i} className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>{c.client}</span>
                    <span className="font-mono text-[9px]">{c.phone}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {currentStage === 2 && (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
          <h2 className="text-4xl font-black uppercase italic tracking-tighter text-center">Neural Strategies</h2>
          {isGenerating ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="glass-panel p-8 rounded-[2.5rem] border border-slate-800 h-[450px] animate-pulse flex flex-col justify-center items-center gap-6">
                   <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Generating Variation {i}...</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {variations.length > 0 ? variations.map((v, i) => (
                <div key={i} onClick={() => setSelectedIndex(i)} className={`glass-panel p-8 rounded-[2.5rem] border-2 cursor-pointer transition-all flex flex-col justify-between h-[450px] ${selectedIndex === i ? 'border-indigo-500 bg-indigo-500/5 shadow-[0_0_30px_rgba(99,102,241,0.2)]' : 'border-slate-800 hover:border-slate-700'}`}>
                  <div>
                    <div className="flex justify-between items-start mb-6">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{v.title}</span>
                        {selectedIndex === i && <ICONS.Check className="w-5 h-5 text-indigo-500" />}
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed line-clamp-10 italic" dir="rtl">{v.messageText}</p>
                  </div>
                  <button className={`w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${selectedIndex === i ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                    {selectedIndex === i ? 'SELECTED' : 'CHOOSE ANGLE'}
                  </button>
                </div>
              )) : (
                <div className="col-span-4 text-center py-20 bg-slate-900 rounded-[3rem] border border-slate-800">
                   <p className="text-slate-500 font-bold">Neural Engine Failure. Re-initiate from step 1.</p>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-center pt-10 gap-6">
             <button onClick={() => setCurrentStage(1)} className="px-10 py-5 bg-slate-800 hover:bg-slate-700 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all">Back</button>
             <button onClick={() => setCurrentStage(3)} disabled={selectedIndex === -1 || isGenerating} className="px-12 py-5 bg-indigo-600 hover:bg-indigo-500 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all disabled:opacity-50">Proceed</button>
          </div>
        </div>
      )}

      {currentStage === 3 && (
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-500">
           <div className="lg:col-span-7 space-y-8">
              <div className="glass-panel p-10 rounded-[3rem] border border-slate-800 space-y-10">
                 <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                    <h3 className="text-xl font-black uppercase italic tracking-tighter">Media Asset Center</h3>
                 </div>
                 <div className="space-y-6">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4 italic">Neural Generation Engine</p>
                    <div className="grid grid-cols-3 gap-4">
                        <button onClick={() => createAsset('image')} disabled={!!mediaLoading} className={`flex flex-col items-center gap-3 p-6 rounded-3xl border border-slate-800 transition-all ${activeAssetType === 'image' && aiImage?.startsWith('http') ? 'bg-indigo-600 border-indigo-400' : 'bg-slate-950 hover:bg-slate-900'}`}>
                           {mediaLoading === 'image' ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <ICONS.Sparkles className="w-6 h-6" />}
                           <span className="text-[10px] font-black uppercase tracking-widest">Neural Image</span>
                        </button>
                        <button onClick={() => createAsset('video')} disabled={!!mediaLoading} className={`flex flex-col items-center gap-3 p-6 rounded-3xl border border-slate-800 transition-all ${activeAssetType === 'video' && aiVideo?.startsWith('http') ? 'bg-indigo-600 border-indigo-400' : 'bg-slate-950 hover:bg-slate-900'}`}>
                           {mediaLoading === 'video' ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <ICONS.Sparkles className="w-6 h-6" />}
                           <span className="text-[10px] font-black uppercase tracking-widest">Neural Video</span>
                        </button>
                        <button onClick={() => createAsset('audio')} disabled={!!mediaLoading} className={`flex flex-col items-center gap-3 p-6 rounded-3xl border border-slate-800 transition-all ${activeAssetType === 'audio' && aiAudio?.startsWith('data:audio') ? 'bg-indigo-600 border-indigo-400' : 'bg-slate-950 hover:bg-slate-900'}`}>
                           {mediaLoading === 'audio' ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>}
                           <span className="text-[10px] font-black uppercase tracking-widest">Neural Audio</span>
                        </button>
                    </div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4 italic pt-4">Local Discovery Hub</p>
                    <div className="grid grid-cols-3 gap-4">
                        <button onClick={() => imageInputRef.current?.click()} className={`flex flex-col items-center gap-3 p-6 rounded-3xl border border-slate-800 transition-all ${activeAssetType === 'image' && aiImage && aiImage.startsWith('data:image') ? 'bg-indigo-600 border-indigo-400' : 'bg-slate-950 hover:bg-slate-900'}`}>
                           <ICONS.Plus className="w-6 h-6" />
                           <span className="text-[10px] font-black uppercase tracking-widest">Local Image</span>
                        </button>
                        <button onClick={() => videoInputRef.current?.click()} className={`flex flex-col items-center gap-3 p-6 rounded-3xl border border-slate-800 transition-all ${activeAssetType === 'video' && aiVideo && aiVideo.startsWith('data:video') ? 'bg-indigo-600 border-indigo-400' : 'bg-slate-950 hover:bg-slate-900'}`}>
                           <ICONS.Plus className="w-6 h-6" />
                           <span className="text-[10px] font-black uppercase tracking-widest">Local Video</span>
                        </button>
                        <button onClick={() => audioInputRef.current?.click()} className={`flex flex-col items-center gap-3 p-6 rounded-3xl border border-slate-800 transition-all ${activeAssetType === 'audio' && aiAudio && aiAudio.startsWith('data:audio') ? 'bg-indigo-600 border-indigo-400' : 'bg-slate-950 hover:bg-slate-900'}`}>
                           <ICONS.Plus className="w-6 h-6" />
                           <span className="text-[10px] font-black uppercase tracking-widest">Local Audio</span>
                        </button>
                    </div>
                 </div>
                 <div className="space-y-4 pt-10 border-t border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">CTA Action / Checkout Link</label>
                    </div>
                    <input 
                        value={templateButtonSuffix} 
                        onChange={e => setTemplateButtonSuffix(e.target.value)} 
                        placeholder="https://yourstore.com/checkout" 
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-sm font-bold text-indigo-400 outline-none focus:border-indigo-500 shadow-inner" 
                    />
                 </div>
              </div>
              <div className="flex gap-4">
                 <button onClick={() => setCurrentStage(useCustomMessage ? 1 : 2)} className="flex-1 py-6 bg-slate-800 hover:bg-slate-700 rounded-full text-[10px] font-black uppercase tracking-widest transition-all">Back</button>
                 <button onClick={() => setCurrentStage(4)} className="flex-[2] py-6 bg-indigo-600 hover:bg-indigo-500 rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl transition-all">Finalize Mission</button>
              </div>
           </div>
           <div className="lg:col-span-5">
              <div className="glass-panel p-1 rounded-[3.5rem] border border-slate-800 overflow-hidden sticky top-8">
                 <div className="bg-slate-900 p-8 space-y-6">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest text-center">Synthesis Output Preview</p>
                    <div className="bg-indigo-900/10 rounded-[2.5rem] p-8 border border-indigo-500/10 space-y-6">
                        {activeAssetType !== 'none' && (
                           <div className="aspect-video rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center relative shadow-inner">
                              {mediaLoading && <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>}
                              {!mediaLoading && activeAssetType === 'image' && aiImage && <img src={aiImage} className="w-full h-full object-cover" />}
                              {!mediaLoading && activeAssetType === 'video' && aiVideo && <video src={aiVideo} className="w-full h-full object-cover" controls autoPlay muted loop />}
                              {!mediaLoading && activeAssetType === 'audio' && aiAudio && (
                                <div className="flex flex-col items-center gap-4">
                                   <div className="w-16 h-16 bg-indigo-600/20 rounded-full flex items-center justify-center animate-pulse">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                                   </div>
                                   <audio src={aiAudio} controls className="h-10 w-48" />
                                </div>
                              )}
                           </div>
                        )}
                        <p className="text-xl text-slate-200 font-medium leading-relaxed italic" dir="rtl">
                           {useCustomMessage ? customMessage : variations[selectedIndex]?.messageText}
                        </p>
                        {templateButtonSuffix && (
                          <div className="bg-indigo-600/20 p-4 rounded-2xl border border-indigo-500/20 text-center">
                             <p className="text-[10px] text-slate-300 font-mono truncate">{templateButtonSuffix}</p>
                          </div>
                        )}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {currentStage === 4 && (
        <div className="max-w-4xl mx-auto glass-panel p-16 rounded-[4rem] border border-slate-800 relative shadow-2xl">
           {!systemCheck.ready && (
             <div className="absolute inset-0 bg-slate-950/95 z-50 flex flex-col items-center justify-center p-12 text-center rounded-[4rem]">
                <h4 className="text-2xl font-black uppercase italic tracking-tighter text-white mb-2">Meta Credentials Offline</h4>
                <button onClick={() => window.location.reload()} className="px-10 py-5 bg-indigo-600 hover:bg-indigo-500 rounded-full text-[10px] font-black uppercase tracking-[0.3em] transition-all">Retry Handshake</button>
             </div>
           )}
           <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-10 text-center">Transmission Core</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <div className="p-6 bg-slate-950/50 border border-slate-800 rounded-3xl">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 block italic">Sending Node</label>
                <select value={selectedSenderAlias} onChange={e => setSelectedSenderAlias(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm font-black text-white outline-none uppercase appearance-none">
                  {senderNodes.map(node => <option key={node.alias} value={node.alias}>{node.alias} ({node.id.slice(-4)})</option>)}
                </select>
              </div>
              <div className="p-6 bg-slate-950/50 border border-slate-800 rounded-3xl">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 block italic">WhatsApp Profile Mode</label>
                <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
                  <button onClick={() => setMsgMode('text')} className={`flex-1 px-4 py-2.5 rounded-md text-[9px] font-black uppercase transition-all ${msgMode === 'text' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>Direct Msg</button>
                  <button onClick={() => setMsgMode('template')} className={`flex-1 px-4 py-2.5 rounded-md text-[9px] font-black uppercase transition-all ${msgMode === 'template' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>Template</button>
                </div>
              </div>
           </div>
           {msgMode === 'template' && (
             <div className="mb-10 p-6 bg-slate-950/50 border border-indigo-500/20 rounded-3xl animate-in zoom-in-95">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 block">Meta Template Select</label>
                <select className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm font-black text-white outline-none uppercase appearance-none" value={selectedTemplate.name} onChange={e => {
                  const found = templates.find(t => t.name === e.target.value);
                  if (found) setSelectedTemplate({ name: found.name, language: found.language || 'en_US' });
                  else setSelectedTemplate({ ...selectedTemplate, name: e.target.value });
                }}>
                  {templates.map(t => <option key={t.name} value={t.name}>{t.name} ({t.language})</option>)}
                  <option value="hello_world">hello_world (en_US)</option>
                </select>
             </div>
           )}
           <div className="space-y-8">
              <div className="p-10 bg-slate-950 border border-slate-800 rounded-[3rem]">
                 <div className="text-right mb-6">
                    <p className="text-lg text-slate-300 leading-relaxed italic" dir="rtl">
                       "{useCustomMessage ? customMessage : variations[selectedIndex]?.messageText}"
                    </p>
                    {templateButtonSuffix && <p className="text-xs text-indigo-400 mt-2 font-mono">{templateButtonSuffix}</p>}
                 </div>
              </div>
              {isBroadcasting && (
                <div className="space-y-4">
                  <div className="flex justify-between text-[10px] font-black text-indigo-400 tracking-widest">
                    <span>TRANSMITTING BATCH...</span>
                    <span>{progress}% COMPLETE</span>
                  </div>
                  <div className="h-64 overflow-y-auto bg-slate-900/80 rounded-[2.5rem] p-10 border border-slate-800 font-mono text-[11px] space-y-6 custom-scrollbar">
                    {broadcastLog.map((log, i) => (
                        <div key={i} className="border-b border-slate-800/50 pb-4 last:border-0 animate-in slide-in-from-left-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-slate-400 font-black uppercase tracking-widest">{log.name}</span>
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${log.isError ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>{log.status}</span>
                          </div>
                          {log.details && <p className="text-slate-500 leading-relaxed text-[10px] bg-slate-950/50 p-3 rounded-xl border border-rose-500/10">{log.details}</p>}
                        </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-4">
                <button onClick={executeLaunch} disabled={isBroadcasting} className="w-full py-8 bg-indigo-600 hover:bg-indigo-500 rounded-full font-black text-sm uppercase tracking-[0.5em] transition-all shadow-2xl shadow-indigo-600/30 disabled:opacity-50">
                   {isBroadcasting ? `VELOCITY: ${progress}%` : 'ENGAGE MISSION'}
                </button>
                <button onClick={() => setCurrentStage(3)} disabled={isBroadcasting} className="w-full py-4 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-white transition-all">Modify Payload</button>
              </div>
           </div>
        </div>
      )}

      {currentStage === 5 && (
        <div className="max-w-7xl mx-auto space-y-12 animate-in slide-in-from-bottom duration-700">
           <h2 className="text-5xl font-black uppercase italic tracking-tighter text-center">Transmission Debrief</h2>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="glass-panel p-10 rounded-[3rem] border border-emerald-500/20 bg-emerald-500/5 text-center">
                 <p className="text-[10px] font-black text-emerald-400 uppercase mb-4 tracking-widest">Delivered OK</p>
                 <h3 className="text-6xl font-black text-emerald-400">{lastMission?.sent || 0}</h3>
              </div>
              <div className="glass-panel p-10 rounded-[3rem] border border-rose-500/20 bg-rose-500/5 text-center">
                 <p className="text-[10px] font-black text-rose-400 uppercase mb-4 tracking-widest">Failures</p>
                 <h3 className="text-6xl font-black text-rose-400">{lastMission?.failed || 0}</h3>
              </div>
              <div className="glass-panel p-10 rounded-[3rem] border border-indigo-800 bg-slate-900/40 text-center">
                 <p className="text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest">Total Batch</p>
                 <h3 className="text-6xl font-black text-slate-300">{lastMission?.total || 0}</h3>
              </div>
           </div>
           <button onClick={() => { setCurrentStage(1); setBroadcastLog([]); setUseCustomMessage(false); }} className="w-full py-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-black text-xs uppercase tracking-[0.5em] transition-all">START NEXT MISSION</button>
        </div>
      )}
    </div>
  );
};

export default WhatsAppHub;
