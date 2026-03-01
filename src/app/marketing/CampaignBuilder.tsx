"use client";

import { useState } from "react";
import { Send, LayoutTemplate, Users, CheckCircle2, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { broadcastCampaign } from "./actions";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css"; 

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

export function CampaignBuilder({ stats }: { stats: any }) {
  const [audience, setAudience] = useState("LEAD");
  const [subject, setSubject] = useState("Exclusive Pre-Launch Access");
  const [body, setBody] = useState("<p>We are thrilled to announce our newest residential project before it hits the public market.</p><p><br></p><p>Because you registered interest with <strong>Property Pilot</strong>, we are giving you first access to floor plans and introductory pricing.</p><p><br></p><p>Reply to this email to schedule a private viewing.</p><p><br></p><p>Best,</p><p><strong>The Property Pilot Team</strong></p>");
  
  // NEW: State now holds an ARRAY of files
  const [attachments, setAttachments] = useState<File[]>([]);
  
  const [isSending, setIsSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const getAudienceCount = () => {
    if (audience === "LEAD") return stats.leads;
    if (audience === "ACTIVE_BUYER") return stats.activeBuyers;
    if (audience === "PAST_CLIENT") return stats.pastClients;
    return 0;
  };

  const handleSend = async () => {
    setIsSending(true);
    setSuccessMsg("");

    const formData = new FormData();
    formData.append("audience", audience);
    formData.append("subject", subject);
    formData.append("body", body);
    
    // NEW: Append every single file to the FormData payload
    attachments.forEach(file => {
      formData.append("attachments", file);
    });

    const result = await broadcastCampaign(formData);
    
    setIsSending(false);

    if (result.error) {
      alert(`Broadcast Failed: ${result.error}`);
    } else {
      setSuccessMsg(`Successfully broadcasted to ${result.count} contacts!`);
      setAttachments([]); // Clear all files after sending
      setTimeout(() => setSuccessMsg(""), 5000);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setAttachments(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start">
      
      {/* LEFT PANE: COMPOSER */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-blue-600" /> Campaign Composer
          </h3>
          {successMsg && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded">
              <CheckCircle2 className="w-4 h-4" /> Sent
            </span>
          )}
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Select Target Audience</label>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => setAudience("LEAD")}
                className={`p-3 border rounded-lg text-sm font-bold transition-all ${audience === "LEAD" ? "bg-blue-50 border-blue-600 text-blue-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                Leads ({stats.leads})
              </button>
              <button 
                onClick={() => setAudience("ACTIVE_BUYER")}
                className={`p-3 border rounded-lg text-sm font-bold transition-all ${audience === "ACTIVE_BUYER" ? "bg-emerald-50 border-emerald-600 text-emerald-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                Active ({stats.activeBuyers})
              </button>
              <button 
                onClick={() => setAudience("PAST_CLIENT")}
                className={`p-3 border rounded-lg text-sm font-bold transition-all ${audience === "PAST_CLIENT" ? "bg-amber-50 border-amber-600 text-amber-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                Past ({stats.pastClients})
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Subject Line</label>
            <input 
              type="text" 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div className="pb-8">
            <label className="block text-sm font-bold text-slate-700 mb-2">Newsletter Content</label>
            <div className="bg-white rounded-lg overflow-hidden border border-slate-300">
              <ReactQuill 
                theme="snow" 
                value={body} 
                onChange={setBody} 
                modules={modules}
                className="h-64"
              />
            </div>
          </div>

          {/* MULTI-FILE ATTACHMENT UI */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
            <label className="cursor-pointer inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors">
              <Paperclip className="w-5 h-5 text-slate-400" />
              <span>Attach Files</span>
              <input 
                type="file" 
                multiple // <-- This lets you highlight multiple files!
                className="hidden" 
                onChange={(e) => {
                  if (e.target.files) {
                    setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
                  }
                }} 
              />
            </label>
            
            {/* Show a list of all attached files */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-slate-200 text-xs font-medium text-slate-600 shadow-sm">
                    <span className="truncate max-w-[150px]">{file.name}</span>
                    <button onClick={() => removeFile(index)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
          <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
            <Users className="w-4 h-4" /> Broadcasting to {getAudienceCount()} people
          </div>
          <Button 
            onClick={handleSend} 
            disabled={isSending || getAudienceCount() === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition-all"
          >
            {isSending ? "Transmitting..." : "Broadcast Campaign"} <Send className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* RIGHT PANE: LIVE PREVIEW */}
      <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden flex flex-col h-full relative">
        <div className="bg-slate-800 px-4 py-3 flex items-center gap-2 border-b border-slate-700">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          <span className="text-xs text-slate-400 font-medium ml-4 uppercase tracking-wider">Live Desktop Preview</span>
        </div>

        <div className="p-8 flex-1 bg-slate-100 flex justify-center items-start overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-lg shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 text-center border-b border-slate-100">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Property Pilot</h2>
            </div>
            <div className="p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-6 leading-snug">
                {subject || "Your Subject Line Here"}
              </h3>
              <div className="text-slate-900 mb-4 font-bold">Hi [Client Name],</div>
              <div 
                className="text-slate-600 leading-relaxed text-sm prose prose-sm prose-slate max-w-none"
                dangerouslySetInnerHTML={{ __html: body || "<p>Your message body will appear here...</p>" }}
              />
              
              {/* Fake Attachment Preview for Multiple Files */}
              {attachments.length > 0 && (
                <div className="mt-6 space-y-2">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attachments ({attachments.length})</div>
                  {attachments.map((file, i) => (
                    <div key={i} className="p-3 border border-slate-200 rounded-lg flex items-center gap-3 bg-slate-50">
                      <Paperclip className="w-5 h-5 text-blue-500" />
                      <span className="text-sm font-medium text-slate-700 truncate">{file.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-slate-50 p-6 text-center mt-4">
              <p className="text-xs text-slate-400">
                You are receiving this email because you are a valued contact of Property Pilot.<br/>
                Nairobi, Kenya
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}