import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export interface CapturedProduct {
  dataUrl: string;
  name: string;
}

interface ProductCameraFlowProps {
  open: boolean;
  onClose: () => void;
  onContinue: (product: CapturedProduct) => void;
  /** Optional: called for each saved capture (for multi-product flows). Defaults to onContinue. */
  onSavedCapture?: (product: CapturedProduct) => void;
  /** Auto-capture delay in ms after the camera stabilises. Default 2500. */
  autoCaptureDelay?: number;
}

type Stage = "scanning" | "naming" | "actions";

/**
 * Strict 4-step camera flow:
 *  1. Live camera fills screen, only X to cancel.
 *  2. Auto-capture after a short stabilisation window with shutter flash.
 *  3. Frozen image + name input slides up from bottom; only "Save" button.
 *  4. After Save → exactly two buttons: "Capture" (re-open camera) and "Continue".
 */
const ProductCameraFlow = ({
  open,
  onClose,
  onContinue,
  onSavedCapture,
  autoCaptureDelay = 2500,
}: ProductCameraFlowProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [stage, setStage] = useState<Stage>("scanning");
  const [captured, setCaptured] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [shutter, setShutter] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
    } catch {
      setCameraError("Unable to access camera. Please grant permission and try again.");
    }
  }, []);

  // Reset everything when modal opens/closes.
  useEffect(() => {
    if (!open) {
      stopCamera();
      setStage("scanning");
      setCaptured(null);
      setName("");
      setShutter(false);
      return;
    }
    setStage("scanning");
    setCaptured(null);
    setName("");
    void startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Auto-capture timer when scanning.
  useEffect(() => {
    if (!open || stage !== "scanning") return;
    const t = setTimeout(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !video.videoWidth) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      setShutter(true);
      setTimeout(() => setShutter(false), 220);
      setCaptured(dataUrl);
      stopCamera();
      setStage("naming");
    }, autoCaptureDelay);
    return () => clearTimeout(t);
  }, [open, stage, autoCaptureDelay, stopCamera]);

  // Auto-focus the name input.
  useEffect(() => {
    if (stage === "naming") {
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [stage]);

  const handleSaveName = () => {
    const trimmed = name.trim();
    if (!trimmed || !captured) return;
    onSavedCapture?.({ dataUrl: captured, name: trimmed });
    setStage("actions");
  };

  const handleCaptureAnother = () => {
    setCaptured(null);
    setName("");
    setStage("scanning");
    void startCamera();
  };

  const handleContinue = () => {
    if (!captured) return;
    onContinue({ dataUrl: captured, name: name.trim() });
  };

  const handleCancel = () => {
    stopCamera();
    onClose();
  };

  if (!open) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[60] bg-black"
      style={{ height: "100dvh" }}
    >
      {/* Cancel — only chrome visible during scanning */}
      <button
        onClick={handleCancel}
        aria-label="Cancel"
        className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white"
        style={{ top: "calc(env(safe-area-inset-top, 0px) + 16px)" }}
      >
        <X className="w-5 h-5" />
      </button>

      {/* Stage 1: live scanning */}
      {stage === "scanning" && (
        <div className="absolute inset-0 z-[1]">
          {cameraError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center text-white">
              <p className="text-sm mb-4">{cameraError}</p>
              <button
                onClick={() => void startCamera()}
                className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Scan reticle */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 border-2 border-white/70 rounded-2xl animate-pulse" />
              </div>
              <div className="absolute bottom-10 left-0 right-0 text-center pointer-events-none">
                <span className="text-xs text-white/90 bg-black/50 px-3 py-1.5 rounded-full">
                  Hold steady — auto capturing…
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Stage 2/3/4: frozen image */}
      {stage !== "scanning" && captured && (
        <div className="absolute inset-0 z-[1]">
          <img src={captured} alt="Captured product" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Shutter flash */}
      {shutter && <div className="absolute inset-0 z-40 bg-white animate-fade-in pointer-events-none" />}

      {/* Stage 3: name input slides up */}
      {stage === "naming" && (
        <div
          className="fixed left-0 right-0 z-50 p-5 pt-6 bg-black/95 backdrop-blur animate-slide-up shadow-[0_-8px_24px_rgba(0,0,0,0.5)]"
          style={{ bottom: 0, paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)" }}
        >
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name this product"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveName();
            }}
            className="w-full h-12 px-4 rounded-lg bg-white text-black placeholder:text-black/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary mb-3"
          />
          <button
            onClick={handleSaveName}
            disabled={!name.trim()}
            className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-40"
          >
            Save
          </button>
        </div>
      )}

      {/* Stage 4: two buttons */}
      {stage === "actions" && (
        <div
          className="fixed left-0 right-0 z-50 p-5 pt-6 bg-black/95 backdrop-blur animate-fade-in shadow-[0_-8px_24px_rgba(0,0,0,0.5)]"
          style={{ bottom: 0, paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)" }}
        >
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleCaptureAnother}
              className="h-12 rounded-lg border-2 border-white text-white font-semibold text-sm bg-transparent"
            >
              Capture
            </button>
            <button
              onClick={handleContinue}
              className="h-12 rounded-lg bg-primary text-primary-foreground font-semibold text-sm"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );

  // Portal to body so the modal escapes any ancestor stacking context
  // (e.g. .app-shell uses overflow:hidden + position:relative which can clip
  // fixed-positioned children on some mobile browsers, hiding our buttons
  // behind page-level chrome like bottom nav bars).
  return typeof document !== "undefined"
    ? createPortal(modal, document.body)
    : modal;
};

export default ProductCameraFlow;
