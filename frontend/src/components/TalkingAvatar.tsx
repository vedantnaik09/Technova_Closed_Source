import "regenerator-runtime/runtime"
import React, { useState, useEffect } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { useParams } from "react-router-dom";
//@ts-ignore
import { TalkingHead } from "../modules/talkinghead.mjs";

// Interface for TalkingHead configuration
interface AvatarConfig {
  url: string;
  body: string;
  avatarMood: string;
  ttsLang: string;
  ttsVoice: string;
  lipsyncLang: string;
}

// Interface for backend response
interface NextQuestionResponse {
  response(response: any): unknown;
  question: string;
}

const TalkingAvatar: React.FC<{toggleMicFromComponent : (active: boolean) => void}> = ({toggleMicFromComponent}) => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const [head, setHead] = useState<TalkingHead | null>(null);
  const [isTranscriptionActive, setIsTranscriptionActive] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [nextQuestion, setNextQuestion] = useState<string>("");
  const [isInterviewActive, setIsInterviewActive] = useState<boolean>(true);
  
  const { 
    transcript, 
    listening, 
    browserSupportsSpeechRecognition, 
    resetTranscript 
  } = useSpeechRecognition();

  // Initialize interview session
  useEffect(() => {
    if (applicationId) {
      setSessionId(applicationId);
    }
  }, [applicationId]);

  // Start interview effect
  useEffect(() => {
    const startInterview = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/interview/start/${applicationId}`, 
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            }
          }
        );

        if (!response.ok) {
          throw new Error("Failed to start interview");
        }

        setIsInterviewActive(true);
      } catch (error) {
        console.error("Error starting interview:", error);
      }
    };

    if (applicationId) {
      startInterview();
    }
  }, [applicationId]);
    

  // Avatar initialization effect
  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      alert("Your browser does not support speech recognition.");
      return;
    }

    const initializeAvatar = async () => {
      const existingAvatar = document.querySelector("#avatar canvas");
      if (existingAvatar) return;

      const nodeAvatar = document.getElementById("avatar");
      const nodeLoading = document.getElementById("loading");
      
      if (!nodeAvatar || !nodeLoading) {
        console.error("Required DOM elements not found");
        return;
      }

      const headInstance = new TalkingHead(nodeAvatar, {
        ttsEndpoint: "https://eu-texttospeech.googleapis.com/v1beta1/text:synthesize",
        ttsApikey: "AIzaSyCeM0dAis4PJsYVlAwMrQsUuIXXTeluDyU",
        lipsyncModules: ["en", "fi"],
        cameraView: "upper",
      });

      try {
        nodeLoading.textContent = "Loading...";
        
        const avatarConfig: AvatarConfig = {
          url: "https://storage.googleapis.com/glb_buckets/4.glb",
          body: "M",
          avatarMood: "neutral",
          ttsLang: "en-GB",
          ttsVoice: "en-GB-Standard-B",
          lipsyncLang: "en",
        };

        await headInstance.showAvatar(
          avatarConfig,
          (ev: ProgressEvent) => {
            if (ev.lengthComputable) {
              let val = Math.min(100, Math.round((ev.loaded / ev.total) * 100));
              nodeLoading.textContent = `Loading ${val}%`;
            }
          }
        );
        nodeLoading.style.display = "none";
        setHead(headInstance);
      } catch (error) {
        console.error(error);
        nodeLoading.textContent = error instanceof Error ? error.toString() : "Unknown error";
      }
    };

    initializeAvatar();
  }, [browserSupportsSpeechRecognition]);

  // Transcription toggle handler
  const handleTranscriptionToggle = async () => {
    if (!isInterviewActive) return;
    
    if (isTranscriptionActive) {
      SpeechRecognition.stopListening();
      toggleMicFromComponent(true);
      setIsTranscriptionActive(false);
      // Call backend with current transcript when stopping
      if (transcript) {
        await handleBackendCall(transcript);
        resetTranscript();
      }
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true });
      toggleMicFromComponent(false);
      setIsTranscriptionActive(true);
    }
  };

  // Backend communication for next question
  const handleBackendCall = async (answer: string) => {
    if (!isInterviewActive) return;
    
    try {
      const response = await fetch(`http://localhost:8000/answer-question`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answer }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch next question");
      }

      const data: NextQuestionResponse = await response.json();
      console.log(data)
      setNextQuestion(data.question);
      
      if (head) {
        head.speakText(data?.response);
      }
    } catch (error) {
      console.error("Error communicating with the backend:", error);
    }
  };

  // Time formatting utility
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-gray-900 text-white p-5 text-sm">
      <div id="avatar" className="w-full h-48 -mt-10"></div>

      <div id="controls" className="mt-5 text-center">
        <button
          onClick={handleTranscriptionToggle}
          disabled={!isInterviewActive}
          className={`px-5 py-2 text-base font-semibold text-white rounded-lg transition-colors duration-200 ${
            !isInterviewActive ? 'bg-gray-500 cursor-not-allowed' : isTranscriptionActive ? 'bg-red-500' : 'bg-green-500'
          }`}
        >
          {!isInterviewActive 
            ? "Interview Ended" 
            : isTranscriptionActive 
              ? "Stop Transcription" 
              : "Start Transcription"}
        </button>
        <p className="mt-2 p-3 bg-gray-700 rounded-lg text-white">
          <strong>What you spoke:</strong>{" "}
          {transcript || "Click the button to start speaking."}
        </p>
        <p className="mt-2 p-3 bg-gray-800 rounded-lg text-white">
          <strong>Question:</strong> {nextQuestion || "Waiting for the question..."}
        </p>
      </div>

      <div id="loading" className="text-center mt-5"></div>
    </div>
  );
};

export default TalkingAvatar;