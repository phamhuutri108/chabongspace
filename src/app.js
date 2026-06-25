import { PitchDetector } from "pitchy";

const stage = document.querySelector("#stage");
const appShell = document.querySelector(".app-shell");
const studio = document.querySelector(".studio");
const recordingCanvas = document.querySelector("#recordingCanvas");
const ctx = stage.getContext("2d", { alpha: false });
const recordCtx = recordingCanvas.getContext("2d", { alpha: false });

const cameraPreview = document.querySelector("#cameraPreview");
const cameraCard = document.querySelector("#cameraCard");
const permissionPanel = document.querySelector("#permissionPanel");
const startButton = document.querySelector("#startButton");
const backButton = document.querySelector("#backButton");
const titleInput = document.querySelector("#titleInput");
const subtitleInput = document.querySelector("#subtitleInput");
const listenButton = document.querySelector("#listenButton");
const cameraButton = document.querySelector("#cameraButton");
const recordButton = document.querySelector("#recordButton");
const clearButton = document.querySelector("#clearButton");
const paperToggleButton = document.querySelector("#paperToggleButton");
const hideUiButton = document.querySelector("#hideUiButton");
const paperCloseButton = document.querySelector("#paperCloseButton");
const paperPanel = document.querySelector("#paperPanel");
const paperGrid = document.querySelector("#paperGrid");
const paperImportInput = document.querySelector("#paperImportInput");
const primaryNoteReadout = document.querySelector("#primaryNoteReadout");
const volumeMeter = document.querySelector("#volumeMeter");
const recordingReadout = document.querySelector("#recordingReadout");
const waveformCanvas = document.querySelector("#waveformCanvas");
const waveformCtx = waveformCanvas.getContext("2d");
const recordingLibraryPanel = document.querySelector("#recordingLibraryPanel");
const recordingLibraryGrid = document.querySelector("#recordingLibraryGrid");
const recordingLibraryStatus = document.querySelector("#recordingLibraryStatus");
const recordingPreviewPanel = document.querySelector("#recordingPreviewPanel");
const recordingPreviewVideo = document.querySelector("#recordingPreviewVideo");
const recordingPreviewStatus = document.querySelector("#recordingPreviewStatus");
const recordingPreviewCloseButton = document.querySelector("#recordingPreviewCloseButton");
const recordingDownloadButton = document.querySelector("#recordingDownloadButton");
const recordingDeleteButton = document.querySelector("#recordingDeleteButton");

const vietnamDate = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Ho_Chi_Minh",
  day: "2-digit",
  month: "long",
  year: "numeric",
}).format(new Date());

const defaultTitle = "Music Title";

titleInput.value = defaultTitle;
subtitleInput.value = vietnamDate;

const paperTextures = [
  { id: "cold-pressed-arctic", name: "cold pressed arctic", path: "materials/paper-textures/cold-pressed-arctic.jpeg" },
  { id: "cold-pressed-off-white", name: "cold pressed off white", path: "materials/paper-textures/cold-pressed-off-white.jpeg" },
  { id: "handmade-cotton-paper", name: "handmade cotton", path: "materials/paper-textures/handmade-cotton-paper.jpeg" },
  { id: "linen-finish-ivory", name: "linen ivory", path: "materials/paper-textures/linen-finish-ivory.jpeg" },
  { id: "cream-laid-writing-paper", name: "cream laid writing", path: "materials/paper-textures/cream-laid-writing paper.jpeg" },
  { id: "laid-cream-pastel-paper", name: "laid cream pastel", path: "materials/paper-textures/laid-cream-pastel-paper.jpeg" },
  { id: "fresh-parchment", name: "fresh parchment", path: "materials/paper-textures/fresh-parchment.jpeg" },
  { id: "worn-paper", name: "worn paper", path: "materials/paper-textures/worn-paper.jpeg" },
  { id: "smooth-notebook-paper", name: "smooth notebook", path: "materials/paper-textures/smooth-notebook paper.jpeg" },
  { id: "vellum-sketchbook-paper", name: "vellum sketchbook", path: "materials/paper-textures/vellum-sketchbook paper.jpeg" },
  { id: "recycled-paper", name: "recycled paper", path: "materials/paper-textures/recycled-paper.jpeg" },
  { id: "french-writing-paper", name: "french writing", path: "materials/paper-textures/french-writing-paper.jpeg" },
  { id: "canvas-texture", name: "canvas texture", path: "materials/paper-textures/canvas-texture.jpeg" },
  { id: "grungy-canvas", name: "grungy canvas", path: "materials/paper-textures/grungy-canvas.jpeg" },
  { id: "reverse-canvas-texture", name: "reverse canvas", path: "materials/paper-textures/reverse-canvas texture.jpeg" },
];

const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const notePigments = [
  "#315eb6", // C
  "#2878c7", // C#
  "#138f9a", // D
  "#24996b", // D#
  "#6b9a35", // E
  "#c79a21", // F
  "#d87824", // F#
  "#cf4638", // G
  "#c93663", // G#
  "#b43b92", // A
  "#7957b9", // A#
  "#4050a8", // B
];
const octaveTintPigments = ["#dfb85f", "#6cc1c8", "#df6485", "#82ab67"];
const AUDIO_SAMPLE_INTERVAL = 1000 / 60;
const PITCH_ANALYSIS_INTERVAL = 1000 / 40;
const WAVEFORM_DRAW_INTERVAL = 1000 / 30;
const RECORDING_FRAME_INTERVAL = 1000 / 30;
const AUDIO_FFT_SIZE = 4096;
const RUNNING_LOCALLY = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
const MAX_CANVAS_DPR = RUNNING_LOCALLY ? 1.5 : 1;
const FLUID_TARGET_CELL_SIZE = 5.4;
const FLUID_MIN_WIDTH = 96;
const FLUID_MAX_WIDTH = RUNNING_LOCALLY ? 224 : 188;
const RECORDING_DB_NAME = "chabongspace-recordings";
const RECORDING_DB_VERSION = 1;
const RECORDING_STORE_NAME = "recordings";
const MAX_VISIBLE_RECORDINGS = 10;
const RECORDINGS_API_ENDPOINT = "/api/recordings";

const state = {
  audioContext: null,
  analyser: null,
  micSource: null,
  micStream: null,
  cameraStream: null,
  mediaRecorder: null,
  recordedChunks: [],
  recordings: [],
  selectedRecordingId: null,
  activeRecordingUrl: null,
  recordingMimeType: "video/webm",
  recordingStartedAt: 0,
  recordingDb: null,
  blobs: [],
  listening: false,
  cameraEnabled: true,
  recording: false,
  uiHidden: false,
  fluid: null,
  lastDrop: null,
  recentPaintEvents: [],
  lastArtworkTime: 0,
  lastNote: "--",
  lastNotes: ["--", "--"],
  volume: 0,
  started: false,
  paperId: "cold-pressed-arctic",
  paperImage: null,
  paperCanvas: null,
  paperCanvasSize: null,
  importedPaper: null,
  noteDetected: false,
  noteDetectedUntil: 0,
  waveformSamples: null,
  waveformPitch: 0,
  waveformDisplay: null,
  audioBuffer: null,
  frequencyData: null,
  previousSpectrum: null,
  pitchDetector: null,
  activeNotes: new Map(),
  pitchCandidate: null,
  noiseFloorRms: 0.002,
  previousVolume: 0,
  lastAudioSample: 0,
  lastPitchAnalysis: 0,
  lastWaveformDraw: 0,
  lastRecordingFrame: 0,
};

function resizeCanvas() {
  const rect = stage.getBoundingClientRect();
  const scale = Math.min(window.devicePixelRatio || 1, MAX_CANVAS_DPR);

  for (const canvas of [stage, recordingCanvas]) {
    canvas.width = Math.floor(rect.width * scale);
    canvas.height = Math.floor(rect.height * scale);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
  }

  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  recordCtx.setTransform(scale, 0, 0, scale, 0, 0);
  state.fluid = createFluidSimulation(rect.width, rect.height);
  state.paperCanvas = null;
  state.paperCanvasSize = null;
  state.lastDrop = null;
  state.recentPaintEvents = [];
  state.lastArtworkTime = 0;
  resizeWaveformCanvas();
  paintPaper(ctx, rect.width, rect.height);
}

function resizeWaveformCanvas() {
  const rect = waveformCanvas.getBoundingClientRect();
  const scale = Math.min(window.devicePixelRatio || 1, MAX_CANVAS_DPR);
  waveformCanvas.width = Math.max(1, Math.floor(rect.width * scale));
  waveformCanvas.height = Math.max(1, Math.floor(rect.height * scale));
  waveformCtx.setTransform(scale, 0, 0, scale, 0, 0);
}

