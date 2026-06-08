# AI Companion - Local Voice Chat

A fully local AI companion that you can speak to via microphone and have it respond in voice. Features conversation memory, Discord integration, and runs entirely on your machine with no cloud dependencies.

## Features

✨ **Voice Interaction** - Speak to your AI companion and hear responses in natural voice
🧠 **Conversation Memory** - The AI remembers your conversation history
💬 **Text Chat** - Alternative text-based interface
🤖 **Discord Integration** - Bot can join Discord calls and respond to mentions
🏠 **Fully Local** - No cloud services, no API fees, complete privacy
⚡ **Fast & Lightweight** - Runs on modest hardware

## Prerequisites

Before you start, you'll need to install these tools:

### 1. **Ollama** (AI Model)
- Download from: https://ollama.ai
- Install and run Ollama
- Pull a model: `ollama pull mistral` (or `ollama pull neural-chat` for faster responses)

### 2. **FFmpeg** (Audio Processing)
- **Windows**: Download from https://ffmpeg.org/download.html
  - Add to PATH or place in project directory
- **macOS**: `brew install ffmpeg`
- **Linux**: `sudo apt-get install ffmpeg`

### 3. **Python & Whisper** (Speech-to-Text)
```bash
pip install openai-whisper
```

### 4. **Piper** (Text-to-Speech)
```bash
pip install piper-tts
```

## Installation

1. **Clone or download this project**
```bash
cd Companion
```

2. **Install Node.js dependencies**
```bash
npm install
```

3. **Create `.env` file** (copy from `.env.example`)
```bash
cp .env.example .env
```

4. **Configure `.env`** (optional - defaults work fine)
```env
# Discord Bot Configuration (optional)
DISCORD_TOKEN=your_discord_bot_token_here

# Ollama Configuration
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=mistral

# Voice Configuration
WHISPER_MODEL=base
PIPER_VOICE=en_US-amy-medium

# Audio Configuration
SAMPLE_RATE=16000
```

## Quick Start

### 1. Start Ollama
```bash
ollama serve
```
Keep this running in a separate terminal.

### 2. Start the Companion
```bash
node index.js
```

### 3. Choose your mode:
- **voice** - Speak to the AI (10 seconds recording)
- **chat** - Type messages to the AI
- **discord** - Start Discord bot (requires token)
- **clear** - Clear conversation history
- **exit** - Exit the application

## Usage Examples

### Voice Mode
```
> voice
🎤 Voice Mode - Speak now (10 seconds)...
[Recording...]
User said: What's the weather like?
AI response: I don't have access to real-time weather data...
[AI speaks response aloud]
```

### Chat Mode
```
> chat
💬 Chat Mode - Type your messages (type "back" to return)
You: Hello, how are you?
AI: Thinking...
AI: I'm doing well, thank you for asking! How can I help you today?

You: back
```

### Discord Integration

1. **Create a Discord Bot**
   - Go to https://discord.com/developers/applications
   - Create a new application
   - Go to "Bot" section and create a bot
   - Copy the token and add to `.env` as `DISCORD_TOKEN`
   - Enable these intents: Message Content, Guild Messages, Direct Messages

2. **Invite Bot to Server**
   - Go to OAuth2 > URL Generator
   - Select scopes: `bot`
   - Select permissions: `Send Messages`, `Read Messages`, `Connect`, `Speak`
   - Use the generated URL to invite

3. **Start Discord Bot**
   ```
   > discord
   🤖 Starting Discord bot...
   ✓ Discord bot is running. Press Ctrl+C to stop.
   ```

4. **Use in Discord**
   - Mention the bot: `@Companion What time is it?`
   - Or send a DM to the bot
   - The bot will respond with memory of previous conversations

## Configuration

### Whisper Models
- `tiny` - Fastest, least accurate
- `base` - Good balance (default)
- `small` - Better accuracy
- `medium` - High accuracy
- `large` - Highest accuracy, slowest

