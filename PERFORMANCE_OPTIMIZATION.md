# Performance Optimization Guide

Your AI Companion is working! Here are ways to reduce latency and make it faster.

## Quick Wins (Easiest)

### 1. Use Faster Whisper Model
The `base` model is good but slower. Switch to `tiny` for much faster transcription:

Edit `.env`:
```env
WHISPER_MODEL=tiny
```

**Speed comparison:**
- `tiny` - ~2-3 seconds (fastest, least accurate)
- `base` - ~5-10 seconds (good balance) ← current
- `small` - ~15-20 seconds (better accuracy)
- `medium` - ~30-40 seconds (high accuracy)
- `large` - ~60+ seconds (highest accuracy, slowest)

### 2. Use Faster Ollama Model
`mistral` is good but `neural-chat` is optimized for conversations:

Edit `.env`:
```env
OLLAMA_MODEL=neural-chat
```

Then download it:
```bash
ollama pull neural-chat
```

**Speed comparison:**
- `neural-chat` - ~2-5 seconds (fastest, optimized for chat)
- `mistral` - ~3-8 seconds (good balance) ← current
- `llama2` - ~5-15 seconds (more capable)
- `dolphin-mixtral` - ~10-20 seconds (very capable)

### 3. Reduce Context Length
The AI looks back at previous messages for context. Fewer messages = faster:

Edit `index.js` and find these lines:

**For voice mode (around line 95):**
```javascript
const context = memoryManager.getContextForAI(userId, 10);  // Change 10 to 5
```

**For chat mode (around line 145):**
```javascript
const context = memoryManager.getContextForAI(userId, 10);  // Change 10 to 5
```

Change `10` to `5` to use only the last 5 messages instead of 10.

## Advanced Optimizations

### 4. Enable GPU Acceleration (NVIDIA Only)

If you have an NVIDIA GPU, Ollama can use it for much faster responses:

1. Download CUDA from: https://developer.nvidia.com/cuda-downloads
2. Restart Ollama
3. Ollama will automatically detect and use your GPU

**Speed improvement:** 3-5x faster responses

### 5. Use Smaller Whisper Model with GPU

If you have GPU, you can use a larger Whisper model faster:

```env
WHISPER_MODEL=small
```

With GPU, `small` can be as fast as `base` on CPU.

### 6. Reduce Recording Duration

Currently records for 10 seconds. You can reduce this:

Edit `index.js` line 95:
```javascript
const result = await voiceIO.interactiveVoiceSession(
  async (userInput) => {
    // ...
  },
  5  // Change 10 to 5 for 5-second recording
);
```

**Trade-off:** Shorter recordings = faster, but you have less time to speak.

### 7. Parallel Processing

Currently the pipeline is sequential:
1. Record (10s)
2. Transcribe (5-10s)
3. Generate response (3-8s)
4. Convert to speech (2-3s)
5. Play (variable)

**Total: 20-35 seconds**

You could start transcribing while still recording, but this requires code changes.

## Recommended Configuration for Speed

For the fastest experience, use this `.env`:

```env
DISCORD_TOKEN=
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=neural-chat
WHISPER_MODEL=tiny
PIPER_VOICE=en_US-amy-medium
SAMPLE_RATE=16000
```

And edit `index.js` to use 5-second context and 5-second recording.

**Expected latency:** 10-15 seconds total

## Recommended Configuration for Quality

For the best quality responses, use this `.env`:

```env
DISCORD_TOKEN=
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=mistral
WHISPER_MODEL=small
PIPER_VOICE=en_US-amy-medium
SAMPLE_RATE=16000
```

**Expected latency:** 25-35 seconds total

## Monitoring Performance

To see how long each step takes, the app already logs timing:

```
Recording audio...
Transcribing audio...
User said: [text]
Generating response...
AI response: [text]
Converting to speech...
Playing response...
```

Each step shows when it starts. You can estimate timing by watching the logs.

## Troubleshooting Slow Performance

### Whisper is slow
- Switch to `tiny` model
- Reduce recording duration
- Enable GPU if available

### Ollama is slow
- Switch to `neural-chat` model
- Reduce context length
- Enable GPU if available
- Check if Ollama is using CPU (should show in Ollama window)

### Overall slow
- Reduce context length (biggest impact)
- Use faster models
- Enable GPU acceleration
- Reduce recording duration

## Summary

**Fastest setup:**
- `WHISPER_MODEL=tiny`
- `OLLAMA_MODEL=neural-chat`
- Context length: 5
- Recording: 5 seconds
- **Latency: ~10-15 seconds**

**Balanced setup (recommended):**
- `WHISPER_MODEL=base`
- `OLLAMA_MODEL=mistral`
- Context length: 10
- Recording: 10 seconds
- **Latency: ~20-30 seconds**

**Best quality:**
- `WHISPER_MODEL=small`
- `OLLAMA_MODEL=mistral`
- Context length: 15
- Recording: 10 seconds
- **Latency: ~30-40 seconds**

Choose based on your preference for speed vs. quality!