function paintPaper(targetCtx, width, height, alpha = 1) {
  targetCtx.save();
  targetCtx.globalAlpha = alpha;

  if (state.paperImage?.complete && state.paperImage.naturalWidth > 0) {
    const paper = getPaperCanvas(width, height);
    targetCtx.drawImage(paper, 0, 0, width, height);
  } else {
    targetCtx.fillStyle = "#f8f6ef";
    targetCtx.fillRect(0, 0, width, height);
  }

  targetCtx.restore();
}

function getPaperCanvas(width, height) {
  if (
    state.paperCanvas
    && state.paperCanvasSize?.width === width
    && state.paperCanvasSize?.height === height
  ) {
    return state.paperCanvas;
  }

  const paperCanvas = document.createElement("canvas");
  paperCanvas.width = Math.max(1, Math.floor(width));
  paperCanvas.height = Math.max(1, Math.floor(height));
  const paperCtx = paperCanvas.getContext("2d", { alpha: false });
  paperCtx.fillStyle = "#f8f6ef";
  paperCtx.fillRect(0, 0, width, height);
  drawImageCover(paperCtx, state.paperImage, 0, 0, width, height);
  state.paperCanvas = paperCanvas;
  state.paperCanvasSize = { width, height };
  return paperCanvas;
}

function drawImageCover(targetCtx, image, x, y, width, height) {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const targetRatio = width / height;
  let sourceWidth = image.naturalWidth;
  let sourceHeight = image.naturalHeight;
  let sourceX = 0;
  let sourceY = 0;

  if (imageRatio > targetRatio) {
    sourceWidth = image.naturalHeight * targetRatio;
    sourceX = (image.naturalWidth - sourceWidth) / 2;
  } else {
    sourceHeight = image.naturalWidth / targetRatio;
    sourceY = (image.naturalHeight - sourceHeight) / 2;
  }

  targetCtx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function clearArtwork() {
  state.fluid?.clear();
  state.lastDrop = null;
  state.lastArtworkTime = 0;
  const rect = stage.getBoundingClientRect();
  paintPaper(ctx, rect.width, rect.height);
}

async function startStudio() {
  if (state.started) return;
  state.started = true;
  appShell.classList.add("studio-started");
  studio.classList.add("started");
  permissionPanel.classList.add("hidden");
  await Promise.allSettled([startAudio(), startCamera()]);
  updateButtons();
}

function backToIntro() {
  if (state.recording && state.mediaRecorder?.state === "recording") {
    state.mediaRecorder.stop();
  }

  state.micStream?.getTracks().forEach((track) => track.stop());
  state.micStream = null;
  state.micSource?.disconnect();
  state.micSource = null;
  state.audioContext?.close();
  state.audioContext = null;
  state.analyser = null;
  state.audioBuffer = null;
  state.frequencyData = null;
  state.previousSpectrum = null;
  state.pitchDetector = null;
  state.activeNotes.clear();
  state.pitchCandidate = null;
  state.noiseFloorRms = 0.002;
  state.previousVolume = 0;
  state.lastAudioSample = 0;
  state.lastPitchAnalysis = 0;
  state.listening = false;
  stopCamera();
  clearArtwork();

  state.started = false;
  state.lastNote = "--";
  state.lastNotes = ["--", "--"];
  state.volume = 0;
  updateNoteReadouts();
  volumeMeter.value = 0;
  studio.classList.remove("started");
  studio.classList.remove("ui-hidden");
  appShell.classList.remove("studio-started");
  appShell.classList.remove("ui-hidden");
  permissionPanel.classList.remove("hidden");
  closePaperPanel();
  state.uiHidden = false;
  updateButtons();
}

async function startAudio() {
  state.micStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  });

  state.audioContext = new AudioContext();
  state.analyser = state.audioContext.createAnalyser();
  state.analyser.fftSize = AUDIO_FFT_SIZE;
  state.analyser.smoothingTimeConstant = 0.18;
  state.analyser.minDecibels = -100;
  state.analyser.maxDecibels = -18;
  state.audioBuffer = new Float32Array(state.analyser.fftSize);
  state.frequencyData = new Float32Array(state.analyser.frequencyBinCount);
  state.previousSpectrum = new Float32Array(state.analyser.frequencyBinCount);
  state.pitchDetector = PitchDetector.forFloat32Array(state.analyser.fftSize);
  state.micSource = state.audioContext.createMediaStreamSource(state.micStream);
  state.micSource.connect(state.analyser);
  state.listening = true;
}

async function startCamera() {
  state.cameraStream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: "user",
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  });

  cameraPreview.srcObject = state.cameraStream;
  await cameraPreview.play();
  cameraCard.classList.add("visible");
  state.cameraEnabled = true;
}

function stopCamera() {
  state.cameraStream?.getTracks().forEach((track) => track.stop());
  state.cameraStream = null;
  cameraPreview.srcObject = null;
  cameraCard.classList.remove("visible");
  state.cameraEnabled = false;
}

function toggleListen() {
  state.listening = !state.listening;
  updateButtons();
}

async function toggleCamera() {
  if (!state.started) {
    await startStudio();
    return;
  }

  if (state.cameraStream) {
    stopCamera();
  } else {
    await startCamera();
  }
  updateButtons();
}

function updateButtons() {
  listenButton.classList.toggle("active", state.listening);
  cameraButton.classList.toggle("active", Boolean(state.cameraStream));
  recordButton.classList.toggle("recording", state.recording);
  recordButton.textContent = state.recording ? "Stop" : "Record";
  recordingReadout.textContent = state.recording ? "recording" : "ready";
  hideUiButton.textContent = state.uiHidden ? "Show UI" : "Hide UI";
  hideUiButton.setAttribute("aria-pressed", String(state.uiHidden));
}

function toggleUiVisibility() {
  state.uiHidden = !state.uiHidden;
  studio.classList.toggle("ui-hidden", state.uiHidden);
  appShell.classList.toggle("ui-hidden", state.uiHidden);
  if (state.uiHidden) closePaperPanel();
  updateButtons();
}

function frequencyToNote(frequency) {
  if (!frequency) return "--";
  const midi = Math.round(69 + 12 * Math.log2(frequency / 440));
  const octave = Math.floor(midi / 12) - 1;
  return `${noteNames[((midi % 12) + 12) % 12]}${octave}`;
}

