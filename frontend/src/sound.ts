import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from "expo-audio";
import { Platform } from "react-native";

let _soundEnabled = true;

export function setSoundEnabled(val: boolean) {
  _soundEnabled = val;
}

let _audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  if (Platform.OS !== "web") return null;
  try {
    if (!_audioCtx) {
      _audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return _audioCtx;
  } catch {
    return null;
  }
}

function playTone(frequency: number, duration: number, type: OscillatorType = "sine", gain = 0.3) {
  if (!_soundEnabled) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    gainNode.gain.setValueAtTime(gain, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch {}
}

function playSequenceWeb(notes: Array<{ freq: number; dur: number; delay: number }>, type: OscillatorType = "sine", gain = 0.3) {
  if (!_soundEnabled) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    notes.forEach(({ freq, dur, delay }) => {
      const oscillator = ctx!.createOscillator();
      const gainNode = ctx!.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx!.destination);
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(freq, ctx!.currentTime + delay);
      gainNode.gain.setValueAtTime(0.001, ctx!.currentTime + delay);
      gainNode.gain.linearRampToValueAtTime(gain, ctx!.currentTime + delay + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx!.currentTime + delay + dur);
      oscillator.start(ctx!.currentTime + delay);
      oscillator.stop(ctx!.currentTime + delay + dur);
    });
  } catch {}
}


function f32ToS16(x: number) {
  const v = Math.max(-1, Math.min(1, x));
  return Math.round(v < 0 ? v * 32768 : v * 32767);
}

function buildWav(samples: Float32Array, sampleRate = 22050): string {
  const numSamples = samples.length;
  const byteLength = 44 + numSamples * 2;
  const buf = new ArrayBuffer(byteLength);
  const view = new DataView(buf);

  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, byteLength - 8, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);          
  view.setUint16(20, 1, true);           
  view.setUint16(22, 1, true);           
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); 
  view.setUint16(32, 2, true);           
  view.setUint16(34, 16, true);          
  writeStr(36, "data");
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    view.setInt16(44 + i * 2, f32ToS16(samples[i]), true);
  }

  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return "data:audio/wav;base64," + btoa(binary);
}

function generateSine(freq: number, durationSec: number, gain = 0.3, sampleRate = 22050): Float32Array {
  const numSamples = Math.floor(durationSec * sampleRate);
  const samples = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const env = Math.min(1, (numSamples - i) / (0.02 * sampleRate)); 
    samples[i] = gain * env * Math.sin(2 * Math.PI * freq * t);
  }
  return samples;
}

function generateSawtooth(freq: number, durationSec: number, gain = 0.2, sampleRate = 22050): Float32Array {
  const numSamples = Math.floor(durationSec * sampleRate);
  const samples = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const env = Math.min(1, (numSamples - i) / (0.02 * sampleRate));
    samples[i] = gain * env * (2 * ((t * freq) % 1) - 1);
  }
  return samples;
}

function mixSamples(parts: Array<{ samples: Float32Array; offset: number }>, sampleRate = 22050): Float32Array {
  let totalLen = 0;
  for (const { samples, offset } of parts) {
    totalLen = Math.max(totalLen, offset + samples.length);
  }
  const out = new Float32Array(totalLen);
  for (const { samples, offset } of parts) {
    for (let i = 0; i < samples.length; i++) {
      out[offset + i] += samples[i];
    }
  }
  return out;
}

const SR = 22050;

