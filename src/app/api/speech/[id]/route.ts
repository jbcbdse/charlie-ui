import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const data = await request.json();
    
    if (!data.audio || !Array.isArray(data.audio)) {
      return NextResponse.json(
        { error: 'Invalid audio data' },
        { status: 400 }
      );
    }
    
    // Create the directory path
    const dirPath = path.join(os.homedir(), 'tmp', 'audio-recordings');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // Convert the array to Float32Array
    const audioData = new Float32Array(data.audio);
    
    // Create a WAV file from the Float32Array
    const wavBuffer = createWavBufferFromPCMAudio(audioData);
    
    // Save the file
    const filePath = path.join(dirPath, `speech-${id}-${Date.now()}.wav`);
    fs.writeFileSync(filePath, new Uint8Array(wavBuffer));
    
    return NextResponse.json({ 
      success: true, 
      filePath,
      message: `Speech saved to ${filePath}`
    });
  } catch (error) {
    console.error('Error saving speech:', error);
    return NextResponse.json(
      { error: 'Failed to save speech' },
      { status: 500 }
    );
  }
}

function createWavBufferFromPCMAudio(audioData: Float32Array): Buffer {
  // Sample rate should match what's used in the VAD (typically 16000Hz)
  const sampleRate = 16000;
  const numChannels = 1; // Mono
  
  // Create the WAV header
  const buffer = Buffer.alloc(44 + audioData.length * 2);
  
  // RIFF chunk descriptor
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + audioData.length * 2, 4); // Chunk size
  buffer.write('WAVE', 8);
  
  // "fmt " sub-chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1 size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // Audio format (1 for PCM)
  buffer.writeUInt16LE(numChannels, 22); // Number of channels
  buffer.writeUInt32LE(sampleRate, 24); // Sample rate
  buffer.writeUInt32LE(sampleRate * numChannels * 2, 28); // Byte rate
  buffer.writeUInt16LE(numChannels * 2, 32); // Block align
  buffer.writeUInt16LE(16, 34); // Bits per sample
  
  // "data" sub-chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(audioData.length * 2, 40); // Subchunk2 size
  
  // Write the audio data
  for (let i = 0; i < audioData.length; i++) {
    // Convert float to 16-bit PCM
    const sample = Math.max(-1, Math.min(1, audioData[i]));
    const value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    buffer.writeInt16LE(Math.floor(value), 44 + i * 2);
  }
  
  return buffer;
} 
