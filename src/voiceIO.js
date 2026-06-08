const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class VoiceIO extends EventEmitter {
  constructor(options = {}) {
    super();
    this.whisperModel = options.whisperModel || 'base';
    this.piperVoice = options.piperVoice || 'en_US-amy-medium';
    this.sampleRate = options.sampleRate || 16000;
    this.audioDir = options.audioDir || './audio';
    
    // Create audio directory if it doesn't exist
    if (!fs.existsSync(this.audioDir)) {
      fs.mkdirSync(this.audioDir, { recursive: true });
    }
  }

  /**
   * Record audio from microphone using ffmpeg
   * @param {number} duration - Duration in seconds
   * @returns {Promise<string>} Path to recorded audio file
   */
  async recordAudio(duration = 10) {
    return new Promise((resolve, reject) => {
      const timestamp = Date.now();
      const audioFile = path.join(this.audioDir, `recording_${timestamp}.wav`);

      // Try to use the RODE NT-USB microphone first, fall back to default
      const ffmpeg = spawn('ffmpeg', [
        '-f', 'dshow',
        '-i', 'audio=Microphone (8- RODE NT-USB)',
        '-t', duration.toString(),
        '-acodec', 'pcm_s16le',
        '-ar', this.sampleRate.toString(),
        '-ac', '1',
        audioFile
      ]);

      let errorOutput = '';

      ffmpeg.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve(audioFile);
        } else {
          reject(new Error(`FFmpeg error: ${errorOutput}`));
        }
      });

      ffmpeg.on('error', (error) => {
        reject(new Error(`Failed to start recording: ${error.message}`));
      });
    });
  }

  /**
   * Transcribe audio using Whisper
   * @param {string} audioPath - Path to audio file
   * @returns {Promise<string>} Transcribed text
   */
  async transcribeAudio(audioPath) {
    return new Promise((resolve, reject) => {
      const whisper = spawn('whisper', [
        audioPath,
        '--model', this.whisperModel,
        '--output_format', 'txt',
        '--output_dir', this.audioDir,
        '--language', 'en'
      ]);

      let output = '';
      let errorOutput = '';

      whisper.stdout.on('data', (data) => {
        output += data.toString();
      });

      whisper.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      whisper.on('close', (code) => {
        if (code === 0) {
          // Whisper outputs to a .txt file
          const txtFile = audioPath.replace('.wav', '.txt');
          try {
            const transcription = fs.readFileSync(txtFile, 'utf8').trim();
            // Clean up the txt file
            fs.unlinkSync(txtFile);
            resolve(transcription);
          } catch (error) {
            reject(new Error(`Failed to read transcription: ${error.message}`));
          }
        } else {
          reject(new Error(`Whisper error: ${errorOutput}`));
        }
      });

      whisper.on('error', (error) => {
        reject(new Error(`Failed to start Whisper: ${error.message}`));
      });
    });
  }

  /**
   * Convert text to speech using Piper
   * @param {string} text - Text to convert to speech
   * @returns {Promise<string>} Path to generated audio file
   */
  async textToSpeech(text) {
    return new Promise((resolve, reject) => {
      const timestamp = Date.now();
      const audioFile = path.join(this.audioDir, `speech_${timestamp}.wav`);

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
   * Play audio file
   * @param {string} audioPath - Path to audio file
   * @returns {Promise<void>}
   */
  async playAudio(audioPath) {
    return new Promise((resolve, reject) => {
      const ffplay = spawn('ffplay', [
        '-nodisp',
        '-autoexit',
        audioPath
      ]);

      ffplay.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFplay error: exit code ${code}`));
        }
      });

      ffplay.on('error', (error) => {
        reject(new Error(`Failed to play audio: ${error.message}`));
      });
    });
  }

  /**
   * Clean up audio files
   * @param {string} audioPath - Path to audio file to delete
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
   * Full voice interaction: record -> transcribe -> get response -> speak
   * @param {Function} getResponseFn - Function that takes text and returns response
   * @param {number} recordDuration - Duration to record in seconds
   * @returns {Promise<{input: string, output: string}>}
   */
  async interactiveVoiceSession(getResponseFn, recordDuration = 10) {
    try {
      console.log('Recording audio...');
      const audioPath = await this.recordAudio(recordDuration);

      console.log('Transcribing audio...');
      const userInput = await this.transcribeAudio(audioPath);
      this.cleanupAudio(audioPath);

      console.log(`User said: ${userInput}`);

      console.log('Generating response...');
      const response = await getResponseFn(userInput);

      console.log(`AI response: ${response}`);

      console.log('Converting to speech...');
      const speechPath = await this.textToSpeech(response);

      console.log('Playing response...');
      await this.playAudio(speechPath);
      this.cleanupAudio(speechPath);

      return { input: userInput, output: response };
    } catch (error) {
      console.error('Voice interaction error:', error.message);
      throw error;
    }
  }
}

module.exports = VoiceIO;
