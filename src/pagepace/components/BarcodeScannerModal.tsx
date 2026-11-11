import React, { useEffect, useRef, useState } from 'react';
import { Camera, Loader2, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Called with a clean ISBN (10 or 13 digits) */
  onDetected: (isbn: string) => void;
}

/** Book barcodes are EAN-13 starting 978/979, or ISBN-10. */
export function extractIsbnFromBarcode(raw: string): string | null {
  const clean = raw.replace(/[^0-9Xx]/g, '').toUpperCase();
  if (/^97[89]\d{10}$/.test(clean)) return clean;
  if (/^\d{9}[\dX]$/.test(clean)) return clean;
  return null;
}

export const BarcodeScannerModal: React.FC<Props> = ({ isOpen, onClose, onDetected }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState<'starting' | 'scanning' | 'error'>('starting');
  const [message, setMessage] = useState('');
  const [manual, setManual] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    let stopped = false;
    let stream: MediaStream | null = null;
    let raf = 0;
    let zxingControls: { stop: () => void } | null = null;

    const finish = (isbn: string) => {
      if (stopped) return;
      stopped = true;
      navigator.vibrate?.(80);
      onDetected(isbn);
      onClose();
    };

    (async () => {
      setStatus('starting');
      setMessage('');
      try {
        const video = videoRef.current!;
        const Detector = (window as any).BarcodeDetector;
        const supported: string[] = Detector ? await Detector.getSupportedFormats?.() ?? [] : [];
        if (Detector && supported.includes('ean_13')) {
          // Fast native path (Chrome on Android, etc.)
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
          if (stopped) return;
          video.srcObject = stream;
          await video.play();
          setStatus('scanning');
          const detector = new Detector({ formats: ['ean_13', 'ean_8', 'upc_a'] });
          const tick = async () => {
            if (stopped) return;
            try {
              const codes = await detector.detect(video);
              for (const c of codes) {
                const isbn = extractIsbnFromBarcode(c.rawValue);
                if (isbn) return finish(isbn);
              }
            } catch {
              /* frame not ready */
            }
            raf = requestAnimationFrame(tick);
          };
          tick();
        } else {
          // Fallback for Safari / iPhone and others
          const { BrowserMultiFormatReader } = await import('@zxing/browser');
          if (stopped) return;
          const reader = new BrowserMultiFormatReader();
          setStatus('scanning');
          zxingControls = await reader.decodeFromConstraints(
            { video: { facingMode: 'environment' }, audio: false },
            video,
            (result) => {
              if (!result) return;
              const isbn = extractIsbnFromBarcode(result.getText());
              if (isbn) finish(isbn);
            }
          );
          if (stopped) zxingControls.stop();
        }
      } catch (err: any) {
        setStatus('error');
        setMessage(
          err?.name === 'NotAllowedError'
            ? 'Camera access was blocked. Allow the camera in your browser settings, or type the ISBN below.'
            : 'Could not start the camera on this device. You can type the ISBN below instead.'
        );
      }
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      zxingControls?.stop();
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const manualIsbn = extractIsbnFromBarcode(manual);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90 backdrop-blur-md" onClick={onClose}>
      <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-serif font-bold text-stone-100 flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-400" />
            Scan Book Barcode
          </h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200" aria-label="Close scanner">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-stone-950 border border-stone-800">
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          {status === 'scanning' && (
            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-24 border-2 border-amber-400/80 rounded-xl pointer-events-none">
              <div className="absolute inset-x-0 top-1/2 h-0.5 bg-amber-400/70 animate-pulse" />
            </div>
          )}
          {status === 'starting' && (
            <div className="absolute inset-0 flex items-center justify-center text-stone-400 text-xs gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Starting camera...
            </div>
          )}
        </div>

        <p className="text-xs text-stone-400">
          {status === 'error' ? message : 'Point your camera at the barcode on the back cover. It fills in the book automatically.'}
        </p>

        <div className="flex items-center gap-2">
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            inputMode="numeric"
            placeholder="Or type ISBN, e.g. 9780441172719"
            className="flex-1 px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-sm font-mono focus:outline-none focus:border-amber-500/60"
          />
          <button
            type="button"
            disabled={!manualIsbn}
            onClick={() => {
              if (manualIsbn) {
                onDetected(manualIsbn);
                onClose();
              }
            }}
            className="px-3 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs disabled:opacity-40"
          >
            Use
          </button>
        </div>
      </div>
    </div>
  );
};
