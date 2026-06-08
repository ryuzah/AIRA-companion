# Audio Device Setup Guide

If you're getting an error like "Could not find audio only device with name ["Microphone"]", this guide will help you fix it.

## Problem

FFmpeg on Windows uses DirectShow to access audio devices, and the device names must match exactly. The generic name "Microphone" often doesn't work because Windows uses specific device names.

## Solution

### Step 1: Find Your Audio Device Name

Open Command Prompt and run:
```bash
ffmpeg -list_devices true -f dshow -i dummy 2>&1 | findstr /i "audio"
```

You'll see output like:
```
[in#0 @ ...] "Microphone (8- RODE NT-USB)" (audio)
[in#0 @ ...] "Microphone (Steam Streaming Microphone)" (audio)
[in#0 @ ...] "Voicemeeter Out B3 (VB-Audio Voicemeeter VAIO)" (audio)
```

**Copy the exact name of your microphone** (including parentheses and spaces).

### Step 2: Update the Code

Edit `src/voiceIO.js` and find the `recordAudio` method (around line 27):

```javascript
const ffmpeg = spawn('ffmpeg', [
  '-f', 'dshow',
  '-i', 'audio="Microphone (8- RODE NT-USB)"',  // <-- Change this line
  '-t', duration.toString(),
  '-acodec', 'pcm_s16le',
  '-ar', this.sampleRate.toString(),
  '-ac', '1',
  audioFile
]);
```

Replace `"Microphone (8- RODE NT-USB)"` with your exact device name from Step 1.

**Example:** If your device is `"Microphone (Steam Streaming Microphone)"`, change it to:
```javascript
'-i', 'audio="Microphone (Steam Streaming Microphone)"',
```

### Step 3: Test

Run the companion again:
```bash
node index.js
```

Type `voice` and test the recording.

## Alternative: Use Default Audio Device

If you want to use the system default audio device instead of specifying a name, you can modify the code to use:

```javascript
const ffmpeg = spawn('ffmpeg', [
  '-f', 'dshow',
  '-i', 'audio="@device_cm_{33D9A762-90C8-11D0-BD43-00A0C911CE86}\\wave={XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX}"',
  // ... rest of args
]);
```

However, the exact device name approach (Step 1-2) is simpler and more reliable.

## Troubleshooting

### Still getting "Could not find audio device"
- Make sure you copied the **exact** device name including all spaces and parentheses
- Device names are case-sensitive
- Try a different microphone if available

### No audio is being recorded
- Check your microphone is working in Windows Sound Settings
- Try a different microphone
- Make sure the microphone is not muted

### "FFmpeg not found"
- Verify FFmpeg is installed: `ffmpeg -version`
- Add FFmpeg to PATH if not already done

## Common Device Names

Here are some common device names you might see:

- `"Microphone (8- RODE NT-USB)"` - RODE USB microphone
- `"Microphone (Steam Streaming Microphone)"` - Steam Link microphone
- `"Microphone (Realtek High Definition Audio)"` - Built-in microphone
- `"Microphone (USB Audio Device)"` - Generic USB microphone
- `"Voicemeeter Out B3 (VB-Audio Voicemeeter VAIO)"` - Virtual audio device

## Need Help?

If you're still having issues:

1. Run the device listing command again and copy the exact name
2. Make sure there are no typos in the device name
3. Try restarting FFmpeg or your audio device
4. Check if your microphone works in other applications first

Once you get the correct device name, voice mode should work perfectly!
