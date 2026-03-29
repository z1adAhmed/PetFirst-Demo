import React, { useCallback, useState } from 'react';
import { TemplateFormField } from './TemplateFormField';
import Input from '../ui/Input';

const FOOTER_MAX = 60;

interface FooterInputProps {
  value: string;
  onChange: (v: string) => void;
}

export const FooterInput: React.FC<FooterInputProps> = ({ value, onChange }) => {
  const [footerError, setFooterError] = useState<string | null>(null);

  const sanitizeNoVariables = useCallback((input: string) => {
    const hasVariableSyntax = input.includes('{{') || input.includes('}}');
    if (!hasVariableSyntax) return { value: input, hadVariables: false };
    const cleaned = input
      .replace(/\{\{[^}]*\}\}/g, '')
      .replace(/\{\{/g, '')
      .replace(/\}\}/g, '');
    return { value: cleaned, hadVariables: true };
  }, []);

  return (
    <TemplateFormField
      label="Footer"
      optional
      hint="You can use this space to add a tagline, a way to unsubscribe, etc."
      charCount={{ current: value.length, max: FOOTER_MAX }}
      error={footerError ?? undefined}
    >
      <Input
        type="text"
        value={value}
        onChange={(e) => {
          const nextRaw = e.target.value.slice(0, FOOTER_MAX);
          const sanitized = sanitizeNoVariables(nextRaw);
          if (sanitized.hadVariables) {
            setFooterError(
              'Variables ({{...}}) are only supported in the message body. Please remove them from the footer.',
            );
          } else if (footerError) {
            setFooterError(null);
          }
          onChange(sanitized.value.slice(0, FOOTER_MAX));
        }}
        placeholder="You can use this space to add a tagline, a way to unsubscribe, etc."
        maxLength={FOOTER_MAX}
      />
    </TemplateFormField>
  );
};
