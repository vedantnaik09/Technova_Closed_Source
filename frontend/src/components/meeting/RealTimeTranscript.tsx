import React, { useState, useRef, useEffect } from "react";
import RecordRTC from "recordrtc";
import toast from "react-hot-toast";
import hark from "hark";

const RealTimeTranscript: React.FC<{
  roomId: string;
  userId: string;
  isLast: boolean;
}> = ({ roomId, userId, isLast }) => {
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

      // Create a FormData object
      const formData = new FormData();
      formData.append("audio", blob, `recording-${Date.now()}.webm`);
      formData.append("roomId", roomId);
      formData.append("timestamps", JSON.stringify(speechEventsRef.current));
      formData.append("isLast", isLast.toString());

      // Stop the media stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }

      // Reset state
      setRecorder(null);
      setStatus("STOPPED");

      // Send form data to API
      sendFormDataToAPI(formData);

      // Clear speech events
      speechEventsRef.current = [];
      setSpeechEvents([]);

      // Reset recording start time
      recordingStartTimeRef.current = null;

      toast.dismiss();
      toast.success("Recording stopped and downloaded!");
    });
  };

  const sendFormDataToAPI = async (formData: FormData) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/audios/upload/:6794d66dc7bc62141a55c355`,
        {
          method: "POST",
          headers: {
            // Authorization: `Bearer ${localStorage.getItem("bearerToken")}`, // Assuming the token is stored in localStorage
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3OTRkNjZkYzdiYzYyMTQxYTU1YzM1NSIsImVtYWlsIjoibmlzaHVAZXhhbXBsZS5jb20iLCJyb2xlIjoiRU1QTE9ZRUUiLCJpYXQiOjE3Mzc4MDc0NjksImV4cCI6MTczNzg5Mzg2OX0.zXbifjU3Ot5pNN7rebgRWivfjuh05E8vsUbll5pegAI`, // Assuming the token is stored in localStorage
          },
          body: formData,
        }
      );
      console.log(`URL IS ${import.meta.env.VITE_BASE_URL}/api/meetings/audios/upload/:6794d66dc7bc62141a55c355
`);
      if (!response.ok) {
        throw new Error("Failed to send form data to API");
      }

      const data = await response.json();
      console.log("Form data sent to API:", data);
    } catch (error) {
      console.error("Error sending form data to API:", error);
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
