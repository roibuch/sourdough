"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LinkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import { heContent } from "@/lib/content";

const COPIED_MS = 3000;

interface ShareRecipeLinkButtonProps {
  onShare: () => void | Promise<void>;
}

export function ShareRecipeLinkButton({ onShare }: ShareRecipeLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleClick = useCallback(async () => {
    await onShare();
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), COPIED_MS);
  }, [onShare]);

  return (
    <Button variant="ghost" fullWidth onClick={handleClick}>
      <LinkIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      {copied
        ? heContent.inputs.actions.shareCopied
        : heContent.inputs.actions.share}
    </Button>
  );
}
