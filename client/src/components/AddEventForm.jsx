import React, { useState } from 'react';
import { ShieldAlert, CheckCircle, ArrowLeft } from 'lucide-react';

function AddEventForm({ buildings, isOrganizer = false, onBack, onSuccess }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [buildingId, setBuildingId] = useState('');
  const [floor, setFloor] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [organizingClub, setOrganizingClub] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [registrationUrl, setRegistrationUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Access check
  if (!isOrganizer) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 rounded-full bg-category-boys-hostel-fill/10 border-2 border-category-boys-hostel-border flex items-center justify-center text-category-boys-hostel-fill animate-pulse">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-3xl font-display uppercase tracking-tight text-text-primary">
          Access Denied
        </h3>
        <p className="font-mono text-sm text-text-primary/70 leading-relaxed">
          Only verified senior students and club organizers can submit new campus events. If you are an organizer, ask an admin for db authorization.
        </p>
        <button
          onClick={onBack}
          className="mt-4 font-mono text-xs uppercase tracking-wider border border-text-primary/20 hover:border-text-primary px-4 py-2 rounded bg-white hover:bg-canvas/10 transition-all focus:outline-none"
        >
          Back to Map
        </button>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !startTime || !endTime || !buildingId || !organizingClub) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          start_time: new Date(startTime).toISOString(),
          end_time: new Date(endTime).toISOString(),
          building_id: buildingId,
          floor: floor.trim() || null,
          room_number: roomNumber.trim() || null,
          organizing_club: organizingClub,
          image_url: imageUrl || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800',
          registration_url: registrationUrl,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit event');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 rounded-full bg-category-sports-fill/10 border-2 border-category-sports-border flex items-center justify-center text-category-sports-fill animate-bounce">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h3 className="text-3xl font-display uppercase tracking-tight text-text-primary">
          Event Submitted!
        </h3>
        <p className="font-mono text-sm text-text-primary/70 leading-relaxed">
          Your event has been submitted and is currently pending admin approval before appearing publicly. Returning to map...
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-canvas overflow-y-auto px-4 py-6 sm:px-6 w-full max-w-lg mx-auto flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-1 hover:bg-text-primary/5 rounded-full transition-colors focus:outline-none"
          aria-label="Back"
        >
          <ArrowLeft className="w-6 h-6 text-text-primary" />
        </button>
        <h2 className="text-3xl font-display uppercase tracking-tight text-text-primary">
          Create Event
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white p-5 rounded-lg border border-text-primary/10 shadow-sm flex-1">
        {error && (
          <div className="bg-category-boys-hostel-fill/10 border border-category-boys-hostel-border text-category-boys-hostel-fill p-3 rounded font-mono text-xs">
            {error}
          </div>
        )}

        {/* Title */}
        <div className="space-y-1">
          <label className="font-mono text-xs uppercase tracking-wider text-text-primary/70 block">
            Event Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. HackSOA Hackathon"
            className="w-full font-mono text-sm border border-text-primary/15 rounded p-2 focus:border-accent-gold focus:outline-none bg-canvas/10"
            required
          />
        </div>

        {/* Organizing Club */}
        <div className="space-y-1">
          <label className="font-mono text-xs uppercase tracking-wider text-text-primary/70 block">
            Organizing Club/Society *
          </label>
          <input
            type="text"
            value={organizingClub}
            onChange={(e) => setOrganizingClub(e.target.value)}
            placeholder="e.g. Coding Club"
            className="w-full font-mono text-sm border border-text-primary/15 rounded p-2 focus:border-accent-gold focus:outline-none bg-canvas/10"
            required
          />
        </div>

        {/* Building Dropdown */}
        <div className="space-y-1">
          <label className="font-mono text-xs uppercase tracking-wider text-text-primary/70 block">
            Building *
          </label>
          <select
            value={buildingId}
            onChange={(e) => setBuildingId(e.target.value)}
            className="w-full font-mono text-sm border border-text-primary/15 rounded p-2 focus:border-accent-gold focus:outline-none bg-canvas/10"
            required
          >
            <option value="">Select Building Location</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Floor & Room Number (Optional) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="font-mono text-xs uppercase tracking-wider text-text-primary/70 block">
              Floor (Optional)
            </label>
            <input
              type="text"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              placeholder="e.g. 2nd Floor"
              className="w-full font-mono text-sm border border-text-primary/15 rounded p-2 focus:border-accent-gold focus:outline-none bg-canvas/10"
            />
          </div>
          <div className="space-y-1">
            <label className="font-mono text-xs uppercase tracking-wider text-text-primary/70 block">
              Room Number (Optional)
            </label>
            <input
              type="text"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder="e.g. Room 204"
              className="w-full font-mono text-sm border border-text-primary/15 rounded p-2 focus:border-accent-gold focus:outline-none bg-canvas/10"
            />
          </div>
        </div>

        {/* Time Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="font-mono text-xs uppercase tracking-wider text-text-primary/70 block">
              Start Date & Time *
            </label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full font-mono text-sm border border-text-primary/15 rounded p-2 focus:border-accent-gold focus:outline-none bg-canvas/10"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="font-mono text-xs uppercase tracking-wider text-text-primary/70 block">
              End Date & Time *
            </label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full font-mono text-sm border border-text-primary/15 rounded p-2 focus:border-accent-gold focus:outline-none bg-canvas/10"
              required
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="font-mono text-xs uppercase tracking-wider text-text-primary/70 block">
            Event Description *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide a detailed summary of your event details..."
            rows={4}
            className="w-full font-mono text-sm border border-text-primary/15 rounded p-2 focus:border-accent-gold focus:outline-none bg-canvas/10 resize-none"
            required
          />
        </div>

        {/* Image URL */}
        <div className="space-y-1">
          <label className="font-mono text-xs uppercase tracking-wider text-text-primary/70 block">
            Event Image Banner URL
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="e.g. https://images.unsplash.com/..."
            className="w-full font-mono text-sm border border-text-primary/15 rounded p-2 focus:border-accent-gold focus:outline-none bg-canvas/10"
          />
        </div>

        {/* Google Form Link */}
        <div className="space-y-1">
          <label className="font-mono text-xs uppercase tracking-wider text-text-primary/70 block">
            External Registration URL (Google Form)
          </label>
          <input
            type="url"
            value={registrationUrl}
            onChange={(e) => setRegistrationUrl(e.target.value)}
            placeholder="e.g. https://forms.gle/..."
            className="w-full font-mono text-sm border border-text-primary/15 rounded p-2 focus:border-accent-gold focus:outline-none bg-canvas/10"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full font-mono text-sm font-bold uppercase tracking-wider bg-text-primary hover:bg-text-primary/95 text-white py-3.5 px-4 rounded border border-text-primary shadow-xs hover:shadow-md active:translate-y-0.5 transition-all focus:outline-none disabled:opacity-50 disabled:pointer-events-none mt-2"
        >
          {loading ? 'Submitting...' : 'Submit Event'}
        </button>
      </form>
    </div>
  );
}

export default AddEventForm;
