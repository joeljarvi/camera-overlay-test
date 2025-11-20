"use client";

import { useEffect, useRef, useState } from "react";

export default function CameraWithLiveTimestamp() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null); // live timestamp
  const captureCanvasRef = useRef<HTMLCanvasElement>(null); // final image
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);

  // --------------------------
  // Start camera
  // --------------------------
  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        setStream(mediaStream);
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
      } catch (err) {
        console.error("Camera error:", err);
      }
    }
    startCamera();

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  // --------------------------
  // Live timestamp drawing (runs every frame)
  // --------------------------
  useEffect(() => {
    let animationFrame: number;

    const drawLiveOverlay = () => {
      const canvas = overlayCanvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) {
        animationFrame = requestAnimationFrame(drawLiveOverlay);
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        animationFrame = requestAnimationFrame(drawLiveOverlay);
        return;
      }

      // Ensure canvas matches video size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Clear previous frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // --- Draw timestamp ---
      const now = new Date().toLocaleString();
      ctx.font = `${canvas.width * 0.035}px Sans-Serif`;
      ctx.fillStyle = "white";
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 4;

      ctx.fillText(now, canvas.width - 20, canvas.height - 20);

      animationFrame = requestAnimationFrame(drawLiveOverlay);
    };

    drawLiveOverlay();
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  // --------------------------
  // Capture final photo
  // --------------------------
  const takePhoto = () => {
    if (!videoRef.current || !captureCanvasRef.current) return;

    const video = videoRef.current;
    const canvas = captureCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Draw the final timestamp on captured photo
    const timestamp = new Date().toLocaleString();

    ctx.font = `${canvas.width * 0.035}px Sans-Serif`;
    ctx.fillStyle = "white";
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 4;

    ctx.fillText(timestamp, canvas.width - 20, canvas.height - 20);

    const dataUrl = canvas.toDataURL("image/png");
    setCaptured(dataUrl);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-md">
        {/* Camera feed */}
        <video ref={videoRef} autoPlay playsInline className="w-full h-auto" />

        {/* Live timestamp overlay */}
        <canvas
          ref={overlayCanvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        />
      </div>

      <button
        onClick={takePhoto}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        Take Photo
      </button>

      {/* Final captured image */}
      {captured && (
        <div className="mt-4">
          <h2 className="text-lg font-bold mb-2">Captured Photo:</h2>
          <img src={captured} className="rounded-lg" alt="Captured" />
        </div>
      )}

      <canvas ref={captureCanvasRef} className="hidden" />
    </div>
  );
}
