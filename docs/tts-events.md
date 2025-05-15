# TTS Event Files

This document describes the event files used for testing the TTS Lambda function.

## tts-event.json

This event file is used for testing the TTS function with plain text input:

```json
{
  "httpMethod": "POST",
  "path": "/tts",
  "headers": {
    "Content-Type": "application/json",
    "Origin": "http://localhost:3000"
  },
  "queryStringParameters": null,
  "body": "{\"text\":\"Hello, this is a test of the text-to-speech functionality.\",\"voice\":\"en-US-Standard-A\"}",
  "isBase64Encoded": false
}
```

## tts-ssml-event.json

This event file is used for testing the TTS function with SSML input:

```json
{
  "body": "{\"ssml\":\"<speak>Hello, this is a test of the <sub alias=\\\"text to speech\\\">TTS</sub> functionality with <emphasis>SSML</emphasis> support.</speak>\",\"voice\":\"en-US-Standard-A\"}"
}
```

## Voice Options

You can modify the `voice` parameter in the event files to test different voices:

- **Standard voices**: Basic voices with good quality
  - Examples: `en-US-Standard-A`, `en-US-Standard-B`, etc.

- **WaveNet voices**: Higher quality, more natural-sounding voices
  - Examples: `en-US-Wavenet-A`, `en-US-Wavenet-F`, etc.

- **Neural2 voices**: Premium voices with the most natural-sounding speech
  - Examples: `en-US-Neural2-A`, `en-US-Neural2-F`, etc.

- **Studio voices**: Professional studio-quality voices
  - Examples: `en-US-Studio-O`, `en-US-Studio-Q`, etc.

For a complete list of available voices, see [TTS Voice Options](tts-voices.md).

## Testing with Different Voices

To test with a different voice, modify the event file:

```json
{
  "body": "{\"ssml\":\"<speak>Hello, this is a test of the <sub alias=\\\"text to speech\\\">TTS</sub> functionality with <emphasis>SSML</emphasis> support.</speak>\",\"voice\":\"en-US-Neural2-F\"}"
}
```

Then run the test:

```bash
npm run sam:tts-ssml
```

Or use the test script:

```bash
npm run test:tts-ssml
```
