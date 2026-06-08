const { Client, GatewayIntentBits, ChannelType } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class DiscordCompanion {
  constructor(token, ollamaClient, memoryManager, options = {}) {
    this.token = token;
    this.ollamaClient = ollamaClient;
    this.memoryManager = memoryManager;
    this.piperVoice = options.piperVoice || 'en_US-amy-medium';
    this.audioDir = options.audioDir || './audio';
    
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
      ]
    });

    this.voiceConnections = new Map();
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.client.on('ready', () => {
      console.log(`✓ Discord bot logged in as ${this.client.user.tag}`);
    });

    this.client.on('messageCreate', async (message) => {
      if (message.author.bot) return;

      try {
        // Check if bot is mentioned or if it's a DM
        const isMentioned = message.mentions.has(this.client.user);
        const isDM = message.channel.isDMBased();

        if (!isMentioned && !isDM) return;

        // Show typing indicator
        await message.channel.sendTyping();

        // Get user ID for memory
        const userId = message.author.id;

        // Add user message to memory
        this.memoryManager.addMessage(userId, 'user', message.content);

        // Get conversation context
        const context = this.memoryManager.getContextForAI(userId, 10);

        // Generate response
        const response = await this.ollamaClient.generateResponse(
          message.content,
          context
        );

        // Add AI response to memory
        this.memoryManager.addMessage(userId, 'assistant', response);

        // Split response if too long for Discord (2000 char limit)
        const chunks = this.chunkMessage(response, 2000);
        for (const chunk of chunks) {
          await message.reply(chunk);
        }
      } catch (error) {
        console.error('Error handling message:', error);
        await message.reply('Sorry, I encountered an error processing your message.');
      }
    });

    this.client.on('voiceStateUpdate', async (oldState, newState) => {
      // Handle voice channel joins/leaves
      if (newState.member.user.bot) return;

      // If user joined a voice channel and bot is in the same guild
      if (newState.channelId && !oldState.channelId) {
        console.log(`${newState.member.user.username} joined voice channel`);
      }
    });
  }

  /**
   * Join a voice channel
   */
  async joinVoiceChannel(voiceChannel) {
    try {
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator
      });

      this.voiceConnections.set(voiceChannel.guild.id, connection);

      connection.on(VoiceConnectionStatus.Ready, () => {
        console.log(`✓ Connected to voice channel: ${voiceChannel.name}`);
      });

      connection.on(VoiceConnectionStatus.Disconnected, () => {
        console.log(`✗ Disconnected from voice channel: ${voiceChannel.name}`);
        this.voiceConnections.delete(voiceChannel.guild.id);
      });

      return connection;
    } catch (error) {
      console.error('Error joining voice channel:', error);
      throw error;
    }
  }

  /**
   * Leave a voice channel
   */
  leaveVoiceChannel(guildId) {
    const connection = this.voiceConnections.get(guildId);
    if (connection) {
      connection.destroy();
      this.voiceConnections.delete(guildId);
      console.log(`✓ Left voice channel in guild: ${guildId}`);
    }
  }

  /**
   * Play audio in voice channel
   */
  async playAudioInVoice(guildId, audioPath) {
    const connection = this.voiceConnections.get(guildId);
    if (!connection) {
      throw new Error('Not connected to a voice channel');
    }

    try {
      const player = createAudioPlayer();
      const resource = createAudioResource(audioPath);

      player.play(resource);
      connection.subscribe(player);

      return new Promise((resolve, reject) => {
        player.on(AudioPlayerStatus.Idle, () => {
          resolve();
        });

        player.on('error', (error) => {
          reject(error);
        });
      });
    } catch (error) {
      console.error('Error playing audio in voice:', error);
      throw error;
    }
  }

  /**
   * Convert text to speech and play in voice channel
   */
  async speakInVoice(guildId, text) {
    try {
      const audioPath = await this.textToSpeech(text);
      await this.playAudioInVoice(guildId, audioPath);
      this.cleanupAudio(audioPath);
    } catch (error) {
      console.error('Error speaking in voice:', error);
      throw error;
    }
  }

  /**
   * Convert text to speech using Piper
   */
  async textToSpeech(text) {
    return new Promise((resolve, reject) => {
      const timestamp = Date.now();
      const audioFile = path.join(this.audioDir, `discord_speech_${timestamp}.wav`);

      if (!fs.existsSync(this.audioDir)) {
        fs.mkdirSync(this.audioDir, { recursive: true });
      }

      const piper = spawn('piper', [
        '--model', this.piperVoice,
        '--output_file', audioFile
      ]);

      let errorOutput = '';

      piper.stdin.write(text);
      piper.stdin.end();

      piper.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      piper.on('close', (code) => {
        if (code === 0) {
          resolve(audioFile);
        } else {
          reject(new Error(`Piper error: ${errorOutput}`));
        }
      });

      piper.on('error', (error) => {
        reject(new Error(`Failed to start Piper: ${error.message}`));
      });
    });
  }

  /**
   * Clean up audio files
   */
  cleanupAudio(audioPath) {
    try {
      if (fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }
    } catch (error) {
      console.error(`Failed to cleanup audio file: ${error.message}`);
    }
  }

  /**
   * Split message into chunks for Discord's 2000 character limit
   */
  chunkMessage(message, chunkSize = 2000) {
    const chunks = [];
    for (let i = 0; i < message.length; i += chunkSize) {
      chunks.push(message.substring(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Login to Discord
   */
  async login() {
    try {
      await this.client.login(this.token);
    } catch (error) {
      console.error('Failed to login to Discord:', error);
      throw error;
    }
  }

  /**
   * Logout from Discord
   */
  async logout() {
    try {
      await this.client.destroy();
      console.log('✓ Logged out from Discord');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }
}

module.exports = DiscordCompanion;
