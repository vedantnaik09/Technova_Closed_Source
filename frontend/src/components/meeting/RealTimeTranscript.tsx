import React, { useState, useRef } from "react";
import RecordRTC from "recordrtc";
import toast from "react-hot-toast";

const RealTimeTranscript: React.FC = () => {
  const [status, setStatus] = useState<"RECORDING" | "STOPPED">("STOPPED");
  const [recorder, setRecorder] = useState<RecordRTC | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    if (status === "RECORDING") {
      toast.error("Recording is already in progress!");
      return;
    }

    try {
      toast.loading("Starting recording...");

      // Get user media (audio only)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Initialize RecordRTC
      const recordRTC = new RecordRTC(stream, {
        type: "audio",
        mimeType: "audio/webm",
        recorderType: RecordRTC.StereoAudioRecorder,
        timeSlice: 250, // Optional: For real-time streaming
        desiredSampRate: 16000,
        numberOfAudioChannels: 1,
      });

      // Start recording
      recordRTC.startRecording();
      setRecorder(recordRTC);
      setStatus("RECORDING");

      toast.dismiss();
      toast.success("Recording started!");
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to start recording: " + error);
      console.error(error);
    }
  };

  const stopRecording = () => {
    if (status === "STOPPED" || !recorder) {
      toast.error("No recording in progress!");
      return;
    }

    toast.loading("Stopping recording...");

    // Stop the recording
    recorder.stopRecording(() => {
      // Get the recorded blob
      const blob = recorder.getBlob();

      // Create a download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recording-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Stop the media stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }

      // Reset state
      setRecorder(null);
      setStatus("STOPPED");

      toast.dismiss();
      toast.success("Recording stopped and downloaded!");
    });
  };

  return (
    <div className="self-center">
      <div className="flex max-md:flex-col justify-center gap-3">
        <div className="md:flex-row flex-col flex gap-2 items-center">
          <button
            onClick={startRecording}
            disabled={status === "RECORDING"}
            className="disabled:bg-green-200 rounded-xl bg-green-500 disabled:cursor-not-allowed p-2"
          >
            Start Recording
          </button>
          <button
            onClick={stopRecording}
            disabled={status === "STOPPED"}
            className="disabled:bg-green-200 rounded-xl bg-green-500 disabled:cursor-not-allowed p-2"
          >
            Stop Recording
          </button>
        </div>
      </div>
    </div>
  );
};

export default RealTimeTranscript;