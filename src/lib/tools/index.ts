import {CalculatorTool} from './calculator.tool';
import {CurrentTimeTool} from './current-time.tool';
import {CountLettersTool} from './letter-count.tool';
export function getTools() {
  return [
    new CalculatorTool(),
    new CurrentTimeTool(),
    new CountLettersTool(),
  ]
}
