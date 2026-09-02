import React, { useState } from 'react';
import { Terminal, Send, ArrowLeft, Loader2, AlertCircle, ChevronDown, X } from 'lucide-react';
import { API_BASE } from '../../shared/lib/api';

const AVAILABLE_NOTICE_TAGS = [
  { id: '1st_year', label: '1st Year' },
  { id: '2nd_year', label: '2nd Year' },
  { id: '3rd_year', label: '3rd Year' },
  { id: '4th_year', label: '4th Year' },
  { id: 'general', label: 'General' }
];
const CATEGORIES = [
  { id: 'general', label: 'General Announcement' },
  { id: 'exam', label: 'Exam Schedule' },
  { id: 'holiday', label: 'Holiday / Closure' }
];

function AddNoticeForm({ onBack, onSuccess, isAuthority, userId }) {
  const [formData, setFormData] = useState({
    title: '',
    category: 'general',
    body: '',
    document_url: '',
    expires_in_days: '',
    send_push: false,
    tags: []
  });

  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [isTagsOpen, setIsTagsOpen] = useState(false);

  const toggleTag = (tagId) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId) 
        ? prev.tags.filter(t => t !== tagId) 
        : [...prev.tags, tagId]
    }));
  };

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
    if (!formData.title || !formData.body || formData.tags.length === 0) {
      setErrorMsg('TITLE, BODY, AND AT LEAST ONE TAG ARE REQUIRED');
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

                <div className="relative space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-ink flex justify-between">
                    <span>Notice Tags (Multi-Select) <span className="text-signal">*</span></span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsTagsOpen(prev => !prev)}
                    className="w-full bg-paper border-2 border-ink px-3 py-2 text-xs font-bold uppercase text-left flex items-center justify-between focus:outline-none shadow-hard focus:translate-y-[2px] focus:shadow-none transition-colors hover:bg-card"
                  >
                    <span className={formData.tags.length > 0 ? 'text-ink' : 'text-muted'}>
                      {formData.tags.length === 0
                        ? 'SELECT TAGS…'
                        : `${formData.tags.length} TAG${formData.tags.length > 1 ? 'S' : ''} SELECTED`}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-ink transition-transform ${isTagsOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {formData.tags.map(tagId => {
                        const tagObj = AVAILABLE_NOTICE_TAGS.find(t => t.id === tagId);
                        return (
                          <span key={tagId} className="inline-flex items-center gap-1 font-mono text-[9px] font-bold uppercase bg-paper text-ink border-2 border-ink px-2 py-0.5 rounded-xs">
                            <span>{tagObj?.label.toUpperCase() || tagId}</span>
                            <button type="button" onClick={() => toggleTag(tagId)} className="hover:text-signal">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {isTagsOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-card border-2 border-ink shadow-hard-lg rounded-xs p-2.5 z-30 space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-muted border-b border-ink/20 pb-1 mb-1.5">
                        — SELECT ALL THAT APPLY
                      </div>
                      {AVAILABLE_NOTICE_TAGS.map(tag => {
                        const isChecked = formData.tags.includes(tag.id);
                        return (
                          <div
                            key={tag.id}
                            onClick={() => toggleTag(tag.id)}
                            className="flex items-center justify-between p-2 rounded-xs border border-transparent hover:border-ink/20 hover:bg-paper cursor-pointer text-xs"
                          >
                            <span className="font-bold uppercase text-ink">{tag.label}</span>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="w-4 h-4 accent-signal cursor-pointer"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
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
