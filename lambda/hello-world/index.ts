import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  console.log('Event: ', JSON.stringify(event, null, 2));
  console.log('Context: ', JSON.stringify(context, null, 2));
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'Hello World from Lambda!',
      timestamp: new Date().toISOString(),
      requestId: context.awsRequestId,
    }),
  };
};
