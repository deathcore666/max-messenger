import { useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import type { TFunction } from '../i18n';

const MAX_LENGTH = 4000;
const COUNTER_FROM = 3800;

interface Props {
  onSend: (text: string) => void;
  t: TFunction;
  disabled?: boolean;
}

export default function Composer({ onSend, t, disabled }: Props) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const grow = () => {
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = 'auto';
    node.style.height = `${Math.min(node.scrollHeight, 140)}px`;
  };

  const send = () => {
    const value = text.trim();
    if (!value || disabled) return;
    onSend(value.slice(0, MAX_LENGTH));
    setText('');
    window.requestAnimationFrame(() => {
      const node = textareaRef.current;
      if (node) node.style.height = 'auto';
      node?.focus();
    });
  };

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value.slice(0, MAX_LENGTH));
    grow();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send();
    }
  };

  const remaining = MAX_LENGTH - text.length;

  return (
    <footer className="composer">
      <textarea
        ref={textareaRef}
        rows={1}
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={t('composer.placeholder')}
        aria-label={t('composer.placeholder')}
      />
      {remaining <= COUNTER_FROM && <span className="composer-counter">{remaining}</span>}
      <button
        type="button"
        className="btn-primary btn-send"
        onClick={send}
        disabled={disabled || text.trim().length === 0}
        title={t('composer.sendTitle')}
      >
        {t('composer.send')}
      </button>
    </footer>
  );
}