function sampleAudio(now) {
  if (!state.analyser || !state.listening) {
    state.volume = Math.max(0, state.volume * 0.96);
    state.previousVolume = state.volume;
    state.activeNotes.clear();
    state.pitchCandidate = null;
    state.noteDetected = false;
    state.noteDetectedUntil = 0;
    state.waveformSamples = null;
    state.waveformPitch = 0;
    state.waveformDisplay = null;
    volumeMeter.value = state.volume;
    return;
  }

  if (now - state.lastAudioSample < AUDIO_SAMPLE_INTERVAL) {
    if (now >= state.noteDetectedUntil) state.noteDetected = false;
    return;
  }

  state.lastAudioSample = now;
  const buffer = state.audioBuffer;
  state.analyser.getFloatTimeDomainData(buffer);
  let volume = 0;
  for (let i = 0; i < buffer.length; i += 2) volume += buffer[i] * buffer[i];
  volume = Math.sqrt(volume / (buffer.length / 2));
  state.volume = Math.min(1, volume * 9);
  volumeMeter.value = state.volume;
  state.waveformSamples = buffer;

  if (now - state.lastPitchAnalysis < PITCH_ANALYSIS_INTERVAL) return;
  state.lastPitchAnalysis = now;

  const frequencyData = state.frequencyData;
  state.analyser.getFloatFrequencyData(frequencyData);
  const spectralFlux = calculateSpectralFlux(frequencyData, state.previousSpectrum, state.audioContext.sampleRate);
  const [detectedPitch, clarity] = state.pitchDetector.findPitch(buffer, state.audioContext.sampleRate);
  const tonality = analyzeTonality(
    frequencyData,
    state.audioContext.sampleRate,
    detectedPitch,
    clarity,
  );
  const volumeRise = (state.volume - state.previousVolume) / Math.max(0.035, state.previousVolume);
  const attackStrength = clamp(Math.max(spectralFlux * 2.7, volumeRise), 0, 1);
  state.previousVolume = state.volume;
  const minimumSignal = Math.max(0.0029, state.noiseFloorRms * 1.48);
  const quietSignal = Math.max(0.0017, state.noiseFloorRms * 1.08);
  const balancedMusicalPitch = volume >= minimumSignal
    && clarity >= 0.61
    && tonality.confidence >= 0.5
    && clarity * 0.62 + tonality.confidence * 0.38 >= 0.57;
  const quietButCleanPitch = volume >= quietSignal
    && clarity >= 0.76
    && tonality.confidence >= 0.56;
  const veryCleanQuietPitch = volume >= Math.max(0.0013, state.noiseFloorRms * 0.92)
    && clarity >= 0.86
    && tonality.confidence >= 0.68;
  const hasMusicalPitch = (balancedMusicalPitch || quietButCleanPitch || veryCleanQuietPitch)
    && detectedPitch >= 55
    && detectedPitch <= 1200;

  if (!hasMusicalPitch) {
    state.noiseFloorRms = state.noiseFloorRms * 0.975 + Math.min(volume, 0.014) * 0.025;
    if (state.pitchCandidate && now - state.pitchCandidate.lastSeen > 135) state.pitchCandidate = null;
  } else {
    state.noiseFloorRms = state.noiseFloorRms * 0.997 + Math.min(volume, state.noiseFloorRms) * 0.003;
    const midiFloat = 69 + 12 * Math.log2(detectedPitch / 440);
    const sameCandidate = state.pitchCandidate
      && Math.abs(midiFloat - state.pitchCandidate.midiFloat) < 0.62
      && now - state.pitchCandidate.lastSeen < 135;

    if (sameCandidate) {
      state.pitchCandidate.frames += 1;
      state.pitchCandidate.frequency = state.pitchCandidate.frequency * 0.58 + detectedPitch * 0.42;
      state.pitchCandidate.midiFloat = state.pitchCandidate.midiFloat * 0.58 + midiFloat * 0.42;
      state.pitchCandidate.clarity = Math.max(state.pitchCandidate.clarity * 0.82, clarity);
      state.pitchCandidate.tonality = Math.max(state.pitchCandidate.tonality * 0.82, tonality.confidence);
      state.pitchCandidate.lastSeen = now;
    } else {
      state.pitchCandidate = {
        frequency: detectedPitch,
        midiFloat,
        clarity,
        tonality: tonality.confidence,
        frames: 1,
        lastSeen: now,
      };
    }
  }

  const stablePitch = hasMusicalPitch
    && state.pitchCandidate
    && (
      state.pitchCandidate.frames >= 2
      || (clarity >= 0.82 && tonality.confidence >= 0.68)
      || veryCleanQuietPitch
    );

  if (stablePitch) {
    const primaryPitch = state.pitchCandidate.frequency;
    const primaryStrength = clamp(clarity * 0.55 + tonality.confidence * 0.45, 0.1, 1);
    const notes = [{ frequency: primaryPitch, strength: primaryStrength }];

    state.noteDetected = true;
    state.noteDetectedUntil = now + 110;
    state.waveformSamples = buffer;
    state.waveformPitch = primaryPitch;
    state.lastNotes = [frequencyToNote(notes[0].frequency), "--"];
    state.lastNote = state.lastNotes.filter((note) => note !== "--").join(" · ") || "--";
    updateNoteReadouts();

    const heardMidi = new Set();
    notes.forEach((note, index) => {
      const midi = Math.round(69 + 12 * Math.log2(note.frequency / 440));
      const previous = state.activeNotes.get(midi);
      const newlyHeard = !previous || now - previous.lastSeen > 120;
      const strongerThanBefore = previous && note.strength > previous.strength * 1.28 + 0.05;
      const lastVisualTime = previous?.lastVisualTime || 0;
      const clearReattack = attackStrength > 0.29 && now - lastVisualTime > 56;
      const sustainedAccent = note.strength > 0.84 && now - lastVisualTime > 320;
      const shouldPaint = (newlyHeard || strongerThanBefore || clearReattack || sustainedAccent)
        && shouldKeepVisualNote(now, note.strength, attackStrength, index);

      if (shouldPaint) {
        const visualStrength = note.strength * (index === 0 ? 1 : 0.78);
        createBloom(note.frequency, state.volume, now, visualStrength);
      }

      state.activeNotes.set(midi, {
        lastSeen: now,
        lastVisualTime: shouldPaint ? now : lastVisualTime,
        strength: note.strength,
      });
      heardMidi.add(midi);
    });

    for (const [midi, activeNote] of state.activeNotes) {
      if (!heardMidi.has(midi) && now - activeNote.lastSeen > 140) state.activeNotes.delete(midi);
    }
  } else {
    state.noteDetected = now < state.noteDetectedUntil;
    for (const [midi, activeNote] of state.activeNotes) {
      if (now - activeNote.lastSeen > 140) state.activeNotes.delete(midi);
    }
    if (!state.noteDetected) {
      state.waveformSamples = null;
      state.waveformPitch = 0;
      state.waveformDisplay = null;
    }
    if (!state.noteDetected) state.lastNotes = ["--", "--"];
    updateNoteReadouts();
  }
}

function shouldKeepVisualNote(now, strength, attackStrength, noteIndex = 0) {
  state.recentPaintEvents = state.recentPaintEvents.filter((time) => now - time < 1200);
  const isDensePassage = state.recentPaintEvents.length >= 7;
  const isVeryDensePassage = state.recentPaintEvents.length >= 11;
  const isImportantAccent = noteIndex === 0 && (strength > 0.86 || attackStrength > 0.42);

  if (!isDensePassage || isImportantAccent) {
    state.recentPaintEvents.push(now);
    return true;
  }

  const keepChance = isVeryDensePassage ? 0.42 : 0.52;
  const keep = Math.random() < keepChance;
  if (keep) state.recentPaintEvents.push(now);
  return keep;
}

function updateNoteReadouts() {
  primaryNoteReadout.textContent = state.lastNotes[0] || "--";
}

function calculateSpectralFlux(frequencyData, previousSpectrum, sampleRate) {
  const binHz = sampleRate / (frequencyData.length * 2);
  const firstBin = Math.max(1, Math.floor(55 / binHz));
  const lastBin = Math.min(frequencyData.length - 1, Math.ceil(1600 / binHz));
  let positiveChange = 0;
  let currentEnergy = 0;

  for (let i = firstBin; i <= lastBin; i += 1) {
    const amplitude = Math.pow(10, frequencyData[i] / 20);
    positiveChange += Math.max(0, amplitude - previousSpectrum[i]);
    currentEnergy += amplitude;
    previousSpectrum[i] = amplitude;
  }

  return positiveChange / Math.max(0.000001, currentEnergy);
}

function analyzeTonality(frequencyData, sampleRate, pitch, clarity) {
  if (!pitch || !Number.isFinite(pitch)) return { confidence: 0, harmonicRatio: 0, flatness: 1 };
  const binHz = sampleRate / (frequencyData.length * 2);
  const firstBin = Math.max(1, Math.floor(55 / binHz));
  const lastBin = Math.min(frequencyData.length - 2, Math.ceil(2200 / binHz));
  let totalPower = 0;
  let logPower = 0;
  let binCount = 0;
  const harmonicBins = new Set();

  for (let harmonic = 1; harmonic <= 8; harmonic += 1) {
    const frequency = pitch * harmonic;
    if (frequency > 2200 || frequency >= sampleRate * 0.48) break;
    const centerBin = Math.round(frequency / binHz);
    for (let offset = -1; offset <= 1; offset += 1) {
      harmonicBins.add(clamp(centerBin + offset, firstBin, lastBin));
    }
  }

  let harmonicPower = 0;
  for (let i = firstBin; i <= lastBin; i += 1) {
    const amplitude = Math.pow(10, frequencyData[i] / 20);
    const power = amplitude * amplitude + 1e-12;
    totalPower += power;
    logPower += Math.log(power);
    binCount += 1;
    if (harmonicBins.has(i)) harmonicPower += power;
  }

  const arithmeticMean = totalPower / Math.max(1, binCount);
  const geometricMean = Math.exp(logPower / Math.max(1, binCount));
  const flatness = clamp(geometricMean / Math.max(1e-12, arithmeticMean), 0, 1);
  const harmonicRatio = clamp(harmonicPower / Math.max(1e-12, totalPower), 0, 1);
  const harmonicScore = clamp((harmonicRatio - 0.1) / 0.42, 0, 1);
  const flatnessScore = clamp((0.68 - flatness) / 0.54, 0, 1);
  const confidence = clamp(clarity * 0.54 + harmonicScore * 0.3 + flatnessScore * 0.16, 0, 1);

  return { confidence, harmonicRatio, flatness };
}

function sampleSpectrumDb(frequencyData, binPosition) {
  const lower = clamp(Math.floor(binPosition), 0, frequencyData.length - 1);
  const upper = Math.min(frequencyData.length - 1, lower + 1);
  const mix = clamp(binPosition - lower, 0, 1);
  return frequencyData[lower] * (1 - mix) + frequencyData[upper] * mix;
}

