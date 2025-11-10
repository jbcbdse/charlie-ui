'use client';
import { AvailableAgent } from '@/lib/available-agents';
import React, { useState, useRef, useEffect } from 'react';

interface Props {
  onSubmit(event: { text: string, agentId: string }): void;
}
export default function ChatInput({ onSubmit }: Props) {
  const [inputValue, setInputValue] = useState('');
  const [agentId, setAgentId] = useState('');
  useEffect(() => {
    const storedValue = localStorage.getItem('agentId');
    setAgentId(storedValue || AvailableAgent.gpt4o);
  }, []);
  const textareaRef = useRef(null);

  useEffect(() => {
    const cur = textareaRef.current as any;
    if (cur) {
      cur.style.height = 'auto';
      cur.style.height = `${Math.min(cur.scrollHeight, 112)}px`;
    }
  }, [inputValue]);

  const handleAgentChange = (e: any) => {
    setAgentId(e.target.value);
    localStorage.setItem('agentId', e.target.value);
  }

  const handleInputChange = (e: any) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Shift + Enter for line break
    if (e.key === 'Enter' && e.shiftKey) {
      return; // Let the browser handle the default behavior for Shift + Enter
    }

    // Enter (no modifiers) to submit the form
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent default Enter behavior (new line)
      handleSubmit();
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (inputValue.trim()) {
      onSubmit({ text: inputValue, agentId: agentId });
      setInputValue(''); // Clear the input after submitting
    }
  };

  return (
    <div className="w-full p-4">
      <form className="flex items-end space-x-4" onSubmit={handleSubmit}>
        <div className="flex flex-col">
          <label htmlFor="agentId" className="text-gray-600 mb-1">Agent</label>
          <select
            id="agentId"
            name="agentId"
            value={agentId}
            onChange={handleAgentChange}
            className="border border-gray-300 rounded p-2 text-black"
          >
            {
              Object.values(AvailableAgent).map((agentId) => (
                <option key={agentId} value={agentId}>{agentId}</option>
              ))
            }
          </select>
        </div>
        <textarea
          ref={textareaRef}
          className="flex-1 border border-gray-300 rounded p-2 resize-none overflow-y-auto text-black"
          placeholder="Type a message..."
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          rows={1}
          style={{ maxHeight: '7rem' }} // 7rem is approximately 7 lines of text
        />
        <button type="submit" className="bg-blue-500 text-white rounded p-2">
          Send message
        </button>
      </form>
    </div>
  );
}
