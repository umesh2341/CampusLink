import React, { useState } from 'react';
import { Terminal, Send, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { API_BASE } from '../../shared/lib/api';

const CATEGORIES = [
  { id: 'general', label: 'General Announcement' },
  { id: 'exam', label: 'Exam Schedule' },
  { id: 'holiday', label: 'Holiday / Closure' }
];

const TARGET_YEARS = [
  { value: 'everyone', label: 'Everyone' },
  { value: '1st', label: '1st Year' },
  { value: '2nd', label: '2nd Year' },
  { value: '3rd', label: '3rd Year' },
  { value: '4th', label: '4th Year' },
];

function AddNoticeForm({ onBack, onSuccess, isAuthority, userId }) {
  const [formData, setFormData] = useState({
    title: '',
    category: 'general',
    body: '',
    document_url: '',
    expires_in_days: '',
    send_push: false,
    target_year: 'everyone'
  });

  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isAuthority) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <p className="font-mono text-xs text-signal uppercase">
          [ ACCESS DENIED: AUTHORITY ROLE REQUIRED ]
        </p>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData((prev) => {
      const newData = { ...prev, [name]: type === 'checkbox' ? checked : value };
      
      // Auto-toggle send_push based on category change
      if (name === 'category') {
        newData.send_push = ['exam', 'holiday'].includes(value);
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.body) {
      setErrorMsg('TITLE AND BODY ARE REQUIRED');
      return;
    }
    
    setStatus('submitting');
    setErrorMsg('');

    try {
      const payload = { ...formData };
      if (!payload.document_url.trim()) payload.document_url = null;
      if (!payload.expires_in_days) payload.expires_in_days = null;
      
      const res = await fetch(`${API_BASE}/api/notices`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        throw new Error('Failed to create notice');
      }
      
      setStatus('success');
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error posting notice:', err);
      setStatus('error');
      setErrorMsg(err.message || 'SYSTEM ERROR: SUBMISSION FAILED');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-grain flex flex-col items-center py-8 px-4 font-mono select-none relative z-10 h-full w-full">
      <div className="w-full max-w-2xl bg-card border-2 border-ink shadow-hard relative">
        {/* Header */}
        <div className="bg-ink text-paper px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold">
            <Terminal className="w-4 h-4 text-signal" />
            <span>[ POST NOTICE - ADMIN TERMINAL ]</span>
          </div>
          <button onClick={onBack} className="p-1 rounded-xs text-paper hover:bg-paper hover:text-ink transition-all focus:outline-none">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {status === 'success' ? (
            <div className="py-12 text-center space-y-4">
              <div className="mx-auto w-16 h-16 border-2 border-ink bg-signal flex items-center justify-center text-ink rounded-xs mb-4 shadow-hard">
                <Send className="w-8 h-8" />
              </div>
              <h2 className="font-display text-2xl uppercase tracking-widest text-ink">
                Notice Posted
              </h2>
              <p className="text-xs text-muted max-w-md mx-auto">
                The notice has been successfully broadcast to the campus link network.
              </p>
              <button
                onClick={onBack}
                className="mt-6 font-bold border-2 border-ink bg-card px-6 py-2 shadow-hard hover:bg-ink hover:text-paper hover:translate-y-[2px] hover:shadow-none transition-all active:scale-95 text-xs uppercase"
              >
                RETURN TO MAP
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-signal uppercase tracking-widest flex items-center gap-2 border-b-2 border-ink/20 pb-2">
                  <AlertCircle className="w-3.5 h-3.5" />
                  General Information
                </h3>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-ink flex justify-between">
                    <span>Notice Title <span className="text-signal">*</span></span>
                  </label>
                  <input
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full bg-paper border-2 border-ink px-3 py-2 text-xs font-bold text-ink placeholder:text-muted/50 focus:outline-none focus:bg-card transition-colors shadow-hard focus:translate-y-[2px] focus:shadow-none"
                    placeholder="E.G. MID-SEMESTER EXAM SCHEDULE"
                    autoComplete="off"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-ink">
                      Category <span className="text-signal">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full bg-paper border-2 border-ink pl-3 pr-8 py-2 text-xs font-bold uppercase text-ink appearance-none focus:outline-none focus:bg-card transition-colors shadow-hard focus:translate-y-[2px] focus:shadow-none cursor-pointer"
                      >
                        {CATEGORIES.map(c => (
                          <option key={c.id} value={c.id}>{c.label}</option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-ink">
                        ▼
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-ink">
                      Expires In (Days)
                    </label>
                    <input
                      name="expires_in_days"
                      type="number"
                      min="1"
                      value={formData.expires_in_days}
                      onChange={handleChange}
                      className="w-full bg-paper border-2 border-ink px-3 py-2 text-xs font-bold text-ink placeholder:text-muted/50 focus:outline-none focus:bg-card transition-colors shadow-hard focus:translate-y-[2px] focus:shadow-none"
                      placeholder="E.G. 7"
                    />
                  </div>
                </div>

                {/* Target Year */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-ink">
                    Target Year <span className="text-signal">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {TARGET_YEARS.map(opt => {
                      const isSelected = formData.target_year === opt.value;
                      return (
                        <label
                          key={opt.value}
                          className={`p-2.5 rounded-xs border-2 border-ink flex items-center justify-between cursor-pointer transition-all ${
                            isSelected ? 'bg-card' : 'bg-paper opacity-60'
                          }`}
                        >
                          <span className="text-[10px] font-bold uppercase text-ink">{opt.label}</span>
                          <div className={`w-4 h-4 rounded-full border-2 border-ink flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-signal' : 'bg-paper'
                          }`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-ink" />}
                          </div>
                          <input
                            type="radio"
                            name="target_year"
                            value={opt.value}
                            checked={isSelected}
                            onChange={handleChange}
                            className="sr-only"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-ink flex justify-between">
                    <span>Notice Body <span className="text-signal">*</span></span>
                  </label>
                  <textarea
                    name="body"
                    value={formData.body}
                    onChange={handleChange}
                    rows="4"
                    className="w-full bg-paper border-2 border-ink px-3 py-2 text-xs text-ink placeholder:text-muted/50 focus:outline-none focus:bg-card transition-colors shadow-hard focus:translate-y-[2px] focus:shadow-none resize-none"
                    placeholder="ENTER NOTICE DETAILS HERE..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-ink">
                    Document URL (PDF)
                  </label>
                  <input
                    name="document_url"
                    type="url"
                    value={formData.document_url}
                    onChange={handleChange}
                    className="w-full bg-paper border-2 border-ink px-3 py-2 text-xs font-bold text-ink placeholder:text-muted/50 focus:outline-none focus:bg-card transition-colors shadow-hard focus:translate-y-[2px] focus:shadow-none"
                    placeholder="HTTPS://..."
                  />
                </div>

                <div className="pt-2 border-t-2 border-ink/20">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        name="send_push"
                        checked={formData.send_push}
                        onChange={handleChange}
                        className="peer appearance-none w-5 h-5 border-2 border-ink bg-paper checked:bg-signal transition-colors focus:outline-none cursor-pointer"
                      />
                      <svg className="absolute w-3 h-3 text-ink opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <span className="text-xs font-bold uppercase text-ink group-hover:text-signal transition-colors select-none">
                      Send push notification for this notice
                    </span>
                  </label>
                </div>
              </div>

              {errorMsg && (
                <div className="bg-signal/10 border-2 border-signal p-3 text-signal text-xs font-bold text-center uppercase tracking-widest">
                  [ ERROR: {errorMsg} ]
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full bg-ink text-paper border-2 border-ink py-3 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-paper hover:text-ink transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-hard hover:translate-y-[2px] hover:shadow-none group"
              >
                {status === 'submitting' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>BROADCASTING...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    <span>BROADCAST NOTICE</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default AddNoticeForm;
