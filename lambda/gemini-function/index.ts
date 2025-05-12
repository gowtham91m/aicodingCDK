import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Initialize the Google Generative AI with an API key
// In a production environment, this should be stored in AWS Secrets Manager or Parameter Store
const API_KEY = process.env.GEMINI_API_KEY || '';
const MODEL_NAME = 'gemini-2.0-flash';

export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  console.log('Event: ', JSON.stringify(event, null, 2));
  console.log('Context: ', JSON.stringify(context, null, 2));
  
  // Define allowed origins
  const allowedOrigins = ['https://interactivelearning.io', 'http://localhost:3000'];
  
  // Get the request origin
  const origin = event.headers.origin || event.headers.Origin;
  
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
    
    // Check if API key is provided
    if (!API_KEY) {
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
          message: 'Gemini API key is not configured',
          error: 'MISSING_API_KEY',
        }),
      };
    }

    // Parse the request body
    const body = event.body ? JSON.parse(event.body) : {};
    const prompt = body.prompt || 'Tell me something interesting about cloud computing.';

    // Initialize the Gemini API
    const genAI = new GoogleGenerativeAI(API_KEY);
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

    // Generate content
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

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
        message: 'Successfully generated content with Gemini API',
        prompt: prompt,
        response: text,
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
        message: 'Error generating content with Gemini API',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        requestId: context.awsRequestId,
      }),
    };
  }
};