function drawWaveform() {
  const rect = waveformCanvas.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  const centerY = height / 2;

  waveformCtx.clearRect(0, 0, width, height);
  waveformCtx.fillStyle = "rgba(248, 246, 239, 0.96)";
  waveformCtx.fillRect(0, 0, width, height);
  waveformCtx.beginPath();
  waveformCtx.strokeStyle = "rgba(91, 116, 72, 0.9)";
  waveformCtx.lineWidth = 1.6;
  waveformCtx.lineCap = "round";
  waveformCtx.lineJoin = "round";

  if (!state.noteDetected || !state.waveformSamples) {
    state.waveformDisplay = null;
    waveformCtx.moveTo(0, centerY);
    waveformCtx.lineTo(width, centerY);
    waveformCtx.stroke();
    return;
  }

  const samples = state.waveformSamples;
  const sampleRate = state.audioContext?.sampleRate || 44100;
  const period = sampleRate / Math.max(1, state.waveformPitch);
  const windowLength = Math.min(samples.length - 1, Math.max(128, Math.round(period * 8)));
  const centerStart = Math.max(1, Math.floor((samples.length - windowLength) / 2));
  const searchRadius = Math.max(8, Math.round(period));
  const searchStart = Math.max(1, centerStart - searchRadius);
  const searchEnd = Math.min(samples.length - windowLength - 1, centerStart + searchRadius);
  let windowStart = centerStart;
  let closestDistance = Infinity;

  for (let i = searchStart; i <= searchEnd; i += 1) {
    if (samples[i - 1] <= 0 && samples[i] > 0) {
      const distance = Math.abs(i - centerStart);
      if (distance < closestDistance) {
        windowStart = i;
        closestDistance = distance;
      }
    }
  }

  let peak = 0.01;
  for (let i = windowStart; i < windowStart + windowLength; i += 1) {
    peak = Math.max(peak, Math.abs(samples[i]));
  }

  const points = Math.max(2, Math.floor(width));
  const amplitude = height * Math.min(0.46, 0.29 + state.volume * 0.17);
  if (!state.waveformDisplay || state.waveformDisplay.length !== points) {
    state.waveformDisplay = new Float32Array(points).fill(centerY);
  }

  for (let x = 0; x < points; x += 1) {
    const progress = x / (points - 1);
    const samplePosition = windowStart + progress * (windowLength - 1);
    const sampleIndex = Math.floor(samplePosition);
    const fraction = samplePosition - sampleIndex;
    const nextIndex = Math.min(samples.length - 1, sampleIndex + 1);
    const sample = samples[sampleIndex] * (1 - fraction) + samples[nextIndex] * fraction;
    const envelope = 0.08 + 0.92 * Math.pow(Math.sin(Math.PI * progress), 0.72);
    const targetY = centerY + (sample / peak) * amplitude * envelope;
    const y = state.waveformDisplay[x] * 0.52 + targetY * 0.48;
    state.waveformDisplay[x] = y;
    if (x === 0) waveformCtx.moveTo(x, y);
    else waveformCtx.lineTo(x, y);
  }

  waveformCtx.stroke();
}

function createBloom(pitch, volume, now, prominence = 0.55) {
  const rect = stage.getBoundingClientRect();
  const noteIndex = Math.round(69 + 12 * Math.log2(pitch / 440));
  const color = getNotePigment(noteIndex, prominence, now);
  const power = clamp(volume * 0.22 + prominence * 0.78, 0.12, 1);
  const minX = rect.width * (0.09 + power * 0.055);
  const maxX = rect.width - minX;
  const minY = rect.height * (0.1 + power * 0.05);
  const maxY = rect.height - minY;
  const isPhrase = state.lastDrop && now - state.lastDrop.time < 560;
  const followsPreviousDrop = isPhrase && Math.random() < 0.45;
  const x = followsPreviousDrop
    ? clamp(state.lastDrop.x + random(-rect.width * 0.22, rect.width * 0.22), minX, maxX)
    : random(minX, maxX);
  const y = followsPreviousDrop
    ? clamp(state.lastDrop.y + random(-rect.height * 0.18, rect.height * 0.18), minY, maxY)
    : random(minY, maxY);

  state.fluid?.splat(x, y, color, power, prominence);
  state.lastDrop = { x, y, time: now };
}

function getNotePigment(noteIndex, prominence = 0.5, now = performance.now()) {
  const chroma = ((noteIndex % 12) + 12) % 12;
  const octave = Math.floor(noteIndex / 12);
  const base = parseHexColor(notePigments[chroma]);
  const tint = parseHexColor(
    octaveTintPigments[((octave % octaveTintPigments.length) + octaveTintPigments.length) % octaveTintPigments.length],
  );
  const octaveBlend = 0.08 + (((octave + chroma) % 3) * 0.045);
  const phraseWander = 0.045 * Math.sin(now * 0.0017 + noteIndex * 1.91);
  const clarityLift = clamp(prominence, 0, 1) * 0.1;
  const r = mixChannel(base.r, tint.r, octaveBlend);
  const g = mixChannel(base.g, tint.g, octaveBlend);
  const b = mixChannel(base.b, tint.b, octaveBlend);

  return rgbToHex({
    r: r + (1 - r) * (0.03 + clarityLift + phraseWander),
    g: g + (1 - g) * (0.03 + clarityLift + phraseWander),
    b: b + (1 - b) * (0.03 + clarityLift + phraseWander),
  });
}

function updateArtwork(now) {
  const rect = stage.getBoundingClientRect();
  if (!state.fluid?.active) return;

  const frameDelta = state.lastArtworkTime ? (now - state.lastArtworkTime) / (1000 / 60) : 1;
  state.lastArtworkTime = now;
  state.fluid.step(clamp(frameDelta, 0.35, 1.8), state.noteDetected);

  paintPaper(ctx, rect.width, rect.height);
  state.fluid.render(ctx, rect.width, rect.height);
}

