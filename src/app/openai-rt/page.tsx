'use client';
import PageCard from '@/app/components/PageCard';
import { ToolCallApiResponse } from '@/types/api';
import { useRef, useState } from 'react';

interface OpenAIFunctionCallEvent {
  type: 'response.function_call_arguments.done';
  event_id: string;
  response_id: string;
  item_id: string;
  output_index: number;
  call_id: string;
  name: string;
  arguments: string;  // Note: This is a JSON string, not an object
}
interface OpenAIFunctionCallOutput {
  type: 'conversation.item.create';
  item: {
    type: 'function_call_output';
    call_id: string;
    output: string;  // JSON string
  }
}

export default function OpenAIRTPage() {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const stopConnection = () => {
    if (peerConnectionRef.current) {
      // Close all tracks
      peerConnectionRef.current.getSenders().forEach(sender => {
        if (sender.track) {
          sender.track.stop();
        }
      });
      // Close the connection
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
      setIsConnected(false);
      console.log('WebRTC connection closed');
    }
  };

  function isOpenAIFunctionCallEvent(event: any): event is OpenAIFunctionCallEvent {
    return event.type === 'response.function_call_arguments.done';
  }
  async function handleOpenAIFunctionCallEvent(event: OpenAIFunctionCallEvent, dc: RTCDataChannel) {
    const args = JSON.parse(event.arguments);
    console.log('Function call arguments:', event.name, args);
    
    try {
      const response = await fetch('/api/openai/rt/tool-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: event.name,
          callId: event.call_id,
          arguments: args,
        }),
      });

      const result: ToolCallApiResponse = await response.json();
      const toolOutputEvent: OpenAIFunctionCallOutput = {
        type: 'conversation.item.create',
        item: {
          type: 'function_call_output',
          call_id: event.call_id,
          output: result.result,
        }
      }
      dc.send(JSON.stringify(toolOutputEvent));
      console.log('Tool call output sent:', toolOutputEvent);
    } catch (error) {
      console.error('Error calling tool:', error);
    }
  }

  const initializeRTCConnection = async (sessionData: any) => {
    try {
      // Create a peer connection
      const peerConnection = new RTCPeerConnection();
      peerConnectionRef.current = peerConnection;

      // Set up to play remote audio from the model
      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      peerConnection.ontrack = e => audioEl.srcObject = e.streams[0];

      // Add local audio track for microphone input
      const ms = await navigator.mediaDevices.getUserMedia({
        audio: true
      });
      peerConnection.addTrack(ms.getTracks()[0]);

      // Set up data channel for events
      const dataChannel = peerConnection.createDataChannel("oai-events");
      dataChannel.addEventListener("message", (e) => {
        console.log('Received event:', JSON.parse(e.data));
        const data = JSON.parse(e.data);
        if(isOpenAIFunctionCallEvent(data)) {
          handleOpenAIFunctionCallEvent(data, dataChannel);
        }
      });

      // Create and set local description
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Send offer to OpenAI and get answer
      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${sessionData.client_secret.value}`,
          "Content-Type": "application/sdp"
        },
      });

      const answer = {
        type: "answer" as RTCSdpType,
        sdp: await sdpResponse.text(),
      };
      await peerConnection.setRemoteDescription(answer);

      setIsConnected(true);
      console.log('WebRTC connection established');
    } catch (error) {
      console.error('Error initializing WebRTC:', error);
      stopConnection();
    }
  };

  const createSession = async () => {
    try {
      const response = await fetch('/api/openai/rt/session', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const data = await response.json();
      console.log('Session created:', data);
      await initializeRTCConnection(data);
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  return (
    <PageCard>
      <div className="flex flex-col items-center space-y-4">
        {!isConnected ? (
          <button 
            onClick={createSession}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Create Session
          </button>
        ) : (
          <button 
            onClick={stopConnection}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Stop Session
          </button>
        )}
      </div>
    </PageCard>
  );
} 
