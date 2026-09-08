import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTypewriterOptions {
  text: string;
  enabled?: boolean;
  speedMs?: number; // interval between chunks
  charsPerTick?: number;
  onComplete?: () => void;
  onTick?: () => void;
}

export function useTypewriter({
  text,
  enabled = true,
  speedMs = 24,
  charsPerTick = 6,
  onComplete,
  onTick
}: UseTypewriterOptions) {
  const safeText = text || '';
  const [displayedLength, setDisplayedLength] = useState<number>(enabled ? 0 : safeText.length);
  const [isTyping, setIsTyping] = useState<boolean>(enabled && safeText.length > 0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (!enabled || !safeText) {
      setDisplayedLength(safeText.length);
      setIsTyping(false);
      return;
    }

    // Start typing from 0
    setDisplayedLength(0);
    setIsTyping(true);

    let currentIdx = 0;
    const totalLen = safeText.length;

    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      // Advance by charsPerTick or dynamically faster if text is very long
      const step = totalLen > 2400
        ? Math.max(charsPerTick, 16)
        : totalLen > 1200
        ? Math.max(charsPerTick, 10)
        : charsPerTick;
      currentIdx = Math.min(currentIdx + step, totalLen);
      setDisplayedLength(currentIdx);

      if (onTickRef.current) {
        onTickRef.current();
      }

      if (currentIdx >= totalLen) {
        clearInterval(timerRef.current);
        setIsTyping(false);
        if (onCompleteRef.current) {
          onCompleteRef.current();
        }
      }
    }, speedMs);

    return () => {
      clearInterval(timerRef.current);
    };
  }, [safeText, enabled, speedMs, charsPerTick]);

  const skip = useCallback(() => {
    clearInterval(timerRef.current);
    setDisplayedLength(safeText.length);
    setIsTyping(false);
    if (onCompleteRef.current) {
      onCompleteRef.current();
    }
  }, [safeText]);

  const displayedText = enabled ? safeText.slice(0, displayedLength) : safeText;

  return {
    displayedText,
    isTyping,
    skip,
    isComplete: !isTyping
  };
}