function createFluidSimulation(displayWidth, displayHeight) {
  const width = clamp(Math.round(displayWidth / FLUID_TARGET_CELL_SIZE), FLUID_MIN_WIDTH, FLUID_MAX_WIDTH);
  const height = Math.max(64, Math.round(width * displayHeight / displayWidth));
  const size = width * height;
  const makeField = () => new Float32Array(size);
  const fluidCanvas = document.createElement("canvas");
  fluidCanvas.width = width;
  fluidCanvas.height = height;
  const fluidCtx = fluidCanvas.getContext("2d", { alpha: true });
  const imageData = fluidCtx.createImageData(width, height);

  const fluid = {
    width,
    height,
    displayWidth,
    displayHeight,
    canvas: fluidCanvas,
    context: fluidCtx,
    imageData,
    u: makeField(),
    v: makeField(),
    uPrevious: makeField(),
    vPrevious: makeField(),
    pressure: makeField(),
    pressureNext: makeField(),
    divergence: makeField(),
    curl: makeField(),
    red: makeField(),
    green: makeField(),
    blue: makeField(),
    density: makeField(),
    redPrevious: makeField(),
    greenPrevious: makeField(),
    bluePrevious: makeField(),
    densityPrevious: makeField(),
    active: false,
    time: 0,

    clear() {
      for (const field of [this.u, this.v, this.pressure, this.red, this.green, this.blue, this.density]) {
        field.fill(0);
      }
      this.pressureNext.fill(0);
      this.active = false;
      this.imageData.data.fill(0);
      this.context.putImageData(this.imageData, 0, 0);
    },

    splat(canvasX, canvasY, color, power, prominence = power) {
      const centerX = canvasX / this.displayWidth * (this.width - 1);
      const centerY = canvasY / this.displayHeight * (this.height - 1);
      const pigmentRadius = 1.05 + power * 2.25;
      const parsedColor = parseHexColor(color);
      const clockwise = Math.random() < 0.5 ? -1 : 1;
      const outwardForce = 0.58 + power * 1.72;
      const swirlForce = clockwise * (0.78 + power * 2.55);
      const plumeAngle = random(-Math.PI * 0.86, -Math.PI * 0.14);
      const plumeForce = (0.42 + power * 1.18) * (1 - power * 0.38);
      const shapePhase = Math.random() * Math.PI * 2;
      const ringStrength = clamp((prominence - 0.38) / 0.62, 0, 1);
      const ringRadius = 2.4 + power * 9.5;
      const ringThickness = 0.62 + power * 0.72;
      const influenceRadius = Math.max(
        pigmentRadius * (3.35 + power * 0.72),
        ringRadius + 3.5 + power * 3.5,
      );
      const xStart = Math.max(1, Math.floor(centerX - influenceRadius));
      const xEnd = Math.min(this.width - 2, Math.ceil(centerX + influenceRadius));
      const yStart = Math.max(1, Math.floor(centerY - influenceRadius));
      const yEnd = Math.min(this.height - 2, Math.ceil(centerY + influenceRadius));

      for (let y = yStart; y <= yEnd; y += 1) {
        for (let x = xStart; x <= xEnd; x += 1) {
          const dx = x - centerX;
          const dy = y - centerY;
          const distance = Math.hypot(dx, dy) + 0.0001;
          if (distance > influenceRadius) continue;
          const index = x + y * this.width;
          const impact = Math.pow(1 - distance / influenceRadius, 2);
          const vortexBand = Math.exp(-Math.pow(distance - ringRadius, 2) / (2 * Math.pow(ringThickness * 2.8, 2)));
          const impulse = impact * (0.45 + power * 0.72) + vortexBand * power * 0.34;
          this.u[index] += (
            dx / distance * outwardForce
            - dy / distance * swirlForce
            + Math.cos(plumeAngle) * plumeForce
          ) * impulse;
          this.v[index] += (
            dy / distance * outwardForce
            + dx / distance * swirlForce
            + Math.sin(plumeAngle) * plumeForce
          ) * impulse - impact * power * 0.48;

          const corePigment = Math.exp(-(distance * distance) / (2 * pigmentRadius * pigmentRadius));
          const ringDistance = distance - ringRadius;
          const ringPigment = Math.exp(-(ringDistance * ringDistance) / (2 * ringThickness * ringThickness));
          const angle = Math.atan2(dy, dx);
          const spiralProgress = ((angle - shapePhase) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
          const spiralRadius = ringRadius * (0.36 + spiralProgress / (Math.PI * 2) * 0.58);
          const spiralDistance = distance - spiralRadius;
          const spiralPigment = Math.exp(-(spiralDistance * spiralDistance) / (2 * Math.pow(ringThickness * 0.82, 2)));
          const lobes = clamp(
            0.7
              + Math.sin(angle * 3 + distance * 0.62 + shapePhase) * 0.34
              + Math.sin(angle * 7 - shapePhase) * 0.13,
            0.2,
            1.25,
          );
          const ringVariation = 0.92 + Math.sin(angle * 5 + shapePhase) * 0.08;
          const pigment = corePigment * (1 - ringStrength * 0.9) * lobes
            + ringPigment * ringStrength * 1.16 * ringVariation
            + spiralPigment * ringStrength * 0.74;
          const raggedEdge = 0.88 + 0.12 * Math.sin(x * 2.31 + y * 1.73 + centerX * 0.37);
          const amount = pigment * raggedEdge * (0.58 + power * 1.78);
          this.red[index] += parsedColor.r * amount;
          this.green[index] += parsedColor.g * amount;
          this.blue[index] += parsedColor.b * amount;
          this.density[index] += amount;
          const densityLimit = 2.45 + power * 0.85;
          if (this.density[index] > densityLimit) {
            const densityScale = densityLimit / this.density[index];
            this.red[index] *= densityScale;
            this.green[index] *= densityScale;
            this.blue[index] *= densityScale;
            this.density[index] = densityLimit;
          }
        }
      }

      this.active = true;
    },

    step(delta, soundActive) {
      if (!this.active) return;
      this.time += delta;
      const { width: w, height: h } = this;

      for (let y = 1; y < h - 1; y += 1) {
        for (let x = 1; x < w - 1; x += 1) {
          const i = x + y * w;
          this.curl[i] = (this.v[i + 1] - this.v[i - 1] - this.u[i + w] + this.u[i - w]) * 0.5;
        }
      }

      for (let y = 2; y < h - 2; y += 1) {
        for (let x = 2; x < w - 2; x += 1) {
          const i = x + y * w;
          const gradientX = Math.abs(this.curl[i + 1]) - Math.abs(this.curl[i - 1]);
          const gradientY = Math.abs(this.curl[i + w]) - Math.abs(this.curl[i - w]);
          const length = Math.hypot(gradientX, gradientY) + 0.0001;
          const force = this.curl[i] * 0.16 * delta;
          this.u[i] += gradientY / length * force;
          this.v[i] -= gradientX / length * force;

          const concentration = Math.min(1.5, this.density[i]);
          const centerPull = (0.38 + concentration * 0.42) * 0.00004 * delta;
          this.u[i] += (w * 0.5 - x) * centerPull;
          this.v[i] += (h * 0.5 - y) * centerPull;
          this.u[i] += Math.sin(y * 0.19 + this.time * 0.012) * 0.0018 * delta;
        }
      }

      this.uPrevious.set(this.u);
      this.vPrevious.set(this.v);
      advectField(this.u, this.uPrevious, this.uPrevious, this.vPrevious, w, h, delta);
      advectField(this.v, this.vPrevious, this.uPrevious, this.vPrevious, w, h, delta);

      const velocityDamping = Math.pow(0.975, delta);
      for (let i = 0; i < size; i += 1) {
        this.u[i] *= velocityDamping;
        this.v[i] *= velocityDamping;
      }
      projectVelocity(this, 13);
      applyColorSeparation(this, delta);

      this.redPrevious.set(this.red);
      this.greenPrevious.set(this.green);
      this.bluePrevious.set(this.blue);
      this.densityPrevious.set(this.density);
      let densityBeforeAdvection = 0;
      for (let i = 0; i < size; i += 1) densityBeforeAdvection += this.densityPrevious[i];
      advectField(this.red, this.redPrevious, this.u, this.v, w, h, delta);
      advectField(this.green, this.greenPrevious, this.u, this.v, w, h, delta);
      advectField(this.blue, this.bluePrevious, this.u, this.v, w, h, delta);
      advectField(this.density, this.densityPrevious, this.u, this.v, w, h, delta);

      let densityAfterAdvection = 0;
      for (let i = 0; i < size; i += 1) densityAfterAdvection += this.density[i];
      const massCorrection = clamp(
        densityBeforeAdvection / Math.max(0.0001, densityAfterAdvection),
        1,
        1.032,
      );
      const pigmentDecay = Math.pow(soundActive ? 0.9994 : 0.9977, delta) * massCorrection;
      let totalDensity = 0;
      for (let i = 0; i < size; i += 1) {
        this.red[i] *= pigmentDecay;
        this.green[i] *= pigmentDecay;
        this.blue[i] *= pigmentDecay;
        this.density[i] *= pigmentDecay;
        totalDensity += this.density[i];
      }
      this.active = totalDensity > 0.18;
    },

    render(targetCtx, targetWidth, targetHeight) {
      if (!this.active) return;
      const pixels = this.imageData.data;
      const { width: w, height: h } = this;

      for (let y = 0; y < h; y += 1) {
        for (let x = 0; x < w; x += 1) {
          const i = x + y * w;
          const p = i * 4;
          const density = this.density[i];
          if (density < 0.003) {
            pixels[p + 3] = 0;
            continue;
          }

          const inverseDensity = 1 / Math.max(0.001, density);
          const left = this.density[Math.max(0, i - 1)];
          const right = this.density[Math.min(size - 1, i + 1)];
          const top = this.density[Math.max(0, i - w)];
          const bottom = this.density[Math.min(size - 1, i + w)];
          const localAverage = (left + right + top + bottom) * 0.25;
          const rim = clamp((localAverage - density) * 0.5, -0.16, 0.2);
          const edge = clamp(Math.hypot(right - left, bottom - top) * 0.22, 0, 0.32);
          let waterLine = 0;
          const neighbors = [];
          if (x > 0) neighbors.push(i - 1);
          if (x < w - 1) neighbors.push(i + 1);
          if (y > 0) neighbors.push(i - w);
          if (y < h - 1) neighbors.push(i + w);
          for (const neighbor of neighbors) {
            if (neighbor < 0 || neighbor >= size || this.density[neighbor] < 0.018) continue;
            const colorDifference = pigmentColorDifference(this, i, neighbor);
            const contactDensity = Math.min(density, this.density[neighbor]);
            const separation = clamp((colorDifference - 0.12) / 0.48, 0, 1)
              * clamp(contactDensity * 1.7, 0, 1);
            waterLine = Math.max(waterLine, separation);
          }
          const grain = 0.97 + 0.03 * Math.sin(x * 12.9898 + y * 78.233);
          const coreDarkening = (1 - Math.min(0.16, density * 0.026)) * (1 - edge * 0.58);
          pixels[p] = clamp(Math.round(this.red[i] * inverseDensity * 255 * coreDarkening * grain), 0, 255);
          pixels[p + 1] = clamp(Math.round(this.green[i] * inverseDensity * 255 * coreDarkening * grain), 0, 255);
          pixels[p + 2] = clamp(Math.round(this.blue[i] * inverseDensity * 255 * coreDarkening * grain), 0, 255);
          const opacity = (1 - Math.exp(-density * 0.72) + rim * 0.64 + edge * 0.74) * 228;
          pixels[p + 3] = clamp(Math.round(opacity * (1 - waterLine * 0.92)), 0, 228);
        }
      }

      this.context.putImageData(this.imageData, 0, 0);
      targetCtx.save();
      targetCtx.globalCompositeOperation = "multiply";
      targetCtx.globalAlpha = 0.9;
      targetCtx.imageSmoothingEnabled = true;
      targetCtx.imageSmoothingQuality = "high";
      targetCtx.drawImage(this.canvas, 0, 0, targetWidth, targetHeight);
      targetCtx.restore();
    },
  };

  return fluid;
}

function advectField(destination, source, velocityX, velocityY, width, height, delta) {
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = x + y * width;
      const backX = clamp(x - velocityX[i] * delta, 0.5, width - 1.5);
      const backY = clamp(y - velocityY[i] * delta, 0.5, height - 1.5);
      const x0 = Math.floor(backX);
      const y0 = Math.floor(backY);
      const x1 = x0 + 1;
      const y1 = y0 + 1;
      const tx = backX - x0;
      const ty = backY - y0;
      const top = source[x0 + y0 * width] * (1 - tx) + source[x1 + y0 * width] * tx;
      const bottom = source[x0 + y1 * width] * (1 - tx) + source[x1 + y1 * width] * tx;
      destination[i] = top * (1 - ty) + bottom * ty;
    }
  }
}

