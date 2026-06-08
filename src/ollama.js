const axios = require('axios');

class OllamaClient {
  constructor(apiUrl = 'http://localhost:11434', model = 'mistral') {
    this.apiUrl = apiUrl;
    this.model = model;
    this.client = axios.create({
      baseURL: apiUrl,
      timeout: 60000
    });
  }

  // Generate response from Ollama
  async generateResponse(prompt, context = [], systemPrompt = null, weatherData = null) {
    try {
      // Build messages array with system prompt and context
      let defaultSystemPrompt = `You are Companion, a helpful AI assistant.

User Information:
- Location: Melbourne, Australia
- Timezone: UTC+10 (Australian Eastern Time)

When the user asks about weather, provide the current Melbourne weather information.

Be friendly, helpful, and conversational.`;

      // If weather data is provided, include it in the system prompt
      if (weatherData) {
        defaultSystemPrompt += `\n\nCurrent Melbourne Weather Data:\n${weatherData}`;
      }

      // Remove location/timezone info from system prompt to avoid oversharing
      defaultSystemPrompt = defaultSystemPrompt.replace(/User Information:[\s\S]*?Timezone:.*?\n/g, '');

      const messages = [
        {
          role: 'system',
          content: systemPrompt || defaultSystemPrompt
        },
        ...context,
        { role: 'user', content: prompt }
      ];

      const response = await this.client.post('/api/chat', {
        model: this.model,
        messages: messages,
        stream: false,
        temperature: 0.7,
        top_p: 0.9,
        top_k: 40
      });

      return response.data.message.content;
    } catch (error) {
      console.error('Error generating response from Ollama:', error.message);
      throw new Error(`Failed to generate response: ${error.message}`);
    }
  }

  // Check if Ollama is running
  async isHealthy() {
    try {
      const response = await this.client.get('/api/tags');
      return response.status === 200;
    } catch (error) {
      console.error('Ollama health check failed:', error.message);
      return false;
    }
  }

  // Get available models
  async getAvailableModels() {
    try {
      const response = await this.client.get('/api/tags');
      return response.data.models || [];
    } catch (error) {
      console.error('Error fetching available models:', error.message);
      return [];
    }
  }

  // Stream response (for real-time output)
  async generateResponseStream(prompt, context = [], onChunk) {
    try {
      const messages = [
        ...context,
        { role: 'user', content: prompt }
      ];

      const response = await this.client.post('/api/chat', {
        model: this.model,
        messages: messages,
        stream: true,
        temperature: 0.7,
        top_p: 0.9,
        top_k: 40
      }, {
        responseType: 'stream'
      });

      let fullResponse = '';

      return new Promise((resolve, reject) => {
        response.data.on('data', (chunk) => {
          try {
            const lines = chunk.toString().split('\n').filter(line => line.trim());
            lines.forEach(line => {
              const json = JSON.parse(line);
              if (json.message && json.message.content) {
                fullResponse += json.message.content;
                if (onChunk) onChunk(json.message.content);
              }
            });
          } catch (e) {
            // Ignore parsing errors for incomplete chunks
          }
        });

        response.data.on('end', () => {
          resolve(fullResponse);
        });

        response.data.on('error', (error) => {
          reject(error);
        });
      });
    } catch (error) {
      console.error('Error in stream response:', error.message);
      throw new Error(`Failed to stream response: ${error.message}`);
    }
  }
}

module.exports = OllamaClient;
