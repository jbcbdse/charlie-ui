import { CalculatorTool } from '@/lib/tools/calculator.tool';
import { CurrentTimeTool } from '@/lib/tools/current-time.tool';
import { CountLettersTool } from '@/lib/tools/letter-count.tool';
import { ToolCallApiRequest, ToolCallApiResponse } from '@/types/api';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse<ToolCallApiResponse>> {
  const allTools = [
    new CalculatorTool(),
    new CurrentTimeTool(),
    new CountLettersTool(),
  ]
  try {
    const body = await request.json() as ToolCallApiRequest;
    if(body === undefined) {
      return NextResponse.json({
        name: 'Unknown',
        callId: 'Unknown',
        result: 'Invalid request body',
      }, { status: 400 });
    }
    try {
      const tool = allTools.find(t => t.name === body.name);
      if(!tool) {
        return NextResponse.json({
          name: body.name,
          callId: body.callId,
          result: 'Tool not found',
        });
      }
      const result = await tool.handle(body.arguments, {} as any);
      return NextResponse.json({
        name: body.name,
        callId: body.callId,
        result: result,
      });
    } catch(err) {
      return NextResponse.json({
        name: body.name,
        callId: body.callId,
        result: 'Error calling tool',
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({
      name: 'Unknown',
      callId: 'Unknown',
      result: 'Error calling tool',
    }, { status: 500 });
  }
} 
