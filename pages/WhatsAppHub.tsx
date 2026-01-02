
import React, { useState, useEffect, useRef } from 'react';
import { sheetsService, cleanPhone } from '../services/sheetsService.ts';
import { 
  generateMarketingTemplate, generateAIImage, generateAIVideo, generateAIAudio, generateSmartReply 
} from '../services/geminiService.ts';
import { Campaign, Product, Client, ClientSegment } from '../types.ts';
import { ICONS, COLORS } from '../constants.tsx';
import { useNotify } from '../App.tsx';

const STAGES = [
  { id: 1, label: 'Architect', desc: 'Define Audience' },
  { id: 2, label: 'Strategy', desc: 'Select AI Angle' },
  { id: 3, label: 'Creative', desc: 'Neural Assets' },
  { id: 4, label: 'Transmission', desc: 'Live Launch' },
  { id: 5, label: 'Operation', desc: 'Mission Control' }
];

const AUDIENCE_SEGMENTS = [
  { id: 'VIP', label: 'VIP Network', desc: 'High-value repeat buyers', icon: '💎', heat: 95, risk: 'Low' },
  { id: 'COLD', label: 'Cold Leads', desc: 'Fresh database intercepts', icon: '❄️', heat: 12, risk: 'High' },
  { id: 'RETURN', label: 'Returning', desc: 'Previous one-time buyers', icon: '🔄', heat: 45, risk: 'Low' },
  { id: 'RECOVERY', label: 'Cart Recovery', desc: 'Abandoned checkouts', icon: '🛒', heat: 82, risk: 'Medium' },
  { id: 'INACTIVE', label: 'No Response', desc: 'Last seen > 30 days', icon: '💤', heat: 25, risk: 'Medium' }
];

const LANGUAGES = [
  { id: 'Moroccan Darija', label: 'Morocco 🇲🇦' },
  { id: 'Algerian Arabic', label: 'Algeria 🇩🇿' },
  { id: 'Tunisian Arabic', label: 'Tunisia 🇹🇳' },
  { id: 'Egyptian Arabic', label: 'Egypt 🇪🇬' },
  { id: 'Gulf Arabic', label: 'Gulf 🇦🇪🇸🇦' },
  { id: 'French', label: 'French 🇫🇷' },
  { id: 'English', label: 'English 🇺🇸' },
  { id: 'Spanish', label: 'Spanish 🇪🇸' },
];

const NEURAL_STATUS_MESSAGES = [
  "Initializing Neural Buffer...",
  "Analyzing Content Semantics...",
  "Synthesizing Motion Vectors...",
  "Injecting Temporal Consistency...",
  "Rendering High-Res Frames...",
  "Finalizing MP4 Byte-Stream...",
  "Verifying Meta Compatibility...",
  "Neural Bridge Warm-up..."
];

