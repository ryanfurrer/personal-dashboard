"use client";

import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const TAG_SPLIT_PATTERN = /(#[A-Za-z0-9_-]+)/g;
const TAG_ONLY_PATTERN = /^#[A-Za-z0-9_-]+$/;

function highlightTags(value: string): React.ReactNode {
  return value.split(TAG_SPLIT_PATTERN).map((part, index) => {
    if (!part) return null;
    if (TAG_ONLY_PATTERN.test(part)) {
      return (
        <span key={`tag-${index}`} className="font-medium text-red-600 dark:text-red-300">
          {part}
        </span>
      );
    }
    return <span key={`text-${index}`}>{part}</span>;
  });
}

type TagHighlightTextareaProps = React.ComponentProps<"textarea">;

export default function TagHighlightTextarea({
  className,
  value,
  defaultValue,
  onScroll,
  ...props
}: TagHighlightTextareaProps) {
  const overlayRef = React.useRef<HTMLDivElement>(null);
  const textValue =
    typeof value === "string"
      ? value
      : typeof defaultValue === "string"
        ? defaultValue
        : "";

  const handleScroll = (event: React.UIEvent<HTMLTextAreaElement>) => {
    if (overlayRef.current) {
      overlayRef.current.scrollTop = event.currentTarget.scrollTop;
      overlayRef.current.scrollLeft = event.currentTarget.scrollLeft;
    }
    onScroll?.(event);
  };

  return (
    <div className="relative">
      {textValue.length > 0 && (
        <div
          ref={overlayRef}
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap wrap-break-word text-base md:text-sm",
            className,
          )}
        >
          {highlightTags(textValue)}
        </div>
      )}
      <Textarea
        value={value}
        defaultValue={defaultValue}
        className={cn("border-none focus-visible:ring-0 shadow-none p-0 resize-none rounded-none", textValue.length > 0 ? "text-transparent caret-foreground" : "", className)}
        onScroll={handleScroll}
        {...props}
      />
    </div>
  );
}
