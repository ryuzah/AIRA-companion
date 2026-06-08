# System Prompt & Memory Guide

Learn how to customize your AI Companion's personality, knowledge, and behavior!

## What is a System Prompt?

A system prompt is instructions you give the AI at the start of every conversation. It tells the AI:
- Who it is
- How to behave
- What information it knows
- How to answer questions

## Where to Add System Prompts

### Option 1: Global System Prompt (Recommended)

Edit `src/ollama.js` and modify the `generateResponse` method:

```javascript
async generateResponse(prompt, context = []) {
  try {
    // Add system prompt at the beginning
    const messages = [
      {
        role: 'system',
        content: `You are a helpful AI assistant named Companion. Your user's name is Mark. 
        
Today's date is June 8, 2026.
Current weather: You don't have real-time weather access, but you can suggest checking weather.com or asking the user for their location.

You are knowledgeable about:
- General knowledge and trivia
- Programming and technology
- Problem solving
- Creative writing
- And much more!

Be friendly, helpful, and conversational.`
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
```

### Option 2: User-Specific System Prompt

Store personalized prompts in `data/users.json`:

```json
{
  "voice_user": {
    "userId": "voice_user",
    "name": "Mark",
    "systemPrompt": "You are talking to Mark. Remember his preferences and interests.",
    "preferences": {
      "favoriteTopics": ["programming", "AI", "gaming"],
      "location": "Sydney, Australia"
    }
  }
}
```

Then use it in `index.js`:

```javascript
async function startVoiceMode() {
  const userId = 'voice_user';
  const userProfile = memoryManager.getUserProfile(userId);
  
  const result = await voiceIO.interactiveVoiceSession(
    async (userInput) => {
      const context = memoryManager.getContextForAI(userId, 10);
      
      // Include user's system prompt
      const systemPrompt = userProfile.systemPrompt || 'You are a helpful AI assistant.';
      const contextWithSystem = [
        { role: 'system', content: systemPrompt },
        ...context
      ];
      
      const response = await ollamaClient.generateResponse(userInput, contextWithSystem);
      memoryManager.addMessage(userId, 'user', userInput);
      memoryManager.addMessage(userId, 'assistant', response);
      return response;
    },
    15
  );
}
```

## Example System Prompts

### Basic Personalized Prompt
```
You are a helpful AI assistant named Companion. 
Your user's name is Mark.
You are friendly, helpful, and conversational.
You remember previous conversations with Mark.
```

### With Knowledge Base
```
You are Companion, an AI assistant for Mark.

About Mark:
- Name: Mark
- Location: Sydney, Australia
- Interests: Programming, AI, Gaming
- Timezone: UTC+10

You know:
- Mark's favorite programming languages: Python, JavaScript, Node.js
- Mark's projects: AI Companion, various web apps
- Mark's preferences: Local solutions, privacy-focused, GPU acceleration

When Mark asks about weather, suggest checking weather.com or ask for his location.
When Mark asks about time, remember he's in Sydney (UTC+10).
```

### With Instructions
```
You are Companion, an AI assistant for Mark.

Instructions:
1. Be concise but helpful
2. Ask clarifying questions if needed
3. Remember previous conversations
4. Suggest improvements when appropriate
5. Be honest about limitations (e.g., no real-time data)

Mark's Information:
- Name: Mark
- Location: Sydney, Australia
- Timezone: UTC+10

When Mark asks about:
- Weather: Suggest checking weather.com or ask for location
- Time: Remember Sydney is UTC+10
- News: Explain you don't have real-time access
- Current events: Ask Mark to tell you what's happening
```

## How to Add Your Information

### Step 1: Edit the System Prompt

Open `src/ollama.js` and find the `generateResponse` method. Add your information:

```javascript
const messages = [
  {
    role: 'system',
    content: `You are Companion, an AI assistant.

User Information:
- Name: [YOUR NAME]
- Location: [YOUR LOCATION]
- Timezone: [YOUR TIMEZONE]
- Interests: [YOUR INTERESTS]

You know:
- [FACT 1]
- [FACT 2]
- [FACT 3]

When asked about weather, suggest checking weather.com.
When asked about current time, remember the user's timezone.`
  },
  ...context,
  { role: 'user', content: prompt }
];
```

### Step 2: Customize for Your Needs

Replace the placeholders:
- `[YOUR NAME]` - Your actual name
- `[YOUR LOCATION]` - Your city/country
- `[YOUR TIMEZONE]` - Your timezone (e.g., UTC+10)
- `[YOUR INTERESTS]` - Things you like to talk about
- `[FACT 1-3]` - Things the AI should know about you

### Step 3: Test It

Start the companion:
```bash
node index.js
> voice
```

Or:
```bash
node index.js
> chat
```

Ask it questions like:
- "What's my name?"
- "Where am I from?"
- "What time is it?"
- "What are my interests?"

## Advanced: Dynamic System Prompts

You can also create a function to generate system prompts dynamically:

```javascript
function generateSystemPrompt(userProfile) {
  return `You are Companion, an AI assistant.

User Information:
- Name: ${userProfile.name}
- Location: ${userProfile.location}
- Timezone: ${userProfile.timezone}
- Interests: ${userProfile.interests.join(', ')}

Today's date: ${new Date().toLocaleDateString()}

When asked about weather, suggest checking weather.com.
When asked about current time, remember the user's timezone.
When asked about current events, explain you don't have real-time access.`;
}
```

## Handling Real-Time Information

For questions the AI can't answer (weather, current time, news):

### Option 1: Tell the AI to Ask
```
When asked about weather, ask the user for their location and suggest they check weather.com.
When asked about current time, ask the user their timezone.
When asked about news, explain you don't have real-time access and ask what they've heard.
```

### Option 2: Integrate Real APIs (Advanced)
You could add:
- Weather API integration
- Current time lookup
- News API integration

But this requires additional setup and API keys.

## Example: Complete System Prompt

```
You are Companion, an AI assistant for Mark.

About Mark:
- Name: Mark
- Location: Sydney, Australia
- Timezone: UTC+10 (Australian Eastern Time)
- Interests: Programming, AI, Gaming, Technology
- Occupation: Software Developer

You know about Mark's projects:
- AI Companion: A local voice-based AI assistant
- Various web applications
- Interest in GPU acceleration and local AI

Mark's Preferences:
- Privacy-focused solutions
- Local hosting (no cloud)
- GPU acceleration when possible
- Open-source tools

When Mark asks about:
- Weather: Suggest checking weather.com or ask for specific location
- Current time: Remember Sydney is UTC+10
- His projects: You can discuss them based on conversation history
- Programming: You can help with Python, JavaScript, Node.js
- AI: You can discuss local AI, Ollama, Whisper, etc.

Be friendly, helpful, and conversational. Remember previous conversations with Mark.
```

## Tips

1. **Keep it concise** - Long prompts can slow down responses
2. **Be specific** - The more specific, the better the AI understands
3. **Update regularly** - Change the prompt as your interests change
4. **Test it** - Ask the AI about the information you added
5. **Use conversation history** - The AI also learns from previous messages

## Summary

You can customize your AI Companion by:
1. Editing the system prompt in `src/ollama.js`
2. Adding your name, location, interests, and timezone
3. Telling the AI how to handle questions it can't answer
4. Testing with voice or chat mode

The AI will remember this information and use it in all conversations! 🧠
