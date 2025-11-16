// Must implement decode manually as per Gemini guidance
const decode = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Must implement decodeAudioData manually for raw PCM data
const decodeRawAudioData = async (
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> => {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
};

let audioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;

export const playAudio = async (base64Audio: string): Promise<void> => {
  if (currentSource) {
    currentSource.stop();
  }
  
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }

  const audioBytes = decode(base64Audio);
  const audioBuffer = await decodeRawAudioData(audioBytes, audioContext, 24000, 1);

  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  source.start();

  currentSource = source;
};

// Function to write a string to a DataView
const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

// Function to convert base64 raw audio to a WAV Blob
export const createWavBlobFromBase64 = (base64Audio: string): Blob => {
  const audioBytes = decode(base64Audio);
  // The raw data from the API is 16-bit PCM
  const pcmData = new Int16Array(audioBytes.buffer);

  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const dataSize = pcmData.length * (bitsPerSample / 8);

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // "fmt " sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Sub-chunk size (16 for PCM)
  view.setUint16(20, 1, true);  // Audio format (1 for PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true); // Byte rate
  view.setUint16(32, numChannels * (bitsPerSample / 8), true); // Block align
  view.setUint16(34, bitsPerSample, true);

  // "data" sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM data
  for (let i = 0; i < pcmData.length; i++) {
    view.setInt16(44 + i * 2, pcmData[i], true);
  }

  return new Blob([view], { type: 'audio/wav' });
};