function applyColorSeparation(fluid, delta) {
  const { width, height, density, u, v } = fluid;
  for (let y = 2; y < height - 2; y += 1) {
    for (let x = 2; x < width - 2; x += 1) {
      const i = x + y * width;
      if (density[i] < 0.025) continue;

      const right = i + 1;
      if (density[right] >= 0.025) {
        const difference = pigmentColorDifference(fluid, i, right);
        if (difference > 0.14) {
          const force = (difference - 0.14) * clamp(Math.min(density[i], density[right]), 0, 1) * 0.072 * delta;
          u[i] -= force;
          u[right] += force;
        }
      }

      const bottom = i + width;
      if (density[bottom] >= 0.025) {
        const difference = pigmentColorDifference(fluid, i, bottom);
        if (difference > 0.14) {
          const force = (difference - 0.14) * clamp(Math.min(density[i], density[bottom]), 0, 1) * 0.072 * delta;
          v[i] -= force;
          v[bottom] += force;
        }
      }
    }
  }
}

function pigmentColorDifference(fluid, first, second) {
  const firstDensity = Math.max(0.001, fluid.density[first]);
  const secondDensity = Math.max(0.001, fluid.density[second]);
  const redDifference = fluid.red[first] / firstDensity - fluid.red[second] / secondDensity;
  const greenDifference = fluid.green[first] / firstDensity - fluid.green[second] / secondDensity;
  const blueDifference = fluid.blue[first] / firstDensity - fluid.blue[second] / secondDensity;
  return Math.hypot(redDifference, greenDifference, blueDifference) / Math.sqrt(3);
}

function projectVelocity(fluid, iterations) {
  const { width, height, u, v, divergence } = fluid;
  fluid.pressure.fill(0);

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = x + y * width;
      divergence[i] = -0.5 * (u[i + 1] - u[i - 1] + v[i + width] - v[i - width]);
    }
  }

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const pressure = fluid.pressure;
    const next = fluid.pressureNext;
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const i = x + y * width;
        next[i] = (divergence[i] + pressure[i - 1] + pressure[i + 1] + pressure[i - width] + pressure[i + width]) * 0.25;
      }
    }
    fluid.pressure = next;
    fluid.pressureNext = pressure;
  }

  const pressure = fluid.pressure;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = x + y * width;
      u[i] -= (pressure[i + 1] - pressure[i - 1]) * 0.5;
      v[i] -= (pressure[i + width] - pressure[i - width]) * 0.5;
    }
  }

  for (let x = 0; x < width; x += 1) {
    u[x] = 0;
    v[x] = 0;
    const bottom = x + (height - 1) * width;
    u[bottom] = 0;
    v[bottom] = 0;
  }
  for (let y = 0; y < height; y += 1) {
    const left = y * width;
    const right = left + width - 1;
    u[left] = 0;
    v[left] = 0;
    u[right] = 0;
    v[right] = 0;
  }
}

function parseHexColor(hex) {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16) / 255,
    g: parseInt(value.slice(2, 4), 16) / 255,
    b: parseInt(value.slice(4, 6), 16) / 255,
  };
}

function mixChannel(a, b, amount) {
  return a * (1 - amount) + b * amount;
}

function rgbToHex({ r, g, b }) {
  return [r, g, b]
    .map((channel) => {
      const value = Math.round(clamp(channel, 0, 1) * 255);
      return value.toString(16).padStart(2, "0");
    })
    .join("")
    .replace(/^/, "#");
}

function drawRecordingStatusPanels(width, height) {
  const right = clamp(width * 0.03, 16, 32);
  const bottom = clamp(width * 0.03, 16, 32);
  const gap = 10;
  const statusW = Math.min(250, width * 0.38);
  const waveformW = Math.min(310, width * 0.38);
  const panelH = 74;
  const statusX = width - right - statusW;
  const panelY = height - bottom - panelH;
  const waveformX = statusX - gap - waveformW;

  recordCtx.save();
  drawSoftPanel(recordCtx, waveformX, panelY, waveformW, panelH);
  const noteW = 54;
  const innerY = panelY + 7;
  const innerH = panelH - 14;
  recordCtx.fillStyle = "rgba(248, 246, 239, 0.94)";
  recordCtx.strokeStyle = "rgba(25, 29, 24, 0.72)";
  recordCtx.lineWidth = 1;
  recordCtx.fillRect(waveformX + 7, innerY, noteW, innerH);
  recordCtx.strokeRect(waveformX + 7, innerY, noteW, innerH);
  recordCtx.fillStyle = "rgba(44, 43, 40, 0.78)";
  recordCtx.font = "12px Space Mono, Courier New, monospace";
  recordCtx.fillText(state.lastNotes[0] || "--", waveformX + 14, innerY + innerH * 0.55);
  const waveX = waveformX + 7 + noteW;
  const waveW = waveformW - 14 - noteW;
  recordCtx.fillStyle = "rgba(248, 246, 239, 0.94)";
  recordCtx.fillRect(waveX, innerY, waveW, innerH);
  recordCtx.strokeRect(waveX, innerY, waveW, innerH);
  recordCtx.drawImage(waveformCanvas, waveX, innerY, waveW, innerH);

  drawSoftPanel(recordCtx, statusX, panelY, statusW, panelH);
  recordCtx.fillStyle = "rgba(44, 43, 40, 0.52)";
  recordCtx.font = "10px Space Mono, Courier New, monospace";
  recordCtx.fillText("volume", statusX + 12, panelY + 24);
  recordCtx.fillText("recording", statusX + 12, panelY + 54);
  const meterX = statusX + 92;
  const meterY = panelY + 18;
  const meterW = statusW - 116;
  recordCtx.fillStyle = "rgba(44, 43, 40, 0.1)";
  roundRect(recordCtx, meterX, meterY, meterW, 9, 999);
  recordCtx.fill();
  const gradient = recordCtx.createLinearGradient(meterX, 0, meterX + meterW, 0);
  gradient.addColorStop(0, "#6bb6be");
  gradient.addColorStop(0.5, "#cc507b");
  gradient.addColorStop(1, "#e9b85c");
  recordCtx.fillStyle = gradient;
  roundRect(recordCtx, meterX, meterY, meterW * clamp(state.volume, 0, 1), 9, 999);
  recordCtx.fill();
  recordCtx.fillStyle = "rgba(44, 43, 40, 0.86)";
  recordCtx.font = "700 12px Space Mono, Courier New, monospace";
  recordCtx.fillText(state.recording ? "recording" : "ready", statusX + 92, panelY + 54);
  recordCtx.restore();
}

function drawSoftPanel(targetCtx, x, y, width, height) {
  targetCtx.save();
  targetCtx.fillStyle = "rgba(250, 248, 241, 0.7)";
  targetCtx.strokeStyle = "rgba(44, 43, 40, 0.18)";
  targetCtx.lineWidth = 1;
  targetCtx.fillRect(x, y, width, height);
  targetCtx.strokeRect(x, y, width, height);
  targetCtx.restore();
}

function roundRect(targetCtx, x, y, width, height, radius) {
  const r = Math.min(radius, width * 0.5, height * 0.5);
  targetCtx.beginPath();
  targetCtx.moveTo(x + r, y);
  targetCtx.lineTo(x + width - r, y);
  targetCtx.quadraticCurveTo(x + width, y, x + width, y + r);
  targetCtx.lineTo(x + width, y + height - r);
  targetCtx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  targetCtx.lineTo(x + r, y + height);
  targetCtx.quadraticCurveTo(x, y + height, x, y + height - r);
  targetCtx.lineTo(x, y + r);
  targetCtx.quadraticCurveTo(x, y, x + r, y);
}

