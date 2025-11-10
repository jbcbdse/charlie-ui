import { useMicVAD } from "@ricky0123/vad-react";
import { useState, useEffect } from "react";

export const MicrophoneListen = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const redemptionFrames = 10;
  const vad = useMicVAD({
    startOnLoad: false,
    redemptionFrames: redemptionFrames,
    negativeSpeechThreshold: 0.2,
    positiveSpeechThreshold: 0.8,
    minSpeechFrames: 2,
    onSpeechStart: () => {
      setIsSpeaking(true);
      console.log("User started talking");
    },
    onSpeechEnd: async (audio) => {
      setIsSpeaking(false);
      console.log("User stopped talking");
      
      try {
        // Convert Float32Array to regular array for JSON serialization
        const audioArray = Array.from(audio);
        
        // Generate a unique ID for this recording
        const recordingId = Date.now().toString();
        
        // Send the audio data to the server
        const response = await fetch(`/api/speech/${recordingId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ audio: audioArray }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to upload speech');
        }
        
        const result = await response.json();
        console.log('Speech saved:', result);
      } catch (error) {
        console.error('Error saving speech:', error);
      }
    },
  });

  useEffect(() => {
    if (isEnabled) {
      vad.start();
    } else {
      vad.pause();
      setIsSpeaking(false); // Reset speaking state when disabled
    }
  }, [isEnabled, vad]);

  const toggleMicrophone = () => {
    setIsEnabled(!isEnabled);
  };

  // Determine button text based on current state
  let buttonText = "Enable Mic";
  let buttonClass = "bg-gray-300 text-black";
  
  if (isEnabled) {
    if (vad.loading) {
      buttonText = "Loading...";
      buttonClass = "bg-yellow-300 text-black";
    } else if (vad.errored) {
      buttonText = "Mic Error";
      buttonClass = "bg-red-500 text-white";
    } else if (isSpeaking) {
      buttonText = "Speaking...";
      buttonClass = "bg-green-500 text-white";
    } else {
      buttonText = "Listening";
      buttonClass = "bg-blue-400 text-white";
    }
  }

  return (
    <button 
      type="button" 
      onClick={toggleMicrophone}
      className={`rounded p-2 ${buttonClass}`}
    >
      {buttonText}
    </button>
  );
};
