declare module "@ricky0123/vad-react" {
  export interface UseMicVADOptions {
    /** Whether to start the VAD automatically when the component loads. Default: true */
    startOnLoad?: boolean;
    
    /** Additional constraints to pass to getUserMedia via the audio field */
    additionalAudioConstraints?: Partial<MediaTrackConstraints>;
    
    /** Callback to run after each frame. The frame parameter contains the raw audio data for that frame */
    onFrameProcessed?: (probabilities: { isSpeech: number; notSpeech: number }, frame: Float32Array) => any;
    
    /** Callback to run if speech start was detected but onSpeechEnd will not be run because the audio segment is smaller than minSpeechFrames */
    onVADMisfire?: () => any;
    
    /** Callback to run when speech start is detected */
    onSpeechStart?: () => any;
    
    /** Callback to run when speech end is detected */
    onSpeechEnd?: (audio: Float32Array) => any;
    
    /** Threshold for positive speech detection. Default: 0.5 */
    positiveSpeechThreshold?: number;
    
    /** Threshold for negative speech detection. Default: 0.35 */
    negativeSpeechThreshold?: number;
    
    /** Number of frames to wait before ending speech detection. Default: 8 */
    redemptionFrames?: number;
    
    /** Number of samples per frame. Default: 1536 */
    frameSamples?: number;
    
    /** Number of frames to include before speech is detected. Default: 1 */
    preSpeechPadFrames?: number;
    
    /** Minimum number of frames required for speech detection. Default: 3 */
    minSpeechFrames?: number;
  }

  export interface UseMicVADReturn {
    /** Is the VAD currently listening to mic input? */
    listening: boolean;
    
    /** Did the VAD fail to load? */
    errored: false | { message: string };
    
    /** Did the VAD finish loading? */
    loading: boolean;
    
    /** Is the user speaking? */
    userSpeaking: boolean;
    
    /** Stop the VAD from running on mic input */
    pause: () => void;
    
    /** Start the VAD running on mic input */
    start: () => void;
  }

  /**
   * A React hook wrapper for MicVAD. Use this if you want to run the VAD model on mic input in a React application.
   * @param options Configuration options for the VAD
   * @returns VAD state and control functions
   */
  export function useMicVAD(options?: UseMicVADOptions): UseMicVADReturn;
} 
