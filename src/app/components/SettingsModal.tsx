'use client';

import { useEffect, useState } from 'react';
import { getSettings, saveSettings } from '@/lib/send-message';
import { SettingsPayload } from '@/lib/system-prompts';

export default function SettingsModal({
  email,
  onClose,
}: {
  email: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promptId, setPromptId] = useState('rude');
  const [customPrompt, setCustomPrompt] = useState('');
  const [presets, setPresets] = useState<SettingsPayload['presets']>([]);

  useEffect(() => {
    let cancelled = false;
    getSettings(email)
      .then((settings) => {
        if (cancelled) {
          return;
        }
        setPromptId(settings.systemPromptId);
        setCustomPrompt(settings.customSystemPrompt);
        setPresets(settings.presets);
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to load settings');
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [email]);

  const selectedPreset = presets.find((preset) => preset.id === promptId);
  const promptValue =
    promptId === 'custom' ? customPrompt : (selectedPreset?.template ?? '');

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await saveSettings(email, {
        systemPromptId: promptId,
        customSystemPrompt: customPrompt,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-lg shadow-lg p-4 space-y-4"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="settings-title" className="text-lg font-semibold text-gray-800">
          Settings
        </h2>
        {loading ? (
          <p className="text-sm text-gray-600">Loading…</p>
        ) : (
          <>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-gray-700">
                System prompt
              </legend>
              {presets.map((preset) => (
                <label
                  key={preset.id}
                  className="flex items-center gap-2 text-sm text-gray-800"
                >
                  <input
                    type="radio"
                    name="system-prompt"
                    value={preset.id}
                    checked={promptId === preset.id}
                    onChange={() => setPromptId(preset.id)}
                  />
                  {preset.label}
                </label>
              ))}
              <label className="flex items-center gap-2 text-sm text-gray-800">
                <input
                  type="radio"
                  name="system-prompt"
                  value="custom"
                  checked={promptId === 'custom'}
                  onChange={() => setPromptId('custom')}
                />
                Custom
              </label>
            </fieldset>
            <label
              className="block text-sm text-gray-600"
              htmlFor="system-prompt-text"
            >
              Prompt
            </label>
            <textarea
              id="system-prompt-text"
              className="w-full h-40 border border-gray-300 rounded p-2 text-sm text-black"
              value={promptValue}
              readOnly={promptId !== 'custom'}
              onChange={(event) => setCustomPrompt(event.target.value)}
            />
          </>
        )}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 text-sm text-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || saving}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
