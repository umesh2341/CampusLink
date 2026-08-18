import React, { useState } from 'react';
import { ShieldAlert, CheckCircle, ArrowLeft, ChevronDown, X } from 'lucide-react';

/* Shared input / select classes */
const inputCls =
  'w-full font-mono text-xs sm:text-sm border-2 border-ink rounded-xs p-2 bg-card focus:bg-paper focus:outline-none placeholder:text-muted uppercase';

const labelCls = 'font-mono text-[10px] font-bold uppercase tracking-widest text-muted block mb-1';

const AVAILABLE_TAGS = [
  { id: 'hackathon', label: 'Hackathon' },
  { id: 'tech_event', label: 'Tech Event' },
  { id: 'workshop', label: 'Workshop' },
  { id: 'cultural_event', label: 'Cultural Event' },
  { id: 'college_official', label: 'College Official' },
];

function AddEventForm({ buildings, isOrganizer = false, onBack, onSuccess }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [buildingId, setBuildingId] = useState('');
  const [floor, setFloor] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [organizingClub, setOrganizingClub] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [registrationUrl, setRegistrationUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const toggleTag = (tagId) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
  };

  /* ── Access gate ── */
  if (!isOrganizer) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-4 font-mono">
        <div className="w-14 h-14 bg-signal/20 border-2 border-ink flex items-center justify-center rounded-xs">
          <ShieldAlert className="w-8 h-8 text-signal" />
        </div>
        <h3 className="text-3xl font-display uppercase tracking-tight text-ink">[ ACCESS DENIED ]</h3>
        <p className="text-xs text-muted leading-relaxed">
          Only verified senior students and club organizers can submit events.<br />
          Ask an admin for authorization.
        </p>
        <button onClick={onBack}
          className="mt-3 font-mono text-xs font-bold uppercase tracking-wider border-2 border-ink bg-card hover:bg-paper px-4 py-2 rounded-xs shadow-hard active:translate-y-[2px] active:shadow-none transition-all focus:outline-none">
          ← BACK TO MAP
        </button>
      </div>
    );
  }

  /* ── Success ── */
  if (success) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-4 font-mono">
        <div className="w-14 h-14 bg-confirm/20 border-2 border-ink flex items-center justify-center rounded-xs">
          <CheckCircle className="w-8 h-8 text-confirm" />
        </div>
        <h3 className="text-3xl font-display uppercase tracking-tight text-ink">[ EVENT SUBMITTED ]</h3>
        <p className="text-xs text-muted leading-relaxed">
          Pending admin clearance before going public. Returning to map…
        </p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !startTime || !endTime || !buildingId || !organizingClub) {
      setError('PLEASE FILL IN ALL REQUIRED (*) FIELDS.');
      return;
    }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, description,
          start_time: new Date(startTime).toISOString(),
          end_time:   new Date(endTime).toISOString(),
          building_id: buildingId,
          floor: floor.trim() || null,
          room_number: roomNumber.trim() || null,
          organizing_club: organizingClub,
          tags: selectedTags,
          image_url: imageUrl || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800',
          registration_url: registrationUrl,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Submit failed'); }
      setSuccess(true);
      setTimeout(() => onSuccess(), 2000);
    } catch (err) {
      setError(err.message.toUpperCase());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-grain overflow-y-auto px-4 py-5 sm:px-6 w-full max-w-lg mx-auto flex flex-col font-mono">

      {/* Page header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} aria-label="Back"
          className="p-1.5 bg-card border-2 border-ink rounded-xs hover:bg-paper active:translate-y-[2px] transition-all focus:outline-none">
          <ArrowLeft className="w-5 h-5 text-ink" />
        </button>
        <h2 className="text-3xl font-display uppercase tracking-tight text-ink">[ Create Event ]</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 bg-card border-2 border-ink shadow-hard rounded-xs p-5 flex-1 mb-8">

        {error && (
          <div className="bg-signal/10 border-2 border-ink text-ink p-3 rounded-xs text-xs font-bold">
            — {error}
          </div>
        )}

        {/* Title */}
        <div>
          <label className={labelCls}>EVENT TITLE *</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="E.G. HACKSOA HACKATHON" className={inputCls} required />
        </div>

        {/* Club */}
        <div>
          <label className={labelCls}>ORGANIZING CLUB/SOCIETY *</label>
          <input type="text" value={organizingClub} onChange={e => setOrganizingClub(e.target.value)}
            placeholder="E.G. CODING CLUB" className={inputCls} required />
        </div>

        {/* Tags Multi-select Checklist Dropdown */}
        <div className="relative">
          <label className={labelCls}>EVENT TAGS (MULTI-SELECT)</label>
          <button
            type="button"
            onClick={() => setIsTagsOpen(prev => !prev)}
            className="w-full font-mono text-xs sm:text-sm border-2 border-ink rounded-xs p-2 bg-card hover:bg-paper text-left flex items-center justify-between focus:outline-none uppercase"
          >
            <span className={selectedTags.length > 0 ? 'text-ink font-bold' : 'text-muted'}>
              {selectedTags.length === 0
                ? 'SELECT EVENT TAGS…'
                : `${selectedTags.length} TAG${selectedTags.length > 1 ? 'S' : ''} SELECTED`}
            </span>
            <ChevronDown className={`w-4 h-4 text-ink transition-transform ${isTagsOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Selected Tags summary chips */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {selectedTags.map(tagId => {
                const tagObj = AVAILABLE_TAGS.find(t => t.id === tagId);
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

          {/* Dropdown Checklist Popover */}
          {isTagsOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-card border-2 border-ink shadow-hard-lg rounded-xs p-2.5 z-30 space-y-1 select-none">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted border-b border-ink/20 pb-1 mb-1.5">
                — SELECT ALL TAGS THAT APPLY
              </div>
              {AVAILABLE_TAGS.map(tag => {
                const isChecked = selectedTags.includes(tag.id);
                return (
                  <div
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className="flex items-center justify-between p-2 rounded-xs border border-transparent hover:border-ink/20 hover:bg-paper cursor-pointer text-xs font-mono"
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

        {/* Building */}
        <div>
          <label className={labelCls}>BUILDING *</label>
          <select value={buildingId} onChange={e => setBuildingId(e.target.value)}
            className={inputCls} required>
            <option value="">SELECT BUILDING LOCATION</option>
            {buildings.map(b => <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>)}
          </select>
        </div>

        {/* Floor & Room */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>FLOOR (OPTIONAL)</label>
            <input type="text" value={floor} onChange={e => setFloor(e.target.value)}
              placeholder="E.G. 2ND" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>ROOM NO. (OPTIONAL)</label>
            <input type="text" value={roomNumber} onChange={e => setRoomNumber(e.target.value)}
              placeholder="E.G. 204" className={inputCls} />
          </div>
        </div>

        {/* Times */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>START DATE & TIME *</label>
            <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)}
              className={`${inputCls} normal-case`} required />
          </div>
          <div>
            <label className={labelCls}>END DATE & TIME *</label>
            <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)}
              className={`${inputCls} normal-case`} required />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className={labelCls}>EVENT DESCRIPTION *</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Provide a detailed summary of your event…" rows={4}
            className={`${inputCls} normal-case resize-none`} required />
        </div>

        {/* Image URL */}
        <div>
          <label className={labelCls}>IMAGE BANNER URL (OPTIONAL)</label>
          <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)}
            placeholder="https://…" className={`${inputCls} normal-case`} />
        </div>

        {/* Registration URL */}
        <div>
          <label className={labelCls}>REGISTRATION URL (GOOGLE FORM)</label>
          <input type="url" value={registrationUrl} onChange={e => setRegistrationUrl(e.target.value)}
            placeholder="https://forms.gle/…" className={`${inputCls} normal-case`} />
        </div>

        <button type="submit" disabled={loading}
          className="w-full font-mono text-sm font-bold uppercase tracking-wider bg-signal text-ink py-3.5 px-4 rounded-xs border-2 border-ink shadow-hard active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all focus:outline-none disabled:opacity-50 disabled:pointer-events-none mt-2">
          {loading ? 'SUBMITTING…' : 'SUBMIT EVENT PASS'}
        </button>
      </form>
    </div>
  );
}

export default AddEventForm;
