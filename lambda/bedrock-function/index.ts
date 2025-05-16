import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// Initialize the Bedrock client
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

// Define the model ID to use - default to Claude 3.5 Haiku
// anthropic.claude-3-sonnet-20240229-v1:0
const MODEL_ID = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-haiku-20240307-v1:0';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Event received:', JSON.stringify(event));
  
  try {
    // Parse request body
    const body = event.body ? JSON.parse(event.body) : {};
    const { prompt } = body;
    
    if (!prompt) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(),
        body: JSON.stringify({ error: 'Prompt is required' }),
      };
    }
    
    // Extract system prompts and messages if provided
    const systemPrompt = body.systemPrompt || "You are a helpful AI assistant specialized in coding tutorials.";
    const messages = body.messages || [];
    
    // Format the request body based on the model type
    let requestPayload;
    
    // Format for Anthropic Claude models
    if (MODEL_ID.includes('anthropic.claude')) {
      // For Claude in Bedrock, system prompt needs to be handled differently
      // Either use the system parameter or prepend to the first user message
      requestPayload = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 4096,
        temperature: 0.7,
        system: systemPrompt,  // Use the system parameter instead of a system message
        messages: [
          ...mapMessages(messages),
          { role: "user", content: prompt }
        ]
      };
    }
    // Format for Amazon Titan models
    else if (MODEL_ID.includes('amazon.titan')) {
      requestPayload = {
        inputText: `${systemPrompt}\n\n${prompt}`,
        textGenerationConfig: {
          maxTokenCount: 4096,
          temperature: 0.7,
          topP: 0.9,
        }
      };
    }
    // Format for Meta Llama models
    else if (MODEL_ID.includes('meta.llama')) {
      requestPayload = {
        prompt: `<system>${systemPrompt}</system>\n\n<user>${prompt}</user>\n\n<assistant>`,
        max_gen_len: 4096,
        temperature: 0.7,
        top_p: 0.9,
      };
    }
    // Default format for other models
    else {
      requestPayload = {
        prompt: `${systemPrompt}\n\n${prompt}`,
        max_tokens: 4096,
        temperature: 0.7,
      };
    }

    console.log('Request payload:', JSON.stringify(requestPayload));
    
    // Invoke the model
    const command = new InvokeModelCommand({
      modelId: MODEL_ID,
      body: JSON.stringify(requestPayload),
      contentType: "application/json",
    });
    
    const response = await bedrockClient.send(command);
    
    // Parse model response based on model type
    let decodedResponse;
    const responseText = new TextDecoder().decode(response.body);
    const parsedResponse = JSON.parse(responseText);
    
    if (MODEL_ID.includes('anthropic.claude')) {
      decodedResponse = parsedResponse.content?.[0]?.text || '';
    } else if (MODEL_ID.includes('amazon.titan')) {
      decodedResponse = parsedResponse.results?.[0]?.outputText || '';
    } else if (MODEL_ID.includes('meta.llama')) {
      decodedResponse = parsedResponse.generation || '';
    } else {
      decodedResponse = parsedResponse.completion || parsedResponse.answer || responseText;
    }
    
    console.log('Response received:', decodedResponse.substring(0, 100) + '...');

    return {
      statusCode: 200,
      headers: getCorsHeaders(),
      body: JSON.stringify({ response: decodedResponse }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: getCorsHeaders(),
      body: JSON.stringify({ 
        error: 'Failed to process the request',
        details: error instanceof Error ? error.message : 'Unknown error',
        modelId: MODEL_ID  // Add model ID to help debug access issues
      }),
    };
  }
};

// Helper function to map message formats
function mapMessages(messages: any[]) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [];
  }
  
  return messages.map(msg => ({
    role: msg.role === 'assistant' ? 'assistant' : 'user',
    content: msg.content
  }));
}

// Helper to set CORS headers
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Credentials': 'true',
  };
}
