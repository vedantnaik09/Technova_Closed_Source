import React, { useState, useRef, useEffect } from "react";
import RecordRTC from "recordrtc";
import toast from "react-hot-toast";
import hark from "hark";

const RealTimeTranscript: React.FC = () => {
  const [status, setStatus] = useState<"RECORDING" | "STOPPED">("STOPPED");
  const [recorder, setRecorder] = useState<RecordRTC | null>(null);
  const [speechEvents, setSpeechEvents] = useState<{ start: number; stop: number }[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const speechEventsRef = useRef<{ start: number; stop: number }[]>([]);
  const harkRef = useRef<any>(null);
  const recordingStartTimeRef = useRef<number | null>(null); // To track when recording starts

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

      // Initialize hark
      harkRef.current = hark(stream, { threshold: -50 });

      // Track recording start time
      recordingStartTimeRef.current = Date.now();

      harkRef.current.on("speaking", () => {
        if (recordingStartTimeRef.current) {
          const elapsedTime = Date.now() - recordingStartTimeRef.current; // Calculate elapsed time
          speechEventsRef.current.push({ start: elapsedTime, stop: 0 }); // Log start time relative to recording start
        }
      });

      harkRef.current.on("stopped_speaking", () => {
        if (recordingStartTimeRef.current) {
          const elapsedTime = Date.now() - recordingStartTimeRef.current; // Calculate elapsed time
          const lastEvent = speechEventsRef.current[speechEventsRef.current.length - 1];
          if (lastEvent && lastEvent.stop === 0) {
            lastEvent.stop = elapsedTime; // Log stop time relative to recording start
          }
        }
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

      // Send speech events to API
      sendSpeechEventsToAPI(speechEventsRef.current);

      // Clear speech events
      speechEventsRef.current = [];
      setSpeechEvents([]);

      // Reset recording start time
      recordingStartTimeRef.current = null;

      toast.dismiss();
      toast.success("Recording stopped and downloaded!");
    });
  };

  const sendSpeechEventsToAPI = async (events: { start: number; stop: number }[]) => {
    try {
      const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(events),
      });

      if (!response.ok) {
        throw new Error("Failed to send speech events to API");
      }

      const data = await response.json();
      console.log("Speech events sent to API:", data);
    } catch (error) {
      console.error("Error sending speech events to API:", error);
    }
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