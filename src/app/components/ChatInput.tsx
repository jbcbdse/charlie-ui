"use client";
import {
  AvailableAgent,
  DEFAULT_AGENT,
  MODEL_GROUPS,
} from "@/lib/available-agents";
import React, { useState, useRef, useEffect } from "react";

interface Props {
  onSubmit(event: { text: string; agentId: string }): void;
}

export default function ChatInput({ onSubmit }: Props) {
  const [inputValue, setInputValue] = useState("");
  const [agentId, setAgentId] = useState<string>(DEFAULT_AGENT);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const storedValue = localStorage.getItem("agentId");
    if (
      storedValue &&
      Object.values(AvailableAgent).includes(storedValue as AvailableAgent)
    ) {
      setAgentId(storedValue);
    } else {
      setAgentId(DEFAULT_AGENT);
    }
  }, []);

  useEffect(() => {
    const cur = textareaRef.current;
    if (cur) {
      cur.style.height = "auto";
      cur.style.height = `${Math.min(cur.scrollHeight, 112)}px`;
    }
  }, [inputValue]);

  const handleAgentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAgentId(e.target.value);
    localStorage.setItem("agentId", e.target.value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.shiftKey) {
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (inputValue.trim()) {
      onSubmit({ text: inputValue, agentId });
      setInputValue("");
    }
  };

  return (
    <div className="w-full p-4">
      <form className="flex items-end space-x-4" onSubmit={handleSubmit}>
        <div className="flex flex-col">
          <label htmlFor="agentId" className="text-gray-600 mb-1">
            Model
          </label>
          <select
            id="agentId"
            name="agentId"
            value={agentId}
            onChange={handleAgentChange}
            className="border border-gray-300 rounded p-2 text-black"
          >
            {MODEL_GROUPS.map((group) => (
              <optgroup key={group.provider} label={group.provider}>
                {group.models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.label}
                  </option>
                ))}
              </optgroup>
            ))}
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
          style={{ maxHeight: "7rem" }}
        />
        <button type="submit" className="bg-blue-500 text-white rounded p-2">
          Send message
        </button>
      </form>
    </div>
  );
}
