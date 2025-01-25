import "regenerator-runtime/runtime"
import React, { useState, useEffect } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { useParams } from "react-router-dom";
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

const TalkingAvatar: React.FC = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const [head, setHead] = useState<TalkingHead | null>(null);
  const [isTranscriptionActive, setIsTranscriptionActive] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [nextQuestion, setNextQuestion] = useState<string>("");
  const [timeRemaining, setTimeRemaining] = useState<number>(1000);
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
    
  // Timer effect
  useEffect(() => {
    if (!isInterviewActive) return;

    const timer = setInterval(() => {
      setTimeRemaining((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          handleEndInterview();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isInterviewActive]);

  const handleEndInterview = async () => {
    try {
      // const response = await fetch(`http://localhost:8000/interview/${applicationId}/end`, {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      // });

      // if (!response.ok) {
      //   throw new Error("Failed to end interview");
      // }

      // const data = await response.json();
      // console.log("Interview ended:", data);
      setIsInterviewActive(false);
      setIsTranscriptionActive(false);
      SpeechRecognition.stopListening();
      
      if (head) {
        head.speakText("Thank you for your time. The interview has ended.");
      }
    } catch (error) {
      console.error("Error ending interview:", error);
    }
  };

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
      setIsTranscriptionActive(false);
      // Call backend with current transcript when stopping
      if (transcript) {
        await handleBackendCall(transcript);
        resetTranscript();
      }
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true });
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
    <div
      style={{
        width: "100%",
        maxWidth: "800px",
        margin: "auto",
        backgroundColor: "#202020",
        color: "white",
        padding: "20px",
      }}
    >
      <div 
        style={{ 
          textAlign: "center", 
          fontSize: "24px", 
          fontWeight: "bold",
          color: timeRemaining < 60 ? "red" : "white",
          marginBottom: "20px"
        }}
      >
        Time Remaining: {formatTime(timeRemaining)}
      </div>

      <div id="avatar" style={{ width: "100%", height: "400px" }}></div>

      <div id="controls" style={{ marginTop: "20px", textAlign: "center" }}>
        <button
          onClick={handleTranscriptionToggle}
          disabled={!isInterviewActive}
          style={{
            padding: "10px 20px",
            fontSize: "18px",
            backgroundColor: !isInterviewActive ? "gray" : isTranscriptionActive ? "red" : "green",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: isInterviewActive ? "pointer" : "not-allowed",
            opacity: isInterviewActive ? 1 : 0.7,
          }}
        >
          {!isInterviewActive 
            ? "Interview Ended" 
            : isTranscriptionActive 
              ? "Stop Transcription" 
              : "Start Transcription"}
        </button>
        <p
          style={{
            fontSize: "16px",
            backgroundColor: "#333",
            padding: "10px",
            borderRadius: "8px",
            minHeight: "50px",
            color: "#fff",
            marginTop: "20px",
          }}
        >
          <strong>What you spoke:</strong>{" "}
          {transcript || "Click the button to start speaking."}
        </p>
        <p
          style={{
            fontSize: "16px",
            backgroundColor: "#444",
            padding: "10px",
            borderRadius: "8px",
            minHeight: "50px",
            color: "#fff",
            marginTop: "20px",
          }}
        >
          <strong>Question:</strong> {nextQuestion || "Waiting for the question..."}
        </p>
      </div>

      <div id="loading" style={{ textAlign: "center", marginTop: "20px" }}></div>
    </div>
  );
};

export default TalkingAvatar;