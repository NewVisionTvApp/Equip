import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Camera, X, CheckCircle2, AlertCircle, RefreshCw, Volume2, VolumeX } from "lucide-react";

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (scannedId: string) => void;
  activeSessionName?: string;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

export default function CameraScannerModal({
  isOpen,
  onClose,
  onScan,
  activeSessionName,
  isMuted,
  onToggleMute,
}: CameraScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<{ id: string; time: string } | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(true);

  // Play audio chime on successful scan (unless muted)
  const playScanBeep = () => {
    if (isMuted) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.12); // E6 note

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.16);
    } catch {
      // AudioContext not allowed without gesture
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setLastScanned(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setErrorMessage(null);
    setHasPermission(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Rear camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        setHasPermission(true);
        requestAnimationFrame(scanFrame);
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setHasPermission(false);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMessage("Camera access was denied. Please allow camera access in your browser settings to scan badges.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setErrorMessage("No video camera was found on this device.");
      } else {
        setErrorMessage(`Could not start camera: ${err.message || "Unknown error"}`);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current || !isOpen) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const decodeQR = typeof jsQR === "function" ? jsQR : (jsQR as any)?.default;
      const code = decodeQR ? decodeQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      }) : null;

      if (code && code.data) {
        const raw = code.data.trim();
        // Look for EQ-XXXXX pattern or extract it
        const match = raw.match(/EQ-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{5}/i);
        const detectedId = match ? match[0].toUpperCase() : raw.toUpperCase();

        if (detectedId) {
          playScanBeep();
          setLastScanned({
            id: detectedId,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          });
          onScan(detectedId);

          // Pause scanning for 1.8s to avoid immediate double-scanning
          setIsScanning(false);
          setTimeout(() => {
            setIsScanning(true);
            requestAnimationFrame(scanFrame);
          }, 1800);
          return;
        }
      }
    }

    if (isOpen && isScanning) {
      requestAnimationFrame(scanFrame);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col text-white">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0F472A] flex items-center justify-center text-[#A3E635]">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Live Door Scanner</h2>
              <p className="text-[11px] text-slate-400">
                {activeSessionName ? `Checking in for: ${activeSessionName}` : "Scan Attendee Badge QR Code"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onToggleMute && (
              <button
                type="button"
                onClick={onToggleMute}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                  isMuted ? "bg-amber-950 text-amber-400" : "bg-slate-800 text-slate-300 hover:text-white"
                }`}
                title={isMuted ? "Chime is MUTED (Silent mode)" : "Chime is ON"}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewfinder Viewport */}
        <div className="relative aspect-square w-full bg-black flex items-center justify-center overflow-hidden">
          {/* Hidden Canvas for QR frame processing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Video Stream */}
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />

          {/* Scanning Reticle Frame */}
          {hasPermission && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-8">
              <div className="w-64 h-64 border-2 border-emerald-400/80 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] flex items-center justify-center">
                {/* Corner Accents */}
                <span className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-[#A3E635] rounded-tl-lg" />
                <span className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-[#A3E635] rounded-tr-lg" />
                <span className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-[#A3E635] rounded-bl-lg" />
                <span className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-[#A3E635] rounded-br-lg" />

                {/* Laser scan animation line */}
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#A3E635] to-transparent animate-pulse shadow-[0_0_8px_#A3E635]" />
              </div>
            </div>
          )}

          {/* Permission / Error states */}
          {hasPermission === false && (
            <div className="p-6 text-center flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-xs text-rose-300 font-medium leading-relaxed max-w-xs">
                {errorMessage}
              </p>
              <button
                type="button"
                onClick={startCamera}
                className="mt-2 flex items-center gap-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-white transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Camera Permission</span>
              </button>
            </div>
          )}

          {/* Scanned Feedback Overlay */}
          {lastScanned && !isScanning && (
            <div className="absolute inset-x-4 bottom-4 bg-[#0F472A]/90 backdrop-blur-md border border-emerald-500/50 rounded-2xl p-3.5 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-150">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-lime-400 text-slate-950 flex items-center justify-center font-black">
                  <CheckCircle2 className="w-5 h-5 text-[#0F472A]" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-mono text-sm font-extrabold text-lime-300">
                    {lastScanned.id}
                  </span>
                  <span className="text-[10px] text-emerald-200">
                    Verified & Checked In at {lastScanned.time}
                  </span>
                </div>
              </div>

              <span className="text-[11px] font-bold text-white bg-emerald-800/80 px-2.5 py-1 rounded-lg">
                Success
              </span>
            </div>
          )}
        </div>

        {/* Footer info & manual switcher */}
        <div className="p-4 bg-slate-900/90 border-t border-slate-800 text-center flex items-center justify-between text-xs text-slate-400">
          <span>Point camera at printed badge or phone screen</span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-300 hover:text-white underline underline-offset-2"
          >
            Done Scanning
          </button>
        </div>
      </div>
    </div>
  );
}
