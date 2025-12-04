"use client";

import { useEffect, useRef, useState } from "react";

export default function CameraWithOverlay() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const capturedRef = useRef<HTMLDivElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">(
    "environment"
  );
  const [flash, setFlash] = useState(false);

  // NEW → Auto-incrementing counter
  const [photoIndex, setPhotoIndex] = useState(1);

  // -----------------------------------------
  // Start camera
  // -----------------------------------------
  async function startCamera(facing: "user" | "environment") {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera error:", err);
    }
  }

  // Start on mount
  useEffect(() => {
    startCamera(cameraFacing);
    return () => stream?.getTracks().forEach((t) => t.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------------------------------
  // Live overlay (timestamp + grid)
  // -----------------------------------------
  useEffect(() => {
    let animationFrame: number;

    const renderOverlay = () => {
      const canvas = overlayCanvasRef.current;
      const video = videoRef.current;

      if (!canvas || !video) {
        animationFrame = requestAnimationFrame(renderOverlay);
        return;
      }

      const ctx = canvas.getContext("2d")!;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 3. Counter (JOJOxxxx)
      const indexString = String(photoIndex).padStart(4, "0");
      ctx.textAlign = "left";
      ctx.fillText(`JOJO${indexString}`, 20, canvas.height - 20);

      animationFrame = requestAnimationFrame(renderOverlay);
    };

    renderOverlay();
    return () => cancelAnimationFrame(animationFrame);
  }, [photoIndex]);

  // -----------------------------------------
  // Flash + Capture
  // -----------------------------------------
  const takePhoto = () => {
    if (!videoRef.current || !captureCanvasRef.current) return;

    const video = videoRef.current;
    const canvas = captureCanvasRef.current;
    const ctx = canvas.getContext("2d")!;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Flash
    setFlash(true);
    setTimeout(() => setFlash(false), 150);

    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Counter (JOJOxxxx)
    const indexString = String(photoIndex).padStart(4, "0");
    ctx.textAlign = "left";
    ctx.fillText(`JOJO${indexString}`, 20, canvas.height - 20);

    // Save
    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
    setCaptured(dataUrl);

    // Increment index
    setPhotoIndex((prev) => prev + 1);

    // Scroll to photo
    setTimeout(() => {
      capturedRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // -----------------------------------------
  // Camera switch
  // -----------------------------------------
  const switchCamera = async () => {
    const newFacing = cameraFacing === "user" ? "environment" : "user";
    setCameraFacing(newFacing);

    stream?.getTracks().forEach((t) => t.stop());
    await startCamera(newFacing);
  };

  return (
    <div className="flex flex-col items-center relative w-full max-w-xl mx-auto">
      {/* FLASH */}
      {flash && (
        <div className="fixed inset-0 bg-white opacity-90 pointer-events-none z-50"></div>
      )}

      {/* VIDEO + OVERLAY */}
      <div className="relative w-full">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={`w-full h-auto `}
        />

        <canvas
          ref={overlayCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
      </div>

      {/* SHUTTER BUTTON */}
      <div className="flex gap-3 fixed bottom-4 left-1/2 -translate-x-1/2 z-10">
        <button
          onClick={takePhoto}
          className="w-20 h-20 bg-white border-4 border-gray-300 rounded-full shadow-md active:scale-95 transition"
        ></button>
      </div>

      {/* SWITCH CAMERA */}
      <div className="flex fixed top-4 right-4 z-10">
        <button
          onClick={switchCamera}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg"
        >
          Switch Camera
        </button>
      </div>

      {/* CAPTURED PHOTO */}
      {captured && (
        <div ref={capturedRef} className="mt-8 w-full text-center">
          <h2 className="text-xl font-semibold mb-3">Your Photo</h2>
          <img src={captured} className="shadow-lg" alt="Captured" />
        </div>
      )}

      <canvas ref={captureCanvasRef} className="hidden" />
    </div>
  );
}
