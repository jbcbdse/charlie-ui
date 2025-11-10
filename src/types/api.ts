export interface ToolCallApiRequest {
  name: string;
  callId: string;
  arguments: Record<string, any>;
}
export interface ToolCallApiResponse {
  name: string;
  callId: string;
  result: string;
}
