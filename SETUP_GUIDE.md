# AI Companion - Complete Setup Guide

This guide will walk you through setting up the AI Companion step-by-step.

## Step 1: Install Prerequisites

### 1.1 Install Ollama (AI Model)

**Windows:**
1. Download from https://ollama.ai
2. Run the installer
3. Open Command Prompt and verify installation:
   ```bash
   ollama --version
   ```

**macOS:**
```bash
brew install ollama
```

**Linux:**
```bash
curl https://ollama.ai/install.sh | sh
```

### 1.2 Download an AI Model

Open Command Prompt/Terminal and run:
```bash
ollama pull mistral
```

Other options:
- `ollama pull neural-chat` - Optimized for conversations
- `ollama pull llama2` - More capable but slower
- `ollama pull dolphin-mixtral` - Very capable

### 1.3 Install FFmpeg (Audio Processing)

**Windows:**
1. Download from https://ffmpeg.org/download.html
2. Extract to a folder (e.g., `C:\ffmpeg`)
3. Add to PATH:
   - Right-click "This PC" → Properties
   - Click "Advanced system settings"
   - Click "Environment Variables"
   - Under "System variables", click "New"
   - Variable name: `PATH`
   - Variable value: `C:\ffmpeg\bin` (or your extraction path)
   - Click OK

Verify installation:
```bash
ffmpeg -version
```

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt-get install ffmpeg
```

### 1.4 Install Python (if not already installed)

Download from https://www.python.org/downloads/

**Important:** Check "Add Python to PATH" during installation

Verify installation:
```bash
python --version
```

### 1.5 Install Whisper (Speech-to-Text)

Open Command Prompt/Terminal and run:
```bash
pip install openai-whisper
```

Verify installation:
```bash
whisper --version
```

### 1.6 Install Piper (Text-to-Speech)

Open Command Prompt/Terminal and run:
```bash
pip install piper-tts
```

Verify installation:
```bash
piper --help
```

## Step 2: Set Up the Project

### 2.1 Navigate to Project Directory

```bash
cd d:\Mark\Projects\2026\Companion
```

### 2.2 Install Node.js Dependencies

```bash
npm install
```

### 2.3 Create Configuration File

Copy the example configuration:
```bash
copy .env.example .env
```

Or manually create `.env` with:
```env
DISCORD_TOKEN=
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=mistral
WHISPER_MODEL=base
PIPER_VOICE=en_US-amy-medium
SAMPLE_RATE=16000
```

## Step 3: Test the Installation

### 3.1 Start Ollama

Open a new Command Prompt/Terminal and run:
```bash
ollama serve
```

You should see:
```
Listening on 127.0.0.1:11434
```

**Keep this terminal open!**

### 3.2 Test Voice Mode

In another Command Prompt/Terminal, navigate to the project and run:
```bash
node index.js
```

You should see:
```
╔════════════════════════════════════════╗
║   AI Companion - Local Voice Chat      ║
╚════════════════════════════════════════╝

Commands:
  voice    - Start voice conversation
  chat     - Start text conversation
  discord  - Start Discord bot
  clear    - Clear conversation history
  exit     - Exit the application

>
```

Type `chat` and press Enter:
```
> chat
💬 Chat Mode - Type your messages (type "back" to return)

You: Hello
AI: Thinking...
AI: Hello! How can I help you today?

You: back
```

If this works, congratulations! The basic setup is complete.

### 3.3 Test Voice Mode (Optional)

Type `voice` and press Enter:
```
> voice
🎤 Voice Mode - Speak now (10 seconds)...
```

Speak into your microphone for up to 10 seconds. The AI should transcribe and respond.

## Step 4: Discord Integration (Optional)

### 4.1 Create a Discord Bot

1. Go to https://discord.com/developers/applications
2. Click "New Application"
3. Give it a name (e.g., "Companion")
4. Go to the "Bot" section on the left
5. Click "Add Bot"
6. Under TOKEN, click "Copy"
7. Paste the token into `.env`:
   ```env
   DISCORD_TOKEN=your_token_here
   ```

### 4.2 Configure Bot Permissions

1. In the Developer Portal, go to "OAuth2" → "URL Generator"
2. Under "SCOPES", select:
   - `bot`
3. Under "PERMISSIONS", select:
   - `Send Messages`
   - `Read Messages/View Channels`
   - `Connect` (for voice)
   - `Speak` (for voice)
4. Copy the generated URL and open it in your browser
5. Select a server and authorize

### 4.3 Test Discord Bot

1. Make sure Ollama is still running
2. In the project terminal, type:
   ```
   > discord
   ```
3. You should see:
   ```
   🤖 Starting Discord bot...
   ✓ Discord bot is running. Press Ctrl+C to stop.
   ```
4. Go to Discord and mention your bot:
   ```
   @Companion Hello!
   ```
5. The bot should respond!

## Troubleshooting

### "Ollama is not running"
- Make sure you have a terminal with `ollama serve` running
- Check that it says "Listening on 127.0.0.1:11434"

### "FFmpeg error"
- Verify FFmpeg is installed: `ffmpeg -version`
- If not found, add it to PATH (see Step 1.3)

### "Whisper error"
- Verify Whisper is installed: `whisper --version`
- If not found, run: `pip install openai-whisper`

### "Piper error"
- Verify Piper is installed: `piper --help`
- If not found, run: `pip install piper-tts`

### "No audio input"
- Check your microphone is connected and working
- Test in Windows Sound Settings
- Try a different microphone if available

### "Discord bot not responding"
- Verify bot has Message Content intent enabled in Developer Portal
- Check bot has permission to send messages in the channel
- Verify token is correct in `.env`
- Make sure bot is online (green status in Discord)

### "Slow responses"
- Use a faster model: `OLLAMA_MODEL=neural-chat`
- Use a smaller Whisper model: `WHISPER_MODEL=tiny`
- Reduce context length in code

## Performance Optimization

### For Faster Responses

1. **Use a faster AI model:**
   ```bash
   ollama pull neural-chat
   ```
   Then update `.env`:
   ```env
   OLLAMA_MODEL=neural-chat
   ```

2. **Use a faster Whisper model:**
   ```env
   WHISPER_MODEL=tiny
   ```

3. **Enable GPU acceleration (if you have NVIDIA GPU):**
   - Ollama automatically uses GPU if available
   - Check: https://ollama.ai for setup

### For Better Quality

1. **Use a larger AI model:**
   ```bash
   ollama pull llama2
   ```

2. **Use a better Whisper model:**
   ```env
   WHISPER_MODEL=medium
   ```

## Next Steps

1. **Customize the AI personality:**
   - Edit `src/ollama.js` to add a system prompt

2. **Add Discord commands:**
   - Edit `src/discordBot.js` to add slash commands

3. **Adjust voice settings:**
   - Change `PIPER_VOICE` in `.env` for different voices
   - Change `WHISPER_MODEL` for different accuracy levels

4. **Explore conversation history:**
   - Check `./data/conversations.json` to see stored conversations

## Getting Help

If you encounter issues:

1. **Check the console output** - Error messages are usually helpful
2. **Verify all prerequisites** - Run the version checks from Step 1
3. **Check the README.md** - Has more detailed information
4. **Restart Ollama** - Sometimes it needs a fresh start

## Common Commands

```bash
# Start Ollama
ollama serve

# Start the companion
node index.js

# List available Ollama models
ollama list

# Download a new model
ollama pull <model-name>

# Check Whisper installation
whisper --version

# Check Piper installation
piper --help

# Check FFmpeg installation
ffmpeg -version
```

Enjoy your AI Companion! 🎉
