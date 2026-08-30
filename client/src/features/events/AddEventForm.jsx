import React, { useState, useEffect, useRef } from 'react';
import CropImageModal from './CropImageModal';
import { ShieldAlert, CheckCircle, ArrowLeft, ChevronDown, X, UploadCloud, Trash2, PenLine } from 'lucide-react';
import { API_BASE } from '../../shared/lib/api';

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

const FALLBACK_BUILDINGS = [
  { id: 'academic-block', name: 'Academic Block', category: 'academic' },
  { id: 'auditorium', name: 'Auditorium', category: 'other' },
  { id: 'bh1', name: 'Boys Hostel 1', category: 'hostel_boys' },
  { id: 'bh2', name: 'Boys Hostel 2', category: 'hostel_boys' },
  { id: 'bh5', name: 'Boys Hostel 5', category: 'hostel_boys' },
  { id: 'bh6', name: 'Boys Hostel 6', category: 'hostel_boys' },
  { id: 'bh7', name: 'Boys Hostel 7', category: 'hostel_boys' },
  { id: 'bh8', name: 'Boys Hostel 8', category: 'hostel_boys' },
  { id: 'bh9', name: 'Boys Hostel 9', category: 'hostel_boys' },
  { id: 'bh10', name: 'Boys Hostel 10', category: 'hostel_boys' },
  { id: 'bh12', name: 'Boys Hostel 12', category: 'hostel_boys' },
  { id: 'c-block', name: 'C Block', category: 'academic' },
  { id: 'center-of-datascience', name: 'Center for Data Science', category: 'academic' },
  { id: 'cricket-court1', name: 'Cricket Court', category: 'sports' },
  { id: 'd-block', name: 'D Block', category: 'academic' },
  { id: 'drive-ev', name: 'EV Charging Station', category: 'other' },
  { id: 'eblock', name: 'E Block', category: 'academic' },
  { id: 'electronic-office', name: 'Electronics Office', category: 'academic' },
  { id: 'f-block', name: 'F Block', category: 'academic' },
  { id: 'food-court', name: 'Food Court', category: 'cafeteria' },
  { id: 'football-court1', name: 'Football Court 1', category: 'sports' },
  { id: 'football-court2', name: 'Football Court 2', category: 'sports' },
  { id: 'garden', name: 'Garden', category: 'gardens' },
  { id: 'gym', name: 'Gym', category: 'sports' },
  { id: 'indoor-stadium', name: 'Indoor Stadium', category: 'sports' },
  { id: 'lh1', name: 'Ladies Hostel 1', category: 'hostel_girls' },
  { id: 'lh2', name: 'Ladies Hostel 2', category: 'hostel_girls' },
  { id: 'lh3', name: 'Ladies Hostel 3', category: 'hostel_girls' },
  { id: 'lh4', name: 'Ladies Hostel 4', category: 'hostel_girls' },
  { id: 'lh5', name: 'Ladies Hostel 5', category: 'hostel_girls' },
  { id: 'library', name: 'Library', category: 'academic' },
  { id: 'playground', name: 'Playground', category: 'sports' },
  { id: 'sc-block', name: 'Science Block', category: 'academic' },
  { id: 'studentsection', name: 'Student Section', category: 'admin' },
  { id: 'unknown1', name: 'Utility Building 1', category: 'other' },
  { id: 'unknown', name: 'Utility Building 2', category: 'other' },
  { id: 'b-block', name: 'B Block', category: 'academic' },
  { id: 'mech-workshop', name: 'Mechanical Workshop', category: 'academic' },
  { id: 'open-gym', name: 'Open Gym', category: 'sports' },
  { id: 'park-lh2', name: 'Park (LH-2)', category: 'gardens' }
];

