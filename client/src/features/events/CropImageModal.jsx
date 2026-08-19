import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../shared/lib/cropImage';

export default function CropImageModal({ imageSrc, onComplete, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = async () => {
    try {
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onComplete(croppedImageBlob);
    } catch (e) {
      console.error(e);
      // Fallback: just return the original if something fails
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/80 p-4 font-mono">
      <div className="w-full max-w-2xl bg-paper border-2 border-ink shadow-hard rounded-xs flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b-2 border-ink flex justify-between items-center bg-card">
          <h2 className="text-xl font-display uppercase tracking-tight text-ink">
            [ CROP IMAGE ]
          </h2>
        </div>

        {/* Cropper Container */}
        <div className="relative w-full h-[50vh] sm:h-[60vh] bg-ink overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={16 / 9}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            classes={{
              containerClassName: 'bg-ink',
            }}
          />
        </div>

        {/* Footer / Controls */}
        <div className="p-4 border-t-2 border-ink bg-card flex flex-col sm:flex-row gap-3 justify-end">
          <button
            onClick={onCancel}
            className="font-mono text-sm font-bold uppercase tracking-wider border-2 border-ink bg-paper hover:bg-canvas px-6 py-2 rounded-xs shadow-hard active:translate-y-[2px] active:shadow-none transition-all focus:outline-none"
          >
            CANCEL
          </button>
          <button
            onClick={handleCrop}
            className="font-mono text-sm font-bold uppercase tracking-wider bg-signal text-ink px-6 py-2 rounded-xs border-2 border-ink shadow-hard active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all focus:outline-none"
          >
            CROP & UPLOAD
          </button>
        </div>
      </div>
    </div>
  );
}
