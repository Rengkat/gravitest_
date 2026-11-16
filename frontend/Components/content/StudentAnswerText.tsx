"use client";

import MathText from "./MathText";

interface Props {
  text: string | null | undefined;
  className?: string;
}

/**
 * A student's typed answer, displayed as they meant it: equations typeset, line breaks kept, and the editor's
 * bold / italic / underline shown. Only EXPLICIT maths delimiters are typeset — nothing the student typed is
 * guessed at or rewritten.
 */
export default function StudentAnswerText({ text, className = "" }: Props) {
  return (
    <MathText
      as="div"
      text={text}
      legacyMath={false}
      markup
      className={`block text-[14px] leading-7 ${className}`}
    />
  );
}
