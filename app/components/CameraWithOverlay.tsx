"use client";

import { useEffect, useRef, useState } from "react";

export default function CameraWithHighQuality() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">(
    "environment"
  );

  // -----------------------------------------
  // Start camera
  // -----------------------------------------
  async function startCamera(facing: "user" | "environment") {
    try {
      // Request max quality possible
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 4096 },
          height: { ideal: 2160 },
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

  // Start camera on mount
  useEffect(() => {
    startCamera(cameraFacing);
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------------------------------
  // Live timestamp overlay (every frame)
  // -----------------------------------------
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

      // Match video’s internal resolution
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Timestamp
      const timestamp = new Date().toLocaleString();
      ctx.font = `${canvas.width * 0.035}px Sans-Serif`;
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.fillStyle = "white";
      ctx.shadowColor = "rgba(0,0,0,0.7)";
      ctx.shadowBlur = 4;

      ctx.fillText(timestamp, canvas.width - 20, canvas.height - 20);

      animationFrame = requestAnimationFrame(drawLiveOverlay);
    };

    drawLiveOverlay();
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  // -----------------------------------------
  // Capture full-resolution photo
  // -----------------------------------------
  const takePhoto = () => {
    if (!videoRef.current || !captureCanvasRef.current) return;

    const video = videoRef.current;
    const canvas = captureCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Use the actual resolution (full quality)
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Add timestamp overlay
    const timestamp = new Date().toLocaleString();
    ctx.font = `${canvas.width * 0.035}px Sans-Serif`;
    ctx.fillStyle = "white";
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.shadowColor = "rgba(0,0,0,0.7)";
    ctx.shadowBlur = 4;

    ctx.fillText(timestamp, canvas.width - 20, canvas.height - 20);

    setCaptured(canvas.toDataURL("image/png"));
  };

  // -----------------------------------------
  // Switch between front/back camera
  // -----------------------------------------
  const switchCamera = async () => {
    const newFacing = cameraFacing === "user" ? "environment" : "user";
    setCameraFacing(newFacing);

    // Stop previous camera first
    stream?.getTracks().forEach((t) => t.stop());

    await startCamera(newFacing);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-md">
        <video ref={videoRef} autoPlay playsInline className="w-full h-auto" />

        <canvas
          ref={overlayCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
      </div>

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

      {captured && (
        <div className="mt-4">
          <h2 className="font-bold mb-2">Captured Photo:</h2>
          <img src={captured} className="rounded-lg" alt="Captured" />
        </div>
      )}

      <canvas ref={captureCanvasRef} className="hidden" />
    </div>
  );
}
