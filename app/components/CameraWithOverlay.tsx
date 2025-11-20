"use client";

import { useEffect, useRef, useState } from "react";

export default function CameraWithImprovements() {
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

  // -----------------------------------------
  // Start camera at 1080p
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
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) {
      console.error("Camera error:", err);
    }
  }

  useEffect(() => {
    startCamera(cameraFacing);
    return () => stream?.getTracks().forEach((t) => t.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------------------------------
  // Live timestamp and watermark overlay
  // -----------------------------------------
  useEffect(() => {
    let animationFrame: number;

    const drawOverlay = () => {
      const canvas = overlayCanvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Timestamp (bottom right)
      const timestamp = new Date().toLocaleString();
      ctx.font = `${canvas.width * 0.035}px Sans-Serif`;
      ctx.fillStyle = "white";
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.shadowColor = "rgba(0,0,0,0.7)";
      ctx.shadowBlur = 4;
      ctx.fillText(timestamp, canvas.width - 20, canvas.height - 20);

      // Watermark "JoJo Studio" (bottom left)
      ctx.textAlign = "left";
      ctx.fillText("JoJo Studio", 20, canvas.height - 20);

      animationFrame = requestAnimationFrame(drawOverlay);
    };

    drawOverlay();
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  // -----------------------------------------
  // Capture full-resolution photo + flash
  // -----------------------------------------
  const takePhoto = () => {
    if (!videoRef.current || !captureCanvasRef.current) return;

    const video = videoRef.current;
    const canvas = captureCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Flash effect
    setFlash(true);
    setTimeout(() => setFlash(false), 150);

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Timestamp
    const timestamp = new Date().toLocaleString();
    ctx.font = `${canvas.width * 0.035}px Sans-Serif`;
    ctx.fillStyle = "white";
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.shadowColor = "rgba(0,0,0,0.7)";
    ctx.shadowBlur = 4;
    ctx.fillText(timestamp, canvas.width - 20, canvas.height - 20);

    // Watermark
    ctx.textAlign = "left";
    ctx.fillText("JoJo Studio", 20, canvas.height - 20);

    // Save image
    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
    setCaptured(dataUrl);

    // Scroll directly to the photo
    setTimeout(() => {
      capturedRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // -----------------------------------------
  // Switch camera
  // -----------------------------------------
  const switchCamera = async () => {
    const newFacing = cameraFacing === "user" ? "environment" : "user";
    setCameraFacing(newFacing);

    stream?.getTracks().forEach((t) => t.stop());
    await startCamera(newFacing);
  };

  return (
    <div className="flex flex-col items-center relative w-full max-w-xl mx-auto">
      {/* FLASH OVERLAY */}
      {flash && (
        <div className="fixed inset-0 bg-white opacity-90 pointer-events-none z-50 transition-opacity duration-150"></div>
      )}

      <div className="relative w-full">
        <video ref={videoRef} autoPlay playsInline className="w-full h-auto" />

        <canvas
          ref={overlayCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={takePhoto}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Take Photo
        </button>

        <button
          onClick={switchCamera}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg"
        >
          Switch Camera
        </button>
      </div>

      {/* Captured image */}
      {captured && (
        <div ref={capturedRef} className="mt-8 w-full text-center">
          <h2 className="text-xl font-semibold mb-3">Your Photo</h2>
          <img src={captured} className="rounded-lg shadow-lg" alt="Captured" />
        </div>
      )}

      <canvas ref={captureCanvasRef} className="hidden" />
    </div>
  );
}
