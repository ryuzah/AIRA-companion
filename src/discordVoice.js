const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState
} = require('@discordjs/voice');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class DiscordVoiceHandler {
  constructor(options = {}) {
    this.audioDir = options.audioDir || './audio';
    this.piperVoice = options.piperVoice || 'en_US-amy-medium';
    this.connections = new Map();
    this.players = new Map();
  }

  /**
   * Join a voice channel
   * @param {VoiceChannel} voiceChannel - Discord voice channel
   * @returns {Promise<VoiceConnection>} Voice connection
   */
  async joinVoiceChannel(voiceChannel) {
    try {
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator
      });

      // Wait for connection to be ready
      await entersState(connection, VoiceConnectionStatus.Ready, 30e3);

      // Create audio player
      const player = createAudioPlayer();
      connection.subscribe(player);

      // Store connection and player
      this.connections.set(voiceChannel.guild.id, connection);
      this.players.set(voiceChannel.guild.id, player);

      console.log(`✓ Joined voice channel: ${voiceChannel.name}`);
      return connection;
    } catch (error) {
      console.error('Failed to join voice channel:', error.message);
      throw error;
    }
  }

  /**
   * Leave a voice channel
   * @param {string} guildId - Guild ID
   */
  leaveVoiceChannel(guildId) {
    const connection = this.connections.get(guildId);
    if (connection) {
      connection.destroy();
      this.connections.delete(guildId);
      this.players.delete(guildId);
      console.log('✓ Left voice channel');
    }
  }

  /**
   * Play audio in voice channel
   * @param {string} guildId - Guild ID
   * @param {string} audioPath - Path to audio file
   * @returns {Promise<void>}
   */
  async playAudio(guildId, audioPath) {
    return new Promise((resolve, reject) => {
      const player = this.players.get(guildId);
      if (!player) {
        reject(new Error('Not connected to voice channel'));
        return;
      }

      try {
        const resource = createAudioResource(audioPath);
        player.play(resource);

        // Wait for audio to finish
        player.once(AudioPlayerStatus.Idle, () => {
          resolve();
        });

        player.once('error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Convert text to speech and play in voice channel
   * @param {string} guildId - Guild ID
   * @param {string} text - Text to convert to speech
   * @returns {Promise<void>}
   */
  async speakInVoiceChannel(guildId, text) {
    try {
      // Generate speech
      const audioPath = await this.textToSpeech(text);

      // Play in voice channel
      await this.playAudio(guildId, audioPath);

      // Clean up
      this.cleanupAudio(audioPath);
    } catch (error) {
      console.error('Error speaking in voice channel:', error.message);
      throw error;
    }
  }

  /**
   * Convert text to speech using Piper
   * @param {string} text - Text to convert
   * @returns {Promise<string>} Path to audio file
   */
  async textToSpeech(text) {
    return new Promise((resolve, reject) => {
      const timestamp = Date.now();
      const audioFile = path.join(this.audioDir, `discord_speech_${timestamp}.wav`);

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
   * @param {string} audioPath - Path to audio file
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
   * Check if bot is in a voice channel
   * @param {string} guildId - Guild ID
   * @returns {boolean}
   */
  isInVoiceChannel(guildId) {
    return this.connections.has(guildId);
  }
}

module.exports = DiscordVoiceHandler;