function AddEventForm({ buildings = [], isOrganizer = false, userId, onBack, onSuccess }) {
  const availableBuildings = (buildings && buildings.length > 0) ? buildings : FALLBACK_BUILDINGS;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [buildingId, setBuildingId] = useState('');
  const [floor, setFloor] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [clubId, setClubId] = useState('');
  const [organizingClub, setOrganizingClub] = useState('');
  const [clubSearch, setClubSearch] = useState('');
  const [isClubDropdownOpen, setIsClubDropdownOpen] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualOrganizerName, setManualOrganizerName] = useState('');
  const [clubs, setClubs] = useState([]);
  const clubDropdownRef = useRef(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [registrationUrl, setRegistrationUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const toggleTag = (tagId) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
  };

  useEffect(() => {
    fetch(`${API_BASE}/api/clubs`)
      .then(res => res.json())
      .then(data => setClubs(data))
      .catch(err => console.error('Failed to fetch clubs:', err));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (clubDropdownRef.current && !clubDropdownRef.current.contains(e.target)) {
        setIsClubDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          Your event is now live! Returning to map…
        </p>
      </div>
    );
  }

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('PLEASE SELECT A VALID IMAGE FILE.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('IMAGE SIZE EXCEEDS 5MB LIMIT.');
      return;
    }

    setError('');
    // Open the cropper modal instead of setting the file directly
    setCropImageSrc(URL.createObjectURL(file));
    // Clear the input value so the same file can be selected again if cancelled
    e.target.value = null;
  };

  const handleCropComplete = (croppedBlob) => {
    setImageFile(croppedBlob);
    setImagePreview(URL.createObjectURL(croppedBlob));
    setCropImageSrc(null);
  };

  const handleCropCancel = () => {
    setCropImageSrc(null);
  };

  const clearImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !startTime || !endTime || !buildingId) {
      setError('PLEASE FILL IN ALL REQUIRED (*) FIELDS.');
      return;
    }
    if (manualMode && !manualOrganizerName.trim()) {
      setError('PLEASE ENTER AN ORGANIZER NAME.');
      return;
    }
    if (!manualMode && !clubId) {
      setError('PLEASE SELECT A CLUB FROM THE DROPDOWN.');
      return;
    }
    setLoading(true); setError('');

    let finalImageUrl = null;

    try {
      // 1. Upload image if one was selected
      if (imageFile) {
        // Fetch signature from our backend
        const sigRes = await fetch(`${API_BASE}/api/uploads/signature`, {
          headers: {
            'x-user-id': userId
          }
        });
        if (!sigRes.ok) throw new Error('Failed to get upload signature from server');
        const { signature, timestamp, api_key, cloud_name } = await sigRes.json();

        // Upload directly to Cloudinary
        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('signature', signature);
        formData.append('timestamp', timestamp);
        formData.append('api_key', api_key);

        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const uploadErr = await uploadRes.json();
          throw new Error(uploadErr.error?.message || 'Failed to upload image to Cloudinary');
        }

        const uploadData = await uploadRes.json();
        finalImageUrl = uploadData.secure_url;
      }

      // 2. Submit the event data with the new image URL (or null)
      const res = await fetch(`${API_BASE}/api/events`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({
          title, description,
          start_time: new Date(startTime).toISOString(),
          end_time:   new Date(endTime).toISOString(),
          building_id: buildingId,
          club_id: manualMode ? null : clubId,
          floor: floor.trim() || null,
          room_number: roomNumber.trim() || null,
          organizing_club: manualMode ? manualOrganizerName.trim() : organizingClub,
          tags: selectedTags,
          image_url: finalImageUrl,
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

        {/* Club Searchable Dropdown */}
        {!manualMode && (
          <div ref={clubDropdownRef} className="relative">
            <label className={labelCls}>ORGANIZING CLUB/SOCIETY *</label>
            <div 
              onClick={() => setIsClubDropdownOpen(true)}
              className={`${inputCls} flex items-center justify-between cursor-pointer`}
            >
              <span className={organizingClub ? 'text-ink' : 'text-muted'}>
                {organizingClub || 'SELECT A CLUB'}
              </span>
              <ChevronDown className={`w-4 h-4 text-ink transition-transform ${isClubDropdownOpen ? 'rotate-180' : ''}`} />
            </div>
            
            {isClubDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-card border-2 border-ink shadow-hard-lg rounded-xs z-30 max-h-60 flex flex-col">
                <div className="p-2 border-b-2 border-ink bg-paper sticky top-0">
                  <input
                    type="text"
                    autoFocus
                    placeholder="SEARCH CLUBS..."
                    value={clubSearch}
                    onChange={(e) => setClubSearch(e.target.value)}
                    className="w-full font-mono text-xs border border-ink p-1.5 rounded-xs focus:outline-none uppercase"
                  />
                </div>
                <div className="overflow-y-auto overflow-x-hidden p-1">
                  {clubs
                    .filter(c => c.name.toLowerCase().includes(clubSearch.toLowerCase()))
                    .map(c => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setClubId(c.id);
                          setOrganizingClub(c.name);
                          setIsClubDropdownOpen(false);
                          setClubSearch('');
                        }}
                        className="p-2 flex items-center gap-2 hover:bg-signal/20 cursor-pointer text-xs uppercase"
                      >
                        {c.logo_url && (
                          <img src={c.logo_url} alt={c.name} className="w-5 h-5 object-cover rounded-full border border-ink bg-white" />
                        )}
                        <span className="font-bold truncate">{c.name}</span>
                        {c.category && (
                          <span className="ml-auto text-[9px] font-bold bg-paper border border-ink/30 px-1.5 py-0.5 rounded-xs text-muted shrink-0">{c.category.toUpperCase()}</span>
                        )}
                      </div>
                    ))}
                  {clubs.filter(c => c.name.toLowerCase().includes(clubSearch.toLowerCase())).length === 0 && (
                    <div className="p-3 text-xs text-muted text-center italic">
                      NO CLUBS FOUND
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Manual mode toggle */}
            <button
              type="button"
              onClick={() => { setManualMode(true); setClubId(''); setOrganizingClub(''); setIsClubDropdownOpen(false); }}
              className="mt-1.5 flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider text-muted hover:text-signal underline underline-offset-2 transition-colors"
            >
              <PenLine className="w-3 h-3" />
              Not affiliated with a listed club? Enter name manually
            </button>
          </div>
        )}

        {/* Manual organizer name input (fallback) */}
        {manualMode && (
          <div>
            <label className={labelCls}>ORGANIZER / DEPARTMENT NAME *</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualOrganizerName}
                onChange={e => setManualOrganizerName(e.target.value)}
                placeholder="E.G. STUDENT WELFARE DEPT."
                className={`${inputCls} flex-1`}
                autoFocus
              />
              <button
                type="button"
                onClick={() => { setManualMode(false); setManualOrganizerName(''); }}
                title="Back to club dropdown"
                className="p-2 bg-card border-2 border-ink rounded-xs hover:bg-signal/20 transition-colors focus:outline-none"
              >
                <X className="w-4 h-4 text-ink" />
              </button>
            </div>
            <p className="mt-1.5 text-[10px] font-mono text-muted leading-relaxed">
              ⓘ For college-wide events select <span className="font-bold text-ink">&quot;College Events&quot;</span> from the dropdown instead.
            </p>
          </div>
        )}

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
            {availableBuildings.map(b => (
              <option key={b.id || b.svg_element_id} value={b.id || b.svg_element_id}>
                {b.name.toUpperCase()}
              </option>
            ))}
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

        {/* Image File Upload */}
        <div>
          <label className={labelCls}>EVENT BANNER IMAGE (OPTIONAL)</label>
          {!imagePreview ? (
            <div className="relative">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                style={{ opacity: 0 }}
              />
              <div className={`${inputCls} relative z-10 flex flex-col items-center justify-center py-6 border-dashed bg-paper text-muted hover:text-ink hover:border-ink transition-colors`}>
                <UploadCloud className="w-6 h-6 mb-2" />
                <span className="font-bold">CLICK OR DRAG TO UPLOAD IMAGE</span>
                <span className="text-[10px] mt-1">(MAX 5MB, JPG/PNG)</span>
              </div>
            </div>
          ) : (
            <div className="relative border-2 border-ink rounded-xs overflow-hidden bg-paper group">
              <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover" />
              <div className="absolute inset-0 bg-ink/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button 
                  type="button" 
                  onClick={clearImage}
                  className="bg-card border-2 border-ink text-ink px-3 py-1.5 rounded-xs font-bold uppercase text-xs hover:bg-signal transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  REMOVE
                </button>
              </div>
              <div className="absolute bottom-0 inset-x-0 bg-ink text-card text-[10px] p-1 font-mono text-center truncate">
                {imageFile.name}
              </div>
            </div>
          )}
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

      {/* Cropper Modal */}
      {cropImageSrc && (
        <CropImageModal 
          imageSrc={cropImageSrc} 
          onComplete={handleCropComplete} 
          onCancel={handleCropCancel} 
        />
      )}
    </div>
  );
}

export default AddEventForm;
