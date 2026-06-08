# Discord Voice Commands Guide

Learn how to make your AI Companion join voice channels and respond!

## Quick Start

### Step 1: Make Sure Bot Has Permissions

In Discord Server Settings:
1. Go to **Server Settings** > **Roles**
2. Find the **Companion** role
3. Give it these permissions:
   - ✅ Connect (to voice channels)
   - ✅ Speak (in voice channels)
   - ✅ Send Messages (in text channels)
   - ✅ Read Messages/View Channels

### Step 2: Start the Discord Bot

```bash
node index.js
> discord
```

You should see:
```
✓ Discord bot logged in as Companion#1234
```

### Step 3: Use Commands

The bot responds to **text commands** in Discord:

#### Join Voice Channel
```
@Companion join
```

The bot will join the voice channel you're currently in.

#### Leave Voice Channel
```
@Companion leave
```

The bot will leave the voice channel.

#### Ask a Question (Text Response)
```
@Companion What's the weather?
```

The bot responds with text in the chat.

#### Ask a Question (Voice Response)
```
@Companion speak: What's the weather?
```

The bot will join your voice channel and speak the response!

## Example Conversation

```
You: @Companion join
Bot: ✓ Joined voice channel: General

You: @Companion What's the weather?
Bot: Today's Melbourne Weather:
     Current: 22°C, Partly cloudy
     High: 25°C, Low: 18°C

You: @Companion speak: Tell me the weather
Bot: [Joins voice channel and speaks the weather forecast]

You: @Companion leave
Bot: ✓ Left voice channel
```

## Commands Reference

| Command | What It Does |
|---------|-------------|
| `@Companion join` | Bot joins your voice channel |
| `@Companion leave` | Bot leaves the voice channel |
| `@Companion [question]` | Bot responds with text |
| `@Companion speak: [question]` | Bot responds with voice |
| `@Companion weather` | Get Melbourne weather |
| `@Companion help` | Show available commands |

## How It Works

1. **Join Command**: Bot joins the voice channel you're in
2. **Text Question**: Bot responds in text chat
3. **Voice Question**: Bot joins voice and speaks the response
4. **Leave Command**: Bot leaves the voice channel

## Troubleshooting

### "Bot can't join voice channel"
- Check bot has "Connect" permission
- Check bot has "Speak" permission
- Make sure you're in a voice channel first

### "Bot doesn't respond"
- Make sure you're mentioning the bot: `@Companion`
- Check bot is online (green status)
- Check bot has "Send Messages" permission

### "Bot joins but doesn't speak"
- Check bot has "Speak" permission
- Make sure Piper is installed: `pip install piper-tts`
- Check audio output is working

## Advanced: Custom Commands

You can add more commands by editing `src/discordBot.js`:

```javascript
if (message.content.includes('join')) {
  const voiceChannel = message.member.voice.channel;
  if (voiceChannel) {
    await this.joinVoiceChannel(voiceChannel);
    await message.reply('✓ Joined your voice channel!');
  }
}

if (message.content.includes('speak:')) {
  const text = message.content.replace('@Companion speak:', '').trim();
  const guildId = message.guild.id;
  await this.speakInVoice(guildId, text);
}
```

## Tips

1. **Always mention the bot**: `@Companion` (not just "Companion")
2. **Be in a voice channel first** before using join command
3. **Use "speak:" prefix** for voice responses
4. **Check permissions** if bot doesn't respond
5. **Restart bot** if it stops responding

## Summary

Your Discord bot can:
- ✅ Join voice channels with `@Companion join`
- ✅ Leave with `@Companion leave`
- ✅ Respond to text questions
- ✅ Speak responses in voice with `@Companion speak: [question]`
- ✅ Remember conversation history
- ✅ Provide Melbourne weather

Just mention the bot and it will respond! 🎤
