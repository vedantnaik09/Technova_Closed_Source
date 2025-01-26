import React, { useState, useRef, useEffect } from "react";
import RecordRTC from "recordrtc";
import toast from "react-hot-toast";
import hark from "hark";
import { firestore } from "../../lib/firebase";

const RealTimeTranscript: React.FC<{
  roomId: string;
  userId: string;
  manager: boolean;
}> = ({ roomId, userId, manager }) => {
  const [status, setStatus] = useState<"RECORDING" | "STOPPED">("STOPPED");
  const [recorder, setRecorder] = useState<RecordRTC | null>(null);
  const [speechEvents, setSpeechEvents] = useState<{ start: number; stop: number }[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const speechEventsRef = useRef<{ start: number; stop: number }[]>([]);
  const harkRef = useRef<any>(null);
  const recordingStartTimeRef = useRef<number | null>(null);
  const hasEffectRunRef = useRef(false);
  
  // Firebase document references
  const callDoc = firestore.collection("calls").doc(roomId);
  const recordingControlDoc = callDoc.collection("recordingControl").doc("status");

  const startRecording = async () => {
    // Check manager permissions if not a manager
    if (!manager) {
      const managerControlSnapshot = await recordingControlDoc.get();
      const managerControlData = managerControlSnapshot.data();
      
      if (!managerControlData?.allowRecording) {
        toast.error("Recording not allowed by manager");
        return;
      }
    }

    if (status === "RECORDING") {
      toast.error("Recording is already in progress!");
      return;
    }

    try {
      toast.loading("Starting recording...");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const recordRTC = new RecordRTC(stream, {
        type: "audio",
        mimeType: "audio/webm",
        recorderType: RecordRTC.StereoAudioRecorder,
        timeSlice: 250,
        desiredSampRate: 16000,
        numberOfAudioChannels: 1,
      });

      harkRef.current = hark(stream, { threshold: -50 });

      recordingStartTimeRef.current = Date.now();

      harkRef.current.on("speaking", () => {
        if (recordingStartTimeRef.current) {
          const elapsedTime = Date.now() - recordingStartTimeRef.current;
          speechEventsRef.current.push({ start: elapsedTime, stop: 0 });
        }
      });

      harkRef.current.on("stopped_speaking", () => {
        if (recordingStartTimeRef.current) {
          const elapsedTime = Date.now() - recordingStartTimeRef.current;
          const lastEvent = speechEventsRef.current[speechEventsRef.current.length - 1];
          if (lastEvent && lastEvent.stop === 0) {
            lastEvent.stop = elapsedTime;
          }
        }
      });

      recordRTC.startRecording();
      setRecorder(recordRTC);
      setStatus("RECORDING");

      // If manager, update recording control document
      if (manager) {
        await recordingControlDoc.set({
          allowRecording: true,
          startedBy: userId,
          startTime: Date.now()
        });
      }

      toast.dismiss();
      toast.success("Recording started!");
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to start recording: " + error);
      console.error(error);
    }
  };

  const stopRecording = async () => {
    // Remove the permission check for managers
    if (status === "STOPPED" || !recorder) {
      toast.error("No recording in progress!");
      return;
    }

    toast.loading("Stopping recording...");

    recorder.stopRecording(async () => {
      const blob = recorder.getBlob();

      const formData = new FormData();
      formData.append("audio", blob, `recording-${Date.now()}.webm`);
      formData.append("roomId", roomId);
      formData.append("timestamps", JSON.stringify(speechEventsRef.current));
      formData.append("isLast", manager.toString());

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }

      setRecorder(null);
      setStatus("STOPPED");

      // If manager, update recording control document
      if (manager) {
        await recordingControlDoc.set({
          allowRecording: false,
          stoppedBy: userId,
          stopTime: Date.now()
        });
      }

      sendFormDataToAPI(formData);

      speechEventsRef.current = [];
      setSpeechEvents([]);
      recordingStartTimeRef.current = null;

      toast.dismiss();
      toast.success("Recording stopped and downloaded!");
    });
  };

  const sendFormDataToAPI = async (formData: FormData) => {
    try {
      const userString = localStorage.getItem('user');
      const parsedUser = userString ? JSON.parse(userString) : null;
      const userId = await parsedUser?.id
      console.log(userId)
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/audios/upload/${userId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send form data to API");
      }

      const data = await response.json();
      console.log("Form data sent to API:", data);
    } catch (error) {
      console.error("Error sending form data to API:", error);
    }
  };

  // Listen for changes in recording control document
  useEffect(() => {
    if (!manager) {
      const unsubscribe = recordingControlDoc.onSnapshot(async (doc) => {
        const data = doc.data();
        if (data?.allowRecording && status === "STOPPED") {
          await startRecording();
        } else if (!data?.allowRecording && status === "RECORDING") {
          await stopRecording();
        }
      });

      return () => unsubscribe();
    }
  }, [manager, status]);

  // Start recording when the component mounts
  useEffect(() => {
    if (hasEffectRunRef.current) return;
    hasEffectRunRef.current = true;

    // Fetch initial recording state if not a manager
    if (!manager) {
      recordingControlDoc.get().then((doc) => {
        const data = doc.data();
        if (data?.allowRecording) {
          startRecording();
        }
      });
    }
  }, []);

  return (
    <div className="self-center">
      <div className="flex max-md:flex-col justify-center gap-3">
        <div className="md:flex-row flex-col flex gap-2 items-center">
          {manager && status === "STOPPED" && (
            <button
              onClick={startRecording}
              className="rounded-xl bg-green-500 p-2"
            >
              Start Recording
            </button>
          )}

          {manager && status === "RECORDING" && (
            <button
              onClick={stopRecording}
              className="disabled:bg-green-200 rounded-xl bg-green-500 disabled:cursor-not-allowed p-2"
            >
              Stop Recording
            </button>
          )}

          {status === "RECORDING" && (
            <div className="flex items-center gap-2 text-red-600 font-bold">
              <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
              <span>Recording...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RealTimeTranscript;