function makePop(): string {
  return buildWav(generateSine(800, 0.06, 0.15, SR), SR);
}
function makeChime(): string {
  const parts = [
    { samples: generateSine(523, 0.12, 0.25, SR), offset: 0 },
    { samples: generateSine(659, 0.12, 0.25, SR), offset: Math.floor(0.1 * SR) },
    { samples: generateSine(784, 0.2, 0.25, SR),  offset: Math.floor(0.2 * SR) },
  ];
  return buildWav(mixSamples(parts, SR), SR);
}
function makeBuzz(): string {
  return buildWav(generateSawtooth(120, 0.18, 0.2, SR), SR);
}
function makeWin(): string {
  const parts = [
    { samples: generateSine(523,  0.1, 0.3, SR), offset: 0 },
    { samples: generateSine(659,  0.1, 0.3, SR), offset: Math.floor(0.12 * SR) },
    { samples: generateSine(784,  0.1, 0.3, SR), offset: Math.floor(0.24 * SR) },
    { samples: generateSine(1047, 0.35, 0.3, SR), offset: Math.floor(0.36 * SR) },
  ];
  return buildWav(mixSamples(parts, SR), SR);
}
function makeReveal(): string {
  return buildWav(generateSine(440, 0.08, 0.12, SR), SR);
}
function makeLoss(): string {
  const parts = [
    { samples: generateSawtooth(392, 0.15, 0.2, SR), offset: 0 },
    { samples: generateSawtooth(330, 0.15, 0.2, SR), offset: Math.floor(0.18 * SR) },
    { samples: generateSawtooth(262, 0.3, 0.2, SR),  offset: Math.floor(0.36 * SR) },
  ];
  return buildWav(mixSamples(parts, SR), SR);
}

const _soundCache = new Map<string, AudioPlayer>();

async function playNativeSound(dataUri: string): Promise<void> {
  if (!_soundEnabled) return;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
    }).catch(() => {});

    let sound = _soundCache.get(dataUri);
    if (!sound) {
      sound = createAudioPlayer(dataUri);
      _soundCache.set(dataUri, sound);
    }
    await sound.seekTo(0).catch(() => {});
    sound.play();
  } catch {
  }
}

let _popUri: string | null = null;
let _chimeUri: string | null = null;
let _buzzUri: string | null = null;
let _winUri: string | null = null;
let _revealUri: string | null = null;
let _lossUri: string | null = null;



export function playPop() {
  if (Platform.OS === "web") {
    playTone(800, 0.06, "sine", 0.15);
  } else {
    if (!_popUri) _popUri = makePop();
    playNativeSound(_popUri);
  }
}


export function playChime() {
  if (Platform.OS === "web") {
    playSequenceWeb([
      { freq: 523, dur: 0.12, delay: 0 },
      { freq: 659, dur: 0.12, delay: 0.1 },
      { freq: 784, dur: 0.2,  delay: 0.2 },
    ], "sine", 0.25);
  } else {
    if (!_chimeUri) _chimeUri = makeChime();
    playNativeSound(_chimeUri);
  }
}


export function playBuzz() {
  if (Platform.OS === "web") {
    playTone(120, 0.18, "sawtooth", 0.2);
  } else {
    if (!_buzzUri) _buzzUri = makeBuzz();
    playNativeSound(_buzzUri);
  }
}


export function playWin() {
  if (Platform.OS === "web") {
    playSequenceWeb([
      { freq: 523, dur: 0.1, delay: 0 },
      { freq: 659, dur: 0.1, delay: 0.12 },
      { freq: 784, dur: 0.1, delay: 0.24 },
      { freq: 1047, dur: 0.35, delay: 0.36 },
    ], "sine", 0.3);
  } else {
    if (!_winUri) _winUri = makeWin();
    playNativeSound(_winUri);
  }
}


export function playReveal() {
  if (Platform.OS === "web") {
    playTone(440, 0.08, "sine", 0.12);
  } else {
    if (!_revealUri) _revealUri = makeReveal();
    playNativeSound(_revealUri);
  }
}


export function playLoss() {
  if (Platform.OS === "web") {
    playSequenceWeb([
      { freq: 392, dur: 0.15, delay: 0 },
      { freq: 330, dur: 0.15, delay: 0.18 },
      { freq: 262, dur: 0.3,  delay: 0.36 },
    ], "sawtooth", 0.2);
  } else {
    if (!_lossUri) _lossUri = makeLoss();
    playNativeSound(_lossUri);
  }
}