### Piper Voices
Available voices: `en_US-amy-medium`, `en_US-john-medium`, `en_US-libritts-high`, etc.

### Ollama Models
- `mistral` - Fast, good quality (default)
- `neural-chat` - Optimized for chat
- `llama2` - Larger, more capable
- `dolphin-mixtral` - Very capable

Download models with: `ollama pull <model-name>`

## Conversation Memory

Conversations are stored in `./data/conversations.json`:
```json
{
  "voice_user": [
    {"role": "user", "content": "Hello", "timestamp": "..."},
    {"role": "assistant", "content": "Hi there!", "timestamp": "..."}
  ]
}
```

User profiles are stored in `./data/users.json`.

## Troubleshooting

### "Ollama is not running"
- Make sure Ollama is started: `ollama serve`
- Check it's accessible at http://localhost:11434

### "FFmpeg error" or "Whisper error"
- Ensure FFmpeg is installed and in PATH
- Test: `ffmpeg -version` and `whisper --version`

### "Piper error"
- Ensure Piper is installed: `pip install piper-tts`
- Test: `piper --help`

### Audio not recording
- Check microphone is connected and working
- Try adjusting `AUDIO_DEVICE_INDEX` in `.env`
- List devices: `ffmpeg -list_devices true -f dshow -i dummy`

### Discord bot not responding
- Ensure bot has Message Content intent enabled
- Check bot has permission to send messages in channel
- Verify `DISCORD_TOKEN` is correct in `.env`

## Performance Tips

1. **Use smaller Whisper model** for faster transcription
   - `WHISPER_MODEL=tiny` for speed
   - `WHISPER_MODEL=base` for balance

2. **Use faster Ollama model**
   - `OLLAMA_MODEL=neural-chat` is optimized for chat
   - `OLLAMA_MODEL=mistral` is a good balance

3. **Reduce context length** in code if responses are slow
   - Edit `memoryManager.getContextForAI(userId, 10)` - reduce 10 to 5

4. **GPU Acceleration**
   - Ollama supports GPU - check https://ollama.ai for setup

## Project Structure

```
Companion/
├── index.js                 # Main entry point
├── package.json            # Node dependencies
├── .env.example            # Configuration template
├── README.md               # This file
├── src/
│   ├── memory.js          # Conversation memory management
│   ├── ollama.js          # Ollama AI client
│   ├── voiceIO.js         # Voice recording/playback
│   └── discordBot.js      # Discord bot integration
├── data/                   # Conversation history (auto-created)
└── audio/                  # Temporary audio files (auto-created)
```

## Advanced Usage

### Custom System Prompt
Edit `src/ollama.js` to add a system prompt:
```javascript
const messages = [
  { role: 'system', content: 'You are a helpful assistant...' },
  ...context,
  { role: 'user', content: prompt }
];
```

### Extend Discord Commands
Edit `src/discordBot.js` to add slash commands or reactions.

### Multiple Users
The system supports multiple users - each gets their own conversation history based on their ID.

## Limitations

- Voice mode records for a fixed duration (10 seconds by default)
- Whisper requires Python to be installed
- Piper requires Python to be installed
- Discord bot requires valid token
- No real-time internet access for the AI

## Future Enhancements

- [ ] Voice activity detection (stop recording when silence detected)
- [ ] Streaming responses (start speaking before full response generated)
- [ ] Web UI for easier interaction
- [ ] Multi-language support
- [ ] Custom wake words
- [ ] Integration with other platforms (Telegram, Slack)

## License

MIT

## Support

For issues or questions:
1. Check the Troubleshooting section
2. Verify all prerequisites are installed
3. Check console output for error messages
4. Ensure Ollama is running and accessible

## Privacy

All data stays on your machine:
- Conversations stored locally in `./data/`
- No cloud services used
- No telemetry or tracking
- Complete control over your data
