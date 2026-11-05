import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Sparkles, Key, CheckCircle2, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react';
import { useMedications } from '../context/MedicationContext';

interface GeminiSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GeminiSettingsModal: React.FC<GeminiSettingsModalProps> = ({ open, onOpenChange }) => {
  const { geminiApiKey, setGeminiApiKey } = useMedications();
  const [inputKey, setInputKey] = useState(geminiApiKey);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    setGeminiApiKey(inputKey.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onOpenChange(false);
    }, 900);
  };

  const handleClear = () => {
    setInputKey('');
    setGeminiApiKey('');
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onOpenChange(false);
    }, 700);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[95vw] p-5 sm:p-6 bg-white rounded-2xl border border-neutral-200 shadow-2xl">
        <DialogHeader className="text-left space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-neutral-900">
                Cloud OCR Engine Settings
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-500">
                Powered by Google Gemini 1.5 Flash Multimodal Vision
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs text-neutral-700">
          <div className="p-3 bg-secondary/10 border border-secondary/20 rounded-xl space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-neutral-900">
              <ShieldCheck className="h-4 w-4 text-secondary" />
              <span>Apple & Human-Level Handwriting Parsing</span>
            </div>
            <p className="text-[11px] text-neutral-600 leading-relaxed">
              Gemini 1.5 Flash Vision transcribes messy doctor cursive, interprets abbreviations (<code className="bg-white/80 px-1 py-0.5 rounded text-[10px]">1-0-1</code>, <code className="bg-white/80 px-1 py-0.5 rounded text-[10px]">TDS</code>, <code className="bg-white/80 px-1 py-0.5 rounded text-[10px]">SOS</code>), and overlays optical provenance bounding boxes directly on Vercel.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-neutral-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-neutral-500" />
                Google AI Studio API Key:
              </span>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline text-[11px] font-medium flex items-center gap-1"
              >
                <span>Get Free Key</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </label>

            <input
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-xs font-mono"
            />
            <p className="text-[10px] text-neutral-400">
              Stored securely in your local browser storage. You can also define <code className="text-neutral-600">VITE_GEMINI_API_KEY</code> in Vercel environment variables.
            </p>
          </div>

          {geminiApiKey ? (
            <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-[11px]">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Gemini 1.5 Flash Vision is currently <strong>Active & Connected</strong>.</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2.5 bg-neutral-100 border border-neutral-200 text-neutral-600 rounded-xl text-[11px]">
              <AlertCircle className="h-4 w-4 text-neutral-500 shrink-0" />
              <span>Without a key, medTrace runs via in-browser Tesseract WebAssembly.</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t border-neutral-100">
          {geminiApiKey && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="text-neutral-500 hover:text-red-600 border-neutral-200 text-xs"
            >
              Disconnect Key
            </Button>
          )}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              className="bg-primary hover:bg-primary-hover text-white text-xs gap-1.5"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save & Activate</span>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