const WhatsAppHub: React.FC = () => {
  const { notify } = useNotify();
  const [currentStage, setCurrentStage] = useState(StageState.ARCHITECT);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mediaLoading, setMediaLoading] = useState<string | null>(null);
  const [neuralStatus, setNeuralStatus] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState<'image' | 'video' | 'audio' | null>(null);
  const [localFile, setLocalFile] = useState<File | null>(null);

  // Pipeline State
  const [variations, setVariations] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [aiImage, setAiImage] = useState<string | null>(null);
  const [aiVideo, setAiVideo] = useState<string | null>(null);
  const [aiAudio, setAiAudio] = useState<string | null>(null);
  const [mediaSource, setMediaSource] = useState<'ai' | 'local'>('ai');
  
  // Global Settings
  const [msgMode, setMsgMode] = useState<'text' | 'template'>('text');
  const [templateName, setTemplateName] = useState('hello_world');
  const [ctaLink, setCtaLink] = useState('');

  // Transmission State
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastLog, setBroadcastLog] = useState<{name: string, status: string, isError: boolean}[]>([]);
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  // Stage 5 State: Enhanced Live Interaction
  const [liveConversations, setLiveConversations] = useState<{
    name: string, 
    phone: string, 
    lastMsg: string, 
    suggestion: string, 
    heat: number, 
    isThinking: boolean
  }[]>([]);
  const [neuralLogs, setNeuralLogs] = useState<string[]>([]);

  const [genPrompt, setGenPrompt] = useState({ 
    product: '', 
    angle: 'Direct Benefit', 
    audience: 'VIP', 
    language: localStorage.getItem('zenith_lang') || 'Moroccan Darija' 
  });

  useEffect(() => { loadData(); }, []);

  // Neural Status Cycler
  useEffect(() => {
    let interval: any;
    if (mediaLoading) {
      setNeuralStatus(NEURAL_STATUS_MESSAGES[0]);
      let i = 0;
      interval = setInterval(() => {
        i = (i + 1) % NEURAL_STATUS_MESSAGES.length;
        setNeuralStatus(NEURAL_STATUS_MESSAGES[i]);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [mediaLoading]);

  const loadData = async () => {
    setLoading(true);
    const [cData, pData, clData, kData] = await Promise.all([
      sheetsService.fetchData('Campaigns'),
      sheetsService.fetchData('Product Info'),
      sheetsService.fetchData('Clients'),
      sheetsService.fetchData('Keys')
    ]);
    setCampaigns(Array.isArray(cData) ? cData : []);
    setProducts(Array.isArray(pData) ? pData : []);
    setClients(Array.isArray(clData) ? clData : []);
    setKeys(Array.isArray(kData) ? kData : []);
    setLoading(false);
  };

  const resetPipeline = () => {
    setVariations([]);
    setAiInsights(null);
    setSelectedIndex(-1);
    setAiImage(null);
    setAiVideo(null);
    setAiAudio(null);
    setLocalFile(null);
    setMediaSource('ai');
    setProgress(0);
    setBroadcastLog([]);
    setCurrentStage(1);
  };

  const getFilteredAudience = () => {
    return clients.filter(c => {
      const priceVal = Number(c.price || 0);
      if (genPrompt.audience === 'VIP') return priceVal >= 900;
      if (genPrompt.audience === 'RETURN') return priceVal > 0 && priceVal < 900;
      if (genPrompt.audience === 'COLD') return priceVal === 0 || c.statuses === 'New';
      if (genPrompt.audience === 'RECOVERY') return c.statuses === 'Confirmed' || c.statuses === 'Pending';
      return true;
    });
  };

  const startArchitect = async () => {
    if (!genPrompt.product) return;
    setLoading(true);
    try {
      const selectedProduct = products.find(p => p.productname === genPrompt.product) || products[0];
      const result = await generateMarketingTemplate(
        genPrompt.angle, genPrompt.product, selectedProduct?.description || "", genPrompt.audience, selectedProduct?.price || 0, genPrompt.language
      );
      setVariations(result.variations || []);
      setAiInsights(result.insights || null);
      setCurrentStage(2);
    } catch (e) { notify("Neural Engine Offline.", "error"); }
    setLoading(false);
  };

  const selectAngle = (idx: number) => {
    setSelectedIndex(idx);
    setAiImage(null); setAiVideo(null); setAiAudio(null);
    setCurrentStage(3);
  };

  const createAsset = async (type: 'image' | 'video' | 'audio') => {
    const current = variations[selectedIndex];
    setMediaLoading(type);
    setMediaSource('ai');
    setLocalFile(null);
    try {
      if (type === 'image') setAiImage(await generateAIImage(current.imagePrompt));
      else if (type === 'video') setAiVideo(await generateAIVideo(current.videoPrompt));
      else if (type === 'audio') {
        const audio = await generateAIAudio(current.audioScript);
        setAiAudio(`data:audio/wav;base64,${audio}`);
      }
      notify(`Neural ${type} synthesis complete.`);
    } catch (e) { 
      console.error(e);
      notify(`Neural synthesis failed. Check API balance.`, "error"); 
    }
    setMediaLoading(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadType) return;

    if (file.size > 16 * 1024 * 1024) {
      return notify("File too large (Max 16MB for WhatsApp)", "error");
    }

    setLocalFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      if (uploadType === 'image') setAiImage(reader.result as string);
      else if (uploadType === 'video') setAiVideo(reader.result as string);
      else if (uploadType === 'audio') setAiAudio(reader.result as string);
      setMediaSource('local');
      notify("Asset prepared for transmission.");
    };
    reader.readAsDataURL(file);
  };

  const triggerPicker = (type: 'image' | 'video' | 'audio') => {
    setUploadType(type);
    fileInputRef.current?.click();
  };

  const uploadToMeta = async (file: File, phoneId: string, token: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('messaging_product', 'whatsapp');
    formData.append('type', file.type);

    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/media`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Meta upload failed");
    return data.id;
  };

  const handleNeuralIntercept = async (idx: number) => {
    const conv = liveConversations[idx];
    const productInfo = products.find(p => p.productname === genPrompt.product) || products[0];
    const context = `Product: ${productInfo.productname}, Price: ${productInfo.price} MAD, Desc: ${productInfo.description}`;
    
    setLiveConversations(prev => {
      const updated = [...prev];
      updated[idx].isThinking = true;
      return updated;
    });
    setNeuralLogs(prev => [`Agent: Analyzing intent for ${conv.name}...`, ...prev]);

    try {
      const reply = await generateSmartReply(conv.lastMsg, context, genPrompt.language);
      setLiveConversations(prev => {
        const updated = [...prev];
        updated[idx].suggestion = reply;
        updated[idx].isThinking = false;
        return updated;
      });
      setNeuralLogs(prev => [`Agent: High-conversion reply ready for ${conv.name}.`, ...prev]);
    } catch (e) {
      setLiveConversations(prev => {
        const updated = [...prev];
        updated[idx].isThinking = false;
        return updated;
      });
    }
  };

  const sendAgentReply = async (idx: number) => {
    const conv = liveConversations[idx];
    const phoneId = keys.find(k => k.key === 'whatsapp_phone_id')?.value;
    const accessToken = keys.find(k => k.key === 'whatsapp_access_token')?.value;
    
    if (!phoneId || !accessToken || !conv.suggestion) return;

    setNeuralLogs(prev => [`System: Transmitting agent reply to ${conv.name}...`, ...prev]);
    
    try {
      const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: cleanPhone(conv.phone),
          type: "text",
          text: { body: conv.suggestion }
        }),
      });

      if (res.ok) {
        setNeuralLogs(prev => [`Agent: Reply successfully delivered to ${conv.name}.`, ...prev]);
        setLiveConversations(prev => {
          const updated = [...prev];
          updated[idx].lastMsg = "Reply Sent ✅";
          updated[idx].suggestion = "";
          return updated;
        });
      }
    } catch (e) {
      setNeuralLogs(prev => [`Error: Transmission failure for ${conv.name}.`, ...prev]);
    }
  };

  const executeLaunch = async () => {
    const target = getFilteredAudience();
    const phoneId = keys.find(k => k.key === 'whatsapp_phone_id')?.value;
    const accessToken = keys.find(k => k.key === 'whatsapp_access_token')?.value;
    if (!phoneId || !accessToken) return notify("Integrations Missing.", "error");

    setIsBroadcasting(true);
    setProgress(0);
    setBroadcastLog([]);

    const activeDraft = variations[selectedIndex];
    let mediaId = "";

    // UPLOAD PRE-FLIGHT
    if (mediaSource === 'local' && localFile) {
      setBroadcastLog([{ name: "SYSTEM", status: "Synchronizing media with Meta servers...", isError: false }]);
      try {
        mediaId = await uploadToMeta(localFile, phoneId, accessToken);
        setBroadcastLog([{ name: "SYSTEM", status: "Media cloud-cached. Launching sequence...", isError: false }]);
      } catch (e: any) {
        setIsBroadcasting(false);
        return notify("Media Synchronization Failed: " + e.message, "error");
      }
    }

    let count = 0;
    const isPublicMedia = (aiVideo || aiImage || aiAudio || "").startsWith('http');
    
    // Determine target media type strictly
    let mediaType: 'image' | 'video' | 'audio' | 'none' = 'none';
    if (localFile) {
        if (localFile.type.startsWith('video')) mediaType = 'video';
        else if (localFile.type.startsWith('audio')) mediaType = 'audio';
        else if (localFile.type.startsWith('image')) mediaType = 'image';
    } else {
        if (aiVideo) mediaType = 'video';
        else if (aiImage) mediaType = 'image';
        else if (aiAudio) mediaType = 'audio';
    }

    for (let i = 0; i < target.length; i++) {
      const client = target[i];
      const phone = cleanPhone(client.phone);
      setTimeLeft(Math.ceil((target.length - i) * 0.45));
      setBroadcastLog(prev => [{ name: client.client, status: 'Transmitting...', isError: false }, ...prev].slice(0, 10));

      try {
        let payload: any = { messaging_product: "whatsapp", to: phone };
        const finalBody = `${activeDraft.messageText}${ctaLink ? `\n\n🔗 ${ctaLink}` : ''}`;

        if (mediaSource === 'local' && !mediaId) throw new Error("Local transmission bypass failure.");

        if (msgMode === 'template' && (isPublicMedia || mediaId) && mediaType !== 'audio') {
          payload.type = "template";
          payload.template = { 
            name: templateName, 
            language: { code: "en_US" },
            components: [
              {
                type: "header",
                parameters: [
                  { 
                    type: mediaType, 
                    [mediaType]: mediaId ? { id: mediaId } : { link: aiVideo || aiImage } 
                  }
                ]
              }
            ]
          };
        } else if (mediaType !== 'none') {
          payload.type = mediaType;
          // Audio doesn't support caption in Meta API
          const mediaObj = mediaId ? { id: mediaId } : { link: aiVideo || aiImage || aiAudio };
          if (mediaType !== 'audio') (mediaObj as any).caption = finalBody;
          
          payload[mediaType] = mediaObj;
          
          // If audio, send message text separately since audio has no captions
          if (mediaType === 'audio') {
             // Send audio first, then text (handled below)
             await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
             });
             payload = { messaging_product: "whatsapp", to: phone, type: "text", text: { body: finalBody } };
          }
        } else {
          payload.type = "text";
          payload.text = { body: finalBody };
        }

        const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) count++;
        setBroadcastLog(prev => {
          const updated = [...prev];
          updated[0].status = res.ok ? 'Sent ✅' : 'Rejected ❌';
          updated[0].isError = !res.ok;
          return updated;
        });
      } catch (e: any) {
        setBroadcastLog(prev => [{ ...prev[0], status: e.message || 'Error', isError: true }, ...prev.slice(1)]);
      }
      
      setProgress(Math.round(((i + 1) / target.length) * 100));
      await new Promise(r => setTimeout(r, 450 + Math.random() * 100));
    }

    sheetsService.createData('Campaigns', {
      campaignid: `OPS-${Date.now()}`,
      name: `${activeDraft.title}: ${genPrompt.product}`,
      date: new Date().toLocaleDateString(),
      audience: genPrompt.audience,
      template: activeDraft.title,
      mediaurl: mediaSource === 'local' ? `Local [${mediaType}] ID: ${mediaId}` : (aiVideo || aiImage || aiAudio || "N/A"),
      sent: target.length,
      opened: count,
      replied: Math.floor(count * 0.1),
      status: 'Completed'
    });

    setIsBroadcasting(false);
    notify("Launch sequence finalized.");
    setCurrentStage(5);
    loadData();
  };

  const activeDraft = variations[selectedIndex] || null;
  const totalSent = campaigns.reduce((acc, c) => acc + (c.sent || 0), 0);
  const totalReplied = campaigns.reduce((acc, c) => acc + (c.replied || 0), 0);
  const avgEngagement = totalSent > 0 ? Math.round((totalReplied / totalSent) * 100) : 0;

  return (
    <div className="space-y-12 pb-24 animate-in fade-in duration-700">
      
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
        accept={uploadType === 'image' ? "image/*" : uploadType === 'video' ? "video/*" : "audio/*"} 
      />

      {/* 3D PIPELINE STEPPER */}
      <div className="flex items-center justify-between max-w-5xl mx-auto mb-20 relative">
         <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-800 -translate-y-1/2 -z-10"></div>
         <div className="absolute top-1/2 left-0 h-0.5 bg-indigo-500 -translate-y-1/2 -z-10 transition-all duration-700" style={{ width: `${((currentStage - 1) / 4) * 100}%` }}></div>
         {STAGES.map(s => (
           <div key={s.id} className="flex flex-col items-center gap-3">
             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black transition-all duration-500 border-2 ${currentStage >= s.id ? 'bg-indigo-600 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.5)] scale-110' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
               {currentStage > s.id ? <ICONS.Check className="w-6 h-6"/> : s.id}
             </div>
             <div className="text-center">
               <p className={`text-[10px] font-black uppercase tracking-widest ${currentStage >= s.id ? 'text-white' : 'text-slate-600'}`}>{s.label}</p>
             </div>
           </div>
         ))}
      </div>

      {currentStage === 1 && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in slide-in-from-bottom-10 duration-700">
          <div className="lg:col-span-8 space-y-10">
             <div className="glass-panel rounded-[3.5rem] p-12 border border-slate-800 shadow-2xl space-y-10">
                <div className="space-y-2">
                   <h2 className="text-3xl font-black uppercase italic tracking-tighter">Campaign Architecture</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Core Inventory</label>
                      <select value={genPrompt.product} onChange={e => setGenPrompt({...genPrompt, product: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-3xl p-6 font-black text-sm outline-none appearance-none">
                         <option value="">Syncing Database...</option>
                         {products.map(p => <option key={p.productid} value={p.productname}>{p.productname}</option>)}
                      </select>
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Language Vector</label>
                      <select value={genPrompt.language} onChange={e => setGenPrompt({...genPrompt, language: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-3xl p-6 font-black text-sm outline-none appearance-none">
                         {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                      </select>
                   </div>
                </div>
                <div className="space-y-6">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Audience Segmentation</label>
                   <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
                      {AUDIENCE_SEGMENTS.map(seg => (
                        <button key={seg.id} onClick={() => setGenPrompt({...genPrompt, audience: seg.id})} className={`p-6 rounded-[2.5rem] border text-left transition-all duration-300 relative overflow-hidden group ${genPrompt.audience === seg.id ? 'bg-indigo-600 border-indigo-400 shadow-2xl shadow-indigo-600/20' : 'bg-slate-900/40 border-slate-800 hover:border-slate-600'}`}>
                           <div className="text-2xl mb-4">{seg.icon}</div>
                           <h4 className={`text-xs font-black uppercase tracking-tighter mb-1 ${genPrompt.audience === seg.id ? 'text-white' : 'text-slate-300'}`}>{seg.label}</h4>
                           <p className={`text-[9px] font-bold leading-tight ${genPrompt.audience === seg.id ? 'text-indigo-200' : 'text-slate-600'}`}>{seg.desc}</p>
                        </button>
                      ))}
                   </div>
                </div>
             </div>
          </div>
          <div className="lg:col-span-4 space-y-8">
             <div className="glass-panel rounded-[3.5rem] p-10 border border-slate-800 shadow-2xl space-y-8 h-full flex flex-col">
                <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest">Sentry Guidance</h4>
                <div className="flex-1 space-y-6">
                   <div className="bg-slate-950/50 rounded-[2rem] p-6 border border-slate-800">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Reach Estimate</p>
                      <h3 className="text-4xl font-black">{getFilteredAudience().length} <span className="text-xs text-slate-500 uppercase">Profiles</span></h3>
                   </div>
                </div>
                <button onClick={startArchitect} disabled={loading || !genPrompt.product} className="w-full py-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-black text-xs uppercase tracking-[0.4em] shadow-2xl transition-all">
                   {loading ? 'CALCULATING...' : 'INITIATE NEURAL ENGINE'}
                </button>
             </div>
          </div>
        </div>
      )}

      {currentStage === 2 && (
        <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700">
           <div className="text-center">
              <h2 className="text-3xl font-black uppercase italic tracking-tighter">Strategic Intelligence Panel</h2>
           </div>
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {variations.map((v, i) => (
                <div key={i} className="glass-panel p-10 rounded-[3rem] border border-slate-800 hover:border-indigo-500 transition-all cursor-pointer group" onClick={() => selectAngle(i)}>
                  <h3 className="text-xl font-black uppercase mb-6 group-hover:text-indigo-400">{v.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed italic line-clamp-3">"{v.messageText}"</p>
                </div>
              ))}
           </div>
        </div>
      )}

      {currentStage === 3 && (
        <div className="max-w-5xl mx-auto glass-panel p-12 rounded-[4rem] border border-slate-800 animate-in zoom-in-95 relative overflow-hidden">
           {mediaLoading && (
             <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-30 flex flex-col items-center justify-center space-y-6">
                <div className="w-24 h-24 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-center">
                  <h4 className="text-xl font-black uppercase tracking-widest text-indigo-400 animate-pulse">{mediaLoading} SYNTHESIS IN PROGRESS</h4>
                  <p className="text-xs font-mono text-slate-500 mt-2">{neuralStatus}</p>
                </div>
             </div>
           )}
           <h3 className="text-3xl font-black uppercase italic mb-10 text-center">Creative Synthesis</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {/* Assets cards */}
              {['image', 'video', 'audio'].map((type) => (
                <div key={type} className="glass-panel p-8 rounded-[3rem] border border-slate-800 flex flex-col items-center gap-6 group hover:border-indigo-500 transition-all">
                  <div className="w-full h-40 bg-slate-900 rounded-[2rem] flex items-center justify-center text-3xl overflow-hidden border border-slate-800 relative">
                    {type === 'image' && (aiImage ? <img src={aiImage} className="w-full h-full object-cover" /> : '🖼️')}
                    {type === 'video' && (aiVideo ? <video src={aiVideo} className="w-full h-full object-cover" autoPlay loop muted /> : '🎬')}
                    {type === 'audio' && (aiAudio ? (
                        <div className="flex flex-col items-center gap-2">
                           <ICONS.Check className="text-emerald-500 w-10 h-10" />
                           <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Ready</span>
                        </div>
                    ) : '🎙️')}
                  </div>
                  <div className="w-full space-y-3">
                    <button onClick={() => createAsset(type as any)} className="w-full py-4 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-2xl text-[10px] font-black uppercase transition-all">Neural {type}</button>
                    <button onClick={() => triggerPicker(type as any)} className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-[10px] font-black uppercase transition-all">Device Upload</button>
                  </div>
                </div>
              ))}
           </div>
           <button onClick={() => setCurrentStage(4)} className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 rounded-full font-black text-xs uppercase tracking-[0.4em] transition-all">Finalize transmission pipeline</button>
        </div>
      )}

      {currentStage === 4 && (
        <div className="max-w-4xl mx-auto glass-panel p-16 rounded-[4rem] border border-slate-800 animate-in slide-in-from-right-20">
           <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-10 text-center">Final Ignite</h2>
           
           <div className="mb-8 grid grid-cols-2 gap-4">
              <button onClick={() => setMsgMode('text')} className={`p-4 rounded-2xl border font-black uppercase text-[10px] tracking-widest ${msgMode === 'text' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>Standard Text</button>
              <button onClick={() => setMsgMode('template')} className={`p-4 rounded-2xl border font-black uppercase text-[10px] tracking-widest ${msgMode === 'template' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>Official Template</button>
           </div>

           <div className="space-y-8">
              <div className="p-10 bg-slate-950 border border-slate-800 rounded-[3rem]">
                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6">Payload Verification</p>
                 <p className="text-lg text-slate-300 leading-relaxed italic mb-8">"{activeDraft?.messageText}"</p>
                 {(aiImage || aiVideo || aiAudio) && (
                   <div className="mt-8 h-48 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 flex items-center justify-center">
                      {aiVideo ? <video src={aiVideo} className="w-full h-full object-cover" controls /> : 
                       aiImage ? <img src={aiImage!} className="w-full h-full object-cover" /> :
                       <div className="text-indigo-400 font-black text-xs uppercase tracking-[0.3em] flex items-center gap-3">
                          <ICONS.Check className="w-5 h-5" /> Audio Stream Integrated
                       </div>}
                   </div>
                 )}
              </div>
              {isBroadcasting && (
                <div className="space-y-4">
                  <div className="flex justify-between text-[10px] font-black uppercase text-indigo-400 tracking-widest">
                    <span>Transmitting Batch...</span>
                    <span>~{timeLeft}s remaining</span>
                  </div>
                  <div className="h-48 overflow-y-auto bg-slate-900/50 rounded-[2rem] p-8 border border-slate-800 font-mono text-[10px] space-y-3 custom-scrollbar">
                    {broadcastLog.map((log, i) => (
                        <div key={i} className="flex justify-between border-b border-slate-800 pb-3">
                          <span className="text-slate-400">{log.name}</span>
                          <span className={log.isError ? 'text-red-400' : 'text-emerald-400 font-bold'}>{log.status}</span>
                        </div>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={executeLaunch} disabled={isBroadcasting} className="w-full py-8 bg-indigo-600 hover:bg-indigo-500 rounded-full font-black text-sm uppercase tracking-[0.5em] shadow-2xl transition-all">
                 {isBroadcasting ? `VELOCITY: ${progress}% COMPLETE` : 'LAUNCH CAMPAIGN'}
              </button>
           </div>
        </div>
      )}

      {currentStage === 5 && (
        <div className="space-y-12 max-w-7xl mx-auto animate-in slide-in-from-bottom-20 duration-1000">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Transmissions', val: totalSent, color: 'indigo' },
                { label: 'Conversion Lift', val: totalReplied, color: 'emerald' },
                { label: 'Engagement Velocity', val: `${avgEngagement}%`, color: 'purple' },
                { label: 'Neural Precision', val: '99.8%', color: 'amber' }
              ].map((kpi, idx) => (
                <div key={idx} className="glass-panel p-8 rounded-[2.5rem] border border-slate-800">
                   <p className="text-[10px] font-black text-slate-500 uppercase mb-2">{kpi.label}</p>
                   <h3 className={`text-4xl font-black text-${kpi.color}-400`}>{kpi.val}</h3>
                </div>
              ))}
           </div>

           <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
              <div className="xl:col-span-8 space-y-8">
                 <div className="glass-panel rounded-[3.5rem] p-12 border border-slate-800 shadow-2xl relative overflow-hidden">
                    <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-10">Operation Sentry</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-6">
                          <h4 className="text-[11px] font-black text-slate-500 uppercase flex items-center gap-2"><div className="w-1.5 h-4 bg-indigo-500 rounded-full"></div> Neural Feed</h4>
                          <div className="h-[400px] overflow-y-auto p-6 bg-slate-950/80 rounded-[2.5rem] border border-slate-800 font-mono text-[10px] space-y-4 custom-scrollbar">
                             {neuralLogs.map((log, i) => (
                               <div key={i} className="flex gap-3">
                                 <span className="text-indigo-500/50">[{new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}]</span>
                                 <span className={log.includes('Agent') ? 'text-emerald-400' : 'text-slate-400'}>{log}</span>
                               </div>
                             ))}
                          </div>
                       </div>
                       <div className="space-y-6">
                          <h4 className="text-[11px] font-black text-slate-500 uppercase flex items-center gap-2"><div className="w-1.5 h-4 bg-purple-500 rounded-full"></div> Response Heatmap</h4>
                          <div className="h-[400px] p-6 bg-slate-950/80 rounded-[2.5rem] border border-slate-800 flex flex-col justify-center gap-6">
                             {liveConversations.map((conv, idx) => (
                               <div key={idx} className="space-y-2">
                                  <div className="flex justify-between text-[10px] font-black uppercase"><span className="text-slate-400">{conv.name}</span><span className="text-indigo-400">{conv.heat}%</span></div>
                                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden"><div className="h-full bg-indigo-600 transition-all duration-1000" style={{ width: `${conv.heat}%` }}></div></div>
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="xl:col-span-4 space-y-8">
                 <div className="glass-panel rounded-[3.5rem] p-10 border border-slate-800 shadow-2xl h-full flex flex-col">
                    <h4 className="text-[11px] font-black text-indigo-400 uppercase mb-10">Neural Sales Interceptor</h4>
                    <div className="flex-1 space-y-6 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                       {liveConversations.map((conv, i) => (
                         <div key={i} className="p-6 bg-slate-900/40 border border-slate-800 rounded-[2.5rem] hover:border-indigo-500 transition-all">
                            <div className="flex justify-between items-start mb-4">
                               <span className="text-[11px] font-black uppercase">{conv.name}</span>
                               <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-md">Inbound</span>
                            </div>
                            <p className="text-[11px] text-slate-300 italic mb-4">"{conv.lastMsg}"</p>
                            {conv.suggestion ? (
                               <div className="space-y-4">
                                  <div className="bg-slate-950 border border-indigo-500/30 p-4 rounded-2xl text-[10px] font-bold text-indigo-200">{conv.suggestion}</div>
                                  <button onClick={() => sendAgentReply(i)} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest">Transmit Reply</button>
                               </div>
                            ) : (
                               <button onClick={() => handleNeuralIntercept(i)} disabled={conv.isThinking} className="w-full py-3 bg-slate-800 text-white rounded-xl font-black text-[9px] uppercase tracking-widest disabled:opacity-50">
                                  {conv.isThinking ? 'Analyzing...' : 'Generate AI Reply'}
                               </button>
                            )}
                         </div>
                       ))}
                    </div>
                    <button onClick={resetPipeline} className="mt-10 w-full py-6 bg-slate-900 border border-slate-800 rounded-full text-[10px] font-black uppercase tracking-[0.3em]">New Sequence</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

enum StageState {
  ARCHITECT = 1,
  STRATEGY = 2,
  CREATIVE = 3,
  TRANSMISSION = 4,
  OPERATION = 5
}

export default WhatsAppHub;