function composeRecordingFrame() {
  const rect = stage.getBoundingClientRect();
  recordCtx.drawImage(stage, 0, 0, rect.width, rect.height);

  recordCtx.save();
  recordCtx.shadowColor = "transparent";
  recordCtx.shadowBlur = 0;
  recordCtx.shadowOffsetX = 0;
  recordCtx.shadowOffsetY = 0;
  recordCtx.fillStyle = "rgba(31, 30, 27, 0.82)";
  recordCtx.font = "24px Georgia, serif";
  recordCtx.fillText(titleInput.value || defaultTitle, 38, 52);
  recordCtx.fillStyle = "rgba(31, 30, 27, 0.46)";
  recordCtx.font = "13px ui-monospace, Menlo, monospace";
  recordCtx.fillText(subtitleInput.value || vietnamDate, 38, 78);
  recordCtx.restore();

  if (state.cameraStream && cameraPreview.videoWidth) {
    const camW = Math.min(280, rect.width * 0.3);
    const camH = camW * 0.625;
    const camX = rect.width - camW - 32;
    const camY = 32;

    recordCtx.save();
    recordCtx.fillStyle = "#171615";
    recordCtx.fillRect(camX - 1, camY - 1, camW + 2, camH + 34);
    recordCtx.translate(camX + camW, camY);
    recordCtx.scale(-1, 1);
    recordCtx.drawImage(cameraPreview, 0, 0, camW, camH);
    recordCtx.setTransform(1, 0, 0, 1, 0, 0);
    recordCtx.fillStyle = "rgba(255, 255, 255, 0.66)";
    recordCtx.font = "11px ui-monospace, Menlo, monospace";
    recordCtx.fillText("front camera", camX + 10, camY + camH + 22);
    recordCtx.restore();
  }

  drawRecordingStatusPanels(rect.width, rect.height);
}

async function toggleRecording() {
  if (!state.started) {
    await startStudio();
  }

  if (state.recording) {
    state.mediaRecorder.stop();
    return;
  }

  composeRecordingFrame();
  const stream = recordingCanvas.captureStream(30);
  if (state.micStream) {
    for (const track of state.micStream.getAudioTracks()) {
      stream.addTrack(track);
    }
  }

  const mimeType = chooseRecordingMimeType();

  state.recordedChunks = [];
  state.recordingMimeType = mimeType;
  state.recordingStartedAt = Date.now();
  state.mediaRecorder = new MediaRecorder(stream, { mimeType });
  state.mediaRecorder.addEventListener("dataavailable", (event) => {
    if (event.data.size > 0) state.recordedChunks.push(event.data);
  });
  state.mediaRecorder.addEventListener("stop", handleRecordingStop, { once: true });
  state.lastRecordingFrame = 0;
  state.mediaRecorder.start();
  state.recording = true;
  updateButtons();
}

async function handleRecordingStop() {
  state.recording = false;
  updateButtons();

  const createdAt = state.recordingStartedAt || Date.now();
  const blob = new Blob(state.recordedChunks, { type: state.recordingMimeType });
  const recording = {
    id: `recording-${createdAt}-${Math.random().toString(36).slice(2, 8)}`,
    title: titleInput.value || defaultTitle,
    subtitle: subtitleInput.value || vietnamDate,
    createdAt,
    durationMs: Math.max(0, Date.now() - createdAt),
    filename: `chabongspace-${new Date(createdAt).toISOString().slice(0, 19).replace(/:/g, "-")}.mov`,
    mimeType: state.recordingMimeType,
    size: blob.size,
    blob,
    cloudStatus: "saving",
    cloudId: null,
    cloudUrl: null,
  };

  await saveRecording(recording);
  state.recordings = await listLocalRecordings();
  renderRecordingLibrary();
  openRecordingPreview(recording.id);
  uploadRecordingToCloud(recording).catch(() => {});
}

function chooseRecordingMimeType() {
  const options = [
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  return options.find((type) => MediaRecorder.isTypeSupported(type)) || "video/webm";
}

function downloadRecording(recording) {
  if (!recording?.blob && !recording?.cloudUrl) return;
  const url = recording.blob ? URL.createObjectURL(recording.blob) : recording.cloudUrl;
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = recording.filename || "chabongspace.mov";
  anchor.click();
  if (recording.blob) URL.revokeObjectURL(url);
}

function openRecordingsDb() {
  if (state.recordingDb) return Promise.resolve(state.recordingDb);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(RECORDING_DB_NAME, RECORDING_DB_VERSION);
    request.addEventListener("upgradeneeded", () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(RECORDING_STORE_NAME)) {
        const store = db.createObjectStore(RECORDING_STORE_NAME, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt");
      }
    });
    request.addEventListener("success", () => {
      state.recordingDb = request.result;
      resolve(state.recordingDb);
    });
    request.addEventListener("error", () => reject(request.error));
  });
}

async function saveRecording(recording) {
  const db = await openRecordingsDb();
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(RECORDING_STORE_NAME, "readwrite");
    transaction.objectStore(RECORDING_STORE_NAME).put(recording);
    transaction.addEventListener("complete", resolve);
    transaction.addEventListener("error", () => reject(transaction.error));
  });
}

async function listLocalRecordings() {
  const db = await openRecordingsDb();
  const recordings = await new Promise((resolve, reject) => {
    const transaction = db.transaction(RECORDING_STORE_NAME, "readonly");
    const request = transaction.objectStore(RECORDING_STORE_NAME).getAll();
    request.addEventListener("success", () => resolve(request.result || []));
    request.addEventListener("error", () => reject(request.error));
  });

  return recordings.sort((a, b) => b.createdAt - a.createdAt);
}

async function deleteLocalRecording(id) {
  const db = await openRecordingsDb();
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(RECORDING_STORE_NAME, "readwrite");
    transaction.objectStore(RECORDING_STORE_NAME).delete(id);
    transaction.addEventListener("complete", resolve);
    transaction.addEventListener("error", () => reject(transaction.error));
  });
}

async function uploadRecordingToCloud(recording) {
  try {
    const formData = new FormData();
    formData.append("file", recording.blob, recording.filename);
    formData.append("metadata", JSON.stringify({
      id: recording.id,
      title: recording.title,
      subtitle: recording.subtitle,
      createdAt: recording.createdAt,
      mimeType: recording.mimeType,
      filename: recording.filename,
    }));

    const response = await fetch(RECORDINGS_API_ENDPOINT, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) throw new Error("Cloud upload endpoint unavailable");
    const result = await response.json().catch(() => ({}));
    const updated = {
      ...recording,
      cloudStatus: "cloud",
      cloudId: result.id || recording.id,
      cloudUrl: result.url || null,
    };
    await saveRecording(updated);
  } catch {
    await saveRecording({ ...recording, cloudStatus: "local" });
  }

  state.recordings = await listLocalRecordings();
  renderRecordingLibrary();
  updateOpenPreviewStatus();
}

async function deleteRecording(recording) {
  if (!recording) return;
  if (recording.cloudId || recording.cloudStatus === "cloud") {
    await fetch(`${RECORDINGS_API_ENDPOINT}/${encodeURIComponent(recording.cloudId || recording.id)}`, {
      method: "DELETE",
    }).catch(() => {});
  }
  await deleteLocalRecording(recording.id);
  state.recordings = await listLocalRecordings();
  if (state.selectedRecordingId === recording.id) closeRecordingPreview();
  renderRecordingLibrary();
}

async function loadRecordingLibrary() {
  const [localRecordings, cloudRecordings] = await Promise.all([
    listLocalRecordings(),
    listCloudRecordings(),
  ]);
  const byId = new Map();
  for (const recording of cloudRecordings) byId.set(recording.id, recording);
  for (const recording of localRecordings) byId.set(recording.id, { ...byId.get(recording.id), ...recording });
  state.recordings = [...byId.values()].sort((a, b) => b.createdAt - a.createdAt);
  renderRecordingLibrary();
}

async function listCloudRecordings() {
  try {
    const response = await fetch(RECORDINGS_API_ENDPOINT);
    if (!response.ok) return [];
    const result = await response.json();
    const items = Array.isArray(result) ? result : result.recordings || [];
    return items.map((item) => ({
      id: item.id,
      title: item.title || defaultTitle,
      subtitle: item.subtitle || "",
      createdAt: item.createdAt || Date.now(),
      durationMs: item.durationMs || 0,
      filename: item.filename || "chabongspace.mov",
      mimeType: item.mimeType || "video/quicktime",
      size: item.size || 0,
      blob: null,
      cloudStatus: "cloud",
      cloudId: item.cloudId || item.id,
      cloudUrl: item.url || item.cloudUrl,
    })).filter((item) => item.id && item.cloudUrl);
  } catch {
    return [];
  }
}

