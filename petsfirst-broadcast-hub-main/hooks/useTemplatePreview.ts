import { useMemo } from 'react';
import { useAppSelector } from '../store/hooks';

const VAR_REGEX = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

/**
 * Extracts variable names from body text for preview styling.
 */
export function getBodyVariableNames(body: string): string[] {
  const names: string[] = [];
  let m: RegExpExecArray | null;
  VAR_REGEX.lastIndex = 0;
  while ((m = VAR_REGEX.exec(body)) !== null) {
    if (!names.includes(m[1])) names.push(m[1]);
  }
  return names;
}

/**
 * Splits body into segments: plain text and {{variable}} for styling (e.g. highlight).
 */
export function getBodySegments(body: string): Array<{ type: 'text' | 'variable'; value: string }> {
  const segments: Array<{ type: 'text' | 'variable'; value: string }> = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  VAR_REGEX.lastIndex = 0;
  while ((m = VAR_REGEX.exec(body)) !== null) {
    if (m.index > lastIndex) {
      segments.push({ type: 'text', value: body.slice(lastIndex, m.index) });
    }
    segments.push({ type: 'variable', value: m[1] });
    lastIndex = VAR_REGEX.lastIndex;
  }
  if (lastIndex < body.length) {
    segments.push({ type: 'text', value: body.slice(lastIndex) });
  }
  return segments.length ? segments : [{ type: 'text', value: body }];
}

export function useTemplatePreview() {
  const draft = useAppSelector((state) => state.createTemplate);

  const bodySegments = useMemo(() => getBodySegments(draft.body), [draft.body]);
  const variableNames = useMemo(() => getBodyVariableNames(draft.body), [draft.body]);

  return {
    draft,
    bodySegments,
    variableNames,
  };
}
