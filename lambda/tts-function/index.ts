import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import * as textToSpeech from '@google-cloud/text-to-speech';
import * as process from 'process';

// Initialize the Google Generative AI with service account credentials
// In a production environment, this should be stored in AWS Secrets Manager or Parameter Store
const GOOGLE_SERVICE_ACCOUNT = process.env.GOOGLE_SERVICE_ACCOUNT || '';
const MODEL_NAME = 'gemini-2.0-flash';
const API_KEY = process.env.GEMINI_API_KEY || '';

export const handler = async (event: any, context: any) => {
  console.log('Event: ', JSON.stringify(event, null, 2));
  console.log('Context: ', JSON.stringify(context, null, 2));

  // Define allowed origins
  const allowedOrigins = ['https://interactivelearning.io', 'http://localhost:3000'];
  
  // Get the request origin
  const origin = event.headers?.origin || event.headers?.Origin;
  
  // Use the actual origin if it's allowed, otherwise use the first allowed origin
  const responseOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  // Handle OPTIONS request (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': responseOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '300', // Cache preflight request for 5 minutes
      },
      body: '',
    };
  }

  try {
    // Check if service account credentials are provided
    if (!GOOGLE_SERVICE_ACCOUNT && !API_KEY) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': responseOrigin,
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token',
        },
        body: JSON.stringify({
          message: 'Neither Google service account credentials nor API key are configured',
          error: 'MISSING_CREDENTIALS',
        }),
      };
    }

    // Parse the request body
    const body = event.body ? JSON.parse(event.body) : {};
    const text = body.text || 'Hello, this is a test of the text-to-speech functionality.';
    const ssml = body.ssml || null; // Optional SSML input
    
    // Voice options include:
    // - Standard voices: en-US-Standard-A, en-US-Standard-B, etc.
    // - WaveNet voices: en-US-Wavenet-A, en-US-Wavenet-B, etc.
    // - Neural2 voices: en-US-Neural2-A, en-US-Neural2-C, etc.
    // - Studio voices: en-US-Studio-O, en-US-Studio-Q, etc.
    // See docs/tts-voices.md for a complete list of available voices
    const voice = body.voice || 'en-US-Wavenet-A'; // Default voice
    
    const useSSML = !!ssml; // Flag to determine if we should use SSML
    
    // Initialize the Gemini API
    let genAI: GoogleGenerativeAI;
    
    if (GOOGLE_SERVICE_ACCOUNT) {
      // Use service account if available
      try {
        const serviceAccountCredentials = JSON.parse(GOOGLE_SERVICE_ACCOUNT);
        // Initialize with API key and use service account for authentication
        genAI = new GoogleGenerativeAI(API_KEY);
        // Note: The current @google/generative-ai package might not directly support
        // service account authentication in the constructor. In a real implementation,
        // you would need to use the appropriate authentication method.
      } catch (error) {
        console.error('Error parsing service account credentials:', error);
        return {
          statusCode: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': responseOrigin,
            'Access-Control-Allow-Credentials': 'true',
          },
          body: JSON.stringify({
            message: 'Error parsing service account credentials',
            error: error instanceof Error ? error.message : String(error),
          }),
        };
      }
    } else {
      // Fall back to API key
      genAI = new GoogleGenerativeAI(API_KEY);
    }

    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    // Create a client for Google Cloud Text-to-Speech API
    let ttsClient: textToSpeech.TextToSpeechClient;
    
    try {
      // Parse the service account credentials
      const serviceAccountCredentials = JSON.parse(GOOGLE_SERVICE_ACCOUNT);
      
      // Create the client with the service account credentials
      ttsClient = new textToSpeech.TextToSpeechClient({
        credentials: serviceAccountCredentials
      });
      
      console.log('Created Text-to-Speech client with service account credentials');
    } catch (error) {
      console.error('Error creating Text-to-Speech client:', error);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': responseOrigin,
          'Access-Control-Allow-Credentials': 'true',
        },
        body: JSON.stringify({
          message: 'Error creating Text-to-Speech client',
          error: error instanceof Error ? error.message : String(error),
        }),
      };
    }
    
    // Prepare the request for Text-to-Speech API
    const request = {
      // Use SSML if provided, otherwise use plain text
      input: useSSML ? { ssml } : { text },
      voice: {
        languageCode: voice.split('-').slice(0, 2).join('-'), // Extract language code from voice name (e.g., 'en-US' from 'en-US-Standard-A')
        name: voice,
      },
      audioConfig: { audioEncoding: 'MP3' as const },
    };
    
    // Log whether we're using SSML or plain text
    console.log(`Using ${useSSML ? 'SSML' : 'plain text'} input for Text-to-Speech`);
    
    console.log('Sending Text-to-Speech request:', JSON.stringify(request, null, 2));
    
    // Call the Text-to-Speech API
    const [response] = await ttsClient.synthesizeSpeech(request);
    
    // Check if we have audio content
    if (!response.audioContent) {
      throw new Error('No audio content returned from Text-to-Speech API');
    }
    
    // Convert the audio content to base64
    const base64Audio = Buffer.from(response.audioContent as Uint8Array).toString('base64');
    
    console.log('Generated audio data, base64 length:', base64Audio.length);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': responseOrigin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token',
      },
      body: JSON.stringify({
        message: 'Successfully generated speech with Gemini API',
        text: useSSML ? null : text,
        ssml: useSSML ? ssml : null,
        usedSSML: useSSML,
        audioData: base64Audio,
        format: 'mp3',
        timestamp: new Date().toISOString(),
        requestId: context.awsRequestId,
      }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': responseOrigin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token',
      },
      body: JSON.stringify({
        message: 'Error generating speech with Gemini API',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        requestId: context.awsRequestId,
      }),
    };
  }
};
