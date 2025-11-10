import { CalculatorTool } from '@/lib/tools/calculator.tool';
import { CurrentTimeTool } from '@/lib/tools/current-time.tool';
import { CountLettersTool } from '@/lib/tools/letter-count.tool';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const tools = [
      new CalculatorTool(),
      new CurrentTimeTool(),
      new CountLettersTool(),
    ]

    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview',
        voice: 'echo',
        instructions: 'You are a helpful assistant.',
        tools: tools.map(tool => ({
          description: tool.description,
          name: tool.name,
          parameters: tool.jsonSchema,
          type: 'function',
        })),
      }),
    });


    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating real-time session:', error);
    return NextResponse.json(
      { error: 'Failed to create real-time session' },
      { status: 500 }
    );
  }
} 
