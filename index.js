require('dotenv').config();
const MemoryManager = require('./src/memory');
const OllamaClient = require('./src/ollama');
const VoiceIO = require('./src/voiceIO');
const DiscordCompanion = require('./src/discordBot');
const WeatherService = require('./src/weather');
const readline = require('readline');

// Initialize components
const memoryManager = new MemoryManager('./data');
const ollamaClient = new OllamaClient(
  process.env.OLLAMA_API_URL || 'http://localhost:11434',
  process.env.OLLAMA_MODEL || 'mistral'
);

const voiceIO = new VoiceIO({
  whisperModel: process.env.WHISPER_MODEL || 'base',
  piperVoice: process.env.PIPER_VOICE || 'en_US-amy-medium',
  sampleRate: parseInt(process.env.SAMPLE_RATE || '16000'),
  audioDir: './audio'
});

const weatherService = new WeatherService();

let discordBot = null;

// Initialize Discord bot if token is provided
if (process.env.DISCORD_TOKEN) {
  discordBot = new DiscordCompanion(
    process.env.DISCORD_TOKEN,
    ollamaClient,
    memoryManager,
    {
      piperVoice: process.env.PIPER_VOICE || 'en_US-amy-medium',
      audioDir: './audio'
    }
  );
}

// CLI Interface for text-based interaction
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function startCLI() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   AI Companion - Local Voice Chat      ║');
  console.log('╚════════════════════════════════════════╝\n');

  console.log('Commands:');
  console.log('  voice    - Start voice conversation');
  console.log('  chat     - Start text conversation');
  console.log('  discord  - Start Discord bot');
  console.log('  clear    - Clear conversation history');
  console.log('  exit     - Exit the application\n');

  promptUser();
}

function promptUser() {
  rl.question('> ', async (input) => {
    const command = input.trim().toLowerCase();

    try {
      switch (command) {
        case 'voice':
          await startVoiceMode();
          break;
        case 'chat':
          await startChatMode();
          break;
        case 'discord':
          await startDiscordBot();
          break;
        case 'clear':
          await clearHistory();
          break;
        case 'exit':
          await shutdown();
          return;
        default:
          console.log('Unknown command. Type "voice", "chat", "discord", "clear", or "exit".');
      }
    } catch (error) {
      console.error('Error:', error.message);
    }

    promptUser();
  });
}

async function startVoiceMode() {
  console.log('\n🎤 Voice Mode - Natural Conversation\n');
  console.log('Speak naturally. The AI will listen until you pause.\n');

  try {
    // Check if Ollama is healthy
    const isHealthy = await ollamaClient.isHealthy();
    if (!isHealthy) {
      console.error('❌ Ollama is not running. Please start Ollama first.');
      console.log('   Download from: https://ollama.ai');
      return;
    }

    const userId = 'voice_user';
    
    // Continuous conversation loop
    let continueConversation = true;
    while (continueConversation) {
      try {
        const result = await voiceIO.interactiveVoiceSession(
          async (userInput) => {
            const context = memoryManager.getContextForAI(userId, 10);
            
            // Check if user is asking about weather
            let weatherData = null;
            if (userInput.toLowerCase().includes('weather') || userInput.toLowerCase().includes('forecast')) {
              console.log('📡 Fetching Melbourne weather...');
              weatherData = await weatherService.getMelbourneWeather();
            }
            
            const response = await ollamaClient.generateResponse(userInput, context, null, weatherData);
            memoryManager.addMessage(userId, 'user', userInput);
            memoryManager.addMessage(userId, 'assistant', response);
            return response;
          },
          15  // Max 15 seconds, but stops on silence
        );

        console.log('\n---\n');
      } catch (error) {
        console.error('Error in conversation:', error.message);
        continueConversation = false;
      }
    }
  } catch (error) {
    console.error('❌ Voice mode error:', error.message);
    console.log('\nMake sure you have installed:');
    console.log('  - FFmpeg: https://ffmpeg.org/download.html');
    console.log('  - Whisper: pip install openai-whisper');
    console.log('  - Piper: pip install piper-tts');
  }
}

async function startChatMode() {
  console.log('\n💬 Chat Mode - Type your messages (type "back" to return)\n');

  const userId = 'chat_user';

  // Check if Ollama is healthy
  const isHealthy = await ollamaClient.isHealthy();
  if (!isHealthy) {
    console.error('❌ Ollama is not running. Please start Ollama first.');
    console.log('   Download from: https://ollama.ai');
    return;
  }

  const chatRL = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const askQuestion = () => {
    chatRL.question('You: ', async (input) => {
      if (input.toLowerCase() === 'back') {
        chatRL.close();
        return;
      }

      try {
        const context = memoryManager.getContextForAI(userId, 10);
        memoryManager.addMessage(userId, 'user', input);

        console.log('AI: Thinking...');
        const response = await ollamaClient.generateResponse(input, context);
        memoryManager.addMessage(userId, 'assistant', response);

        console.log(`AI: ${response}\n`);
      } catch (error) {
        console.error('Error:', error.message);
      }

      askQuestion();
    });
  };

  askQuestion();
}

async function startDiscordBot() {
  if (!discordBot) {
    console.error('❌ Discord bot not configured. Set DISCORD_TOKEN in .env file.');
    return;
  }

  try {
    console.log('🤖 Starting Discord bot...');
    await discordBot.login();
    console.log('✓ Discord bot is running. Press Ctrl+C to stop.');
  } catch (error) {
    console.error('❌ Failed to start Discord bot:', error.message);
  }
}

async function clearHistory() {
  const userId = 'voice_user';
  memoryManager.clearConversationHistory(userId);
  memoryManager.clearConversationHistory('chat_user');
  console.log('✓ Conversation history cleared');
}

async function shutdown() {
  console.log('\n👋 Shutting down...');
  if (discordBot) {
    await discordBot.logout();
  }
  rl.close();
  process.exit(0);
}

// Start the application
startCLI();

// Handle Ctrl+C gracefully
process.on('SIGINT', async () => {
  await shutdown();
});