function renderRecordingLibrary() {
  recordingLibraryGrid.innerHTML = "";
  recordingLibraryStatus.textContent = state.recordings.length
    ? `${Math.min(state.recordings.length, MAX_VISIBLE_RECORDINGS)} shown`
    : "no videos yet";

  const visibleRecordings = state.recordings.slice(0, MAX_VISIBLE_RECORDINGS);
  if (!visibleRecordings.length) {
    const empty = document.createElement("div");
    empty.className = "recording-library-empty";
    empty.textContent = "recorded videos will appear here";
    recordingLibraryGrid.append(empty);
    return;
  }

  for (const recording of visibleRecordings) {
    const card = document.createElement("article");
    card.className = "recording-card";

    const thumb = document.createElement("button");
    thumb.className = "recording-thumb";
    thumb.type = "button";
    thumb.setAttribute("aria-label", `Preview ${recording.title}`);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.src = recording.blob ? URL.createObjectURL(recording.blob) : recording.cloudUrl;
    thumb.append(video);
    thumb.addEventListener("click", () => openRecordingPreview(recording.id));

    const meta = document.createElement("div");
    meta.className = "recording-card-meta";
    const title = document.createElement("span");
    title.className = "recording-card-title";
    title.textContent = recording.title || defaultTitle;
    const actions = document.createElement("div");
    actions.className = "recording-card-actions";
    const deleteButton = document.createElement("button");
    deleteButton.className = "recording-mini-button";
    deleteButton.type = "button";
    deleteButton.textContent = "delete";
    deleteButton.addEventListener("click", (event) => {
      event.stopPropagation();
      deleteRecording(recording);
    });
    actions.append(deleteButton);
    meta.append(title, actions);
    card.append(thumb, meta);
    recordingLibraryGrid.append(card);
  }
}

function openRecordingPreview(recordingId) {
  const recording = state.recordings.find((item) => item.id === recordingId);
  if (!recording) return;

  closeActiveRecordingUrl();
  state.selectedRecordingId = recording.id;
  if (recording.blob) {
    state.activeRecordingUrl = URL.createObjectURL(recording.blob);
    recordingPreviewVideo.src = state.activeRecordingUrl;
  } else {
    recordingPreviewVideo.src = recording.cloudUrl;
  }
  recordingPreviewPanel.classList.add("open");
  recordingPreviewPanel.setAttribute("aria-hidden", "false");
  updateOpenPreviewStatus();
}

function closeRecordingPreview() {
  recordingPreviewPanel.classList.remove("open");
  recordingPreviewPanel.setAttribute("aria-hidden", "true");
  recordingPreviewVideo.pause();
  recordingPreviewVideo.removeAttribute("src");
  recordingPreviewVideo.load();
  closeActiveRecordingUrl();
  state.selectedRecordingId = null;
}

function closeActiveRecordingUrl() {
  if (!state.activeRecordingUrl) return;
  URL.revokeObjectURL(state.activeRecordingUrl);
  state.activeRecordingUrl = null;
}

function updateOpenPreviewStatus() {
  const recording = state.recordings.find((item) => item.id === state.selectedRecordingId);
  if (!recording) return;
  const statusText = recording.cloudStatus === "cloud"
    ? "saved on Cloudflare"
    : recording.cloudStatus === "saving"
      ? "saving to Cloudflare..."
      : "saved locally; Cloudflare endpoint not connected";
  recordingPreviewStatus.textContent = statusText;
}

function animate(now = 0) {
  sampleAudio(now);
  if (now - state.lastWaveformDraw >= WAVEFORM_DRAW_INTERVAL) {
    state.lastWaveformDraw = now;
    drawWaveform();
  }
  updateArtwork(now);
  if (state.recording && now - state.lastRecordingFrame >= RECORDING_FRAME_INTERVAL) {
    state.lastRecordingFrame = now;
    composeRecordingFrame();
  }
  requestAnimationFrame(animate);
}

function random(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function buildPaperPicker() {
  paperGrid.innerHTML = "";

  const importButton = document.createElement("button");
  importButton.className = "paper-option import-option";
  importButton.type = "button";
  importButton.dataset.paperId = "imported-paper";
  importButton.setAttribute("aria-label", "Import a custom paper image");

  const importPreview = document.createElement("span");
  importPreview.className = "paper-preview";
  if (state.importedPaper) {
    importPreview.style.backgroundImage = `url("${state.importedPaper.path}")`;
  } else {
    importPreview.textContent = "+";
  }

  const importName = document.createElement("span");
  importName.className = "paper-name";
  importName.textContent = state.importedPaper ? state.importedPaper.name : "import image";

  importButton.append(importPreview, importName);
  importButton.addEventListener("click", () => paperImportInput.click());
  paperGrid.append(importButton);

  for (const paper of paperTextures) {
    const button = document.createElement("button");
    button.className = "paper-option";
    button.type = "button";
    button.dataset.paperId = paper.id;
    button.setAttribute("aria-label", `Use ${paper.name} paper`);

    const preview = document.createElement("span");
    preview.className = "paper-preview";
    preview.style.backgroundImage = `url("${encodeURI(paper.path)}")`;

    const name = document.createElement("span");
    name.className = "paper-name";
    name.textContent = paper.name;

    button.append(preview, name);
    button.addEventListener("click", () => selectPaper(paper.id));
    paperGrid.append(button);
  }

  updatePaperPicker();
}

function updatePaperPicker() {
  paperGrid.querySelectorAll(".paper-option").forEach((button) => {
    button.classList.toggle("active", button.dataset.paperId === state.paperId);
  });
}

function openPaperPanel() {
  paperPanel.classList.add("open");
  paperToggleButton.classList.add("paper-active");
  paperToggleButton.setAttribute("aria-expanded", "true");
}

function closePaperPanel() {
  paperPanel.classList.remove("open");
  paperToggleButton.classList.remove("paper-active");
  paperToggleButton.setAttribute("aria-expanded", "false");
}

function togglePaperPanel() {
  if (paperPanel.classList.contains("open")) {
    closePaperPanel();
  } else {
    openPaperPanel();
  }
}

function selectPaper(paperId) {
  const paper = paperId === state.importedPaper?.id
    ? state.importedPaper
    : paperTextures.find((item) => item.id === paperId);
  if (!paper || paper.id === state.paperId) return;

  loadPaperTexture(paper);
  closePaperPanel();
}

function loadPaperTexture(paper) {
  const image = new Image();
  image.onload = () => {
    state.paperId = paper.id;
    state.paperImage = image;
    state.paperCanvas = null;
    state.paperCanvasSize = null;
    updatePaperPicker();
    clearArtwork();
  };
  image.src = encodeURI(paper.path);
}

function importPaperImage(event) {
  const [file] = event.target.files;
  event.target.value = "";
  if (!file) return;

  if (state.importedPaper?.objectUrl) {
    URL.revokeObjectURL(state.importedPaper.objectUrl);
  }

  const objectUrl = URL.createObjectURL(file);
  state.importedPaper = {
    id: "imported-paper",
    name: file.name.replace(/\.[^.]+$/, "") || "imported image",
    path: objectUrl,
    objectUrl,
  };

  buildPaperPicker();
  loadPaperTexture(state.importedPaper);
  closePaperPanel();
}

function closePaperPanelOnOutsideClick(event) {
  if (!paperPanel.classList.contains("open")) return;
  if (paperPanel.contains(event.target) || paperToggleButton.contains(event.target)) return;
  closePaperPanel();
}

buildPaperPicker();
loadPaperTexture(paperTextures[0]);
startButton.addEventListener("click", startStudio);
backButton.addEventListener("click", backToIntro);
listenButton.addEventListener("click", toggleListen);
cameraButton.addEventListener("click", toggleCamera);
recordButton.addEventListener("click", toggleRecording);
clearButton.addEventListener("click", clearArtwork);
paperToggleButton.addEventListener("click", togglePaperPanel);
hideUiButton.addEventListener("click", toggleUiVisibility);
paperCloseButton.addEventListener("click", closePaperPanel);
paperImportInput.addEventListener("change", importPaperImage);
recordingPreviewCloseButton.addEventListener("click", closeRecordingPreview);
recordingDownloadButton.addEventListener("click", () => {
  const recording = state.recordings.find((item) => item.id === state.selectedRecordingId);
  downloadRecording(recording);
});
recordingDeleteButton.addEventListener("click", () => {
  const recording = state.recordings.find((item) => item.id === state.selectedRecordingId);
  deleteRecording(recording);
});
document.addEventListener("pointerdown", closePaperPanelOnOutsideClick);
window.addEventListener("resize", resizeCanvas);

resizeCanvas();
loadRecordingLibrary().catch(() => {
  recordingLibraryStatus.textContent = "library unavailable";
});
animate();
