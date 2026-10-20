'use client';

import { useEffect, useRef } from 'react';

export function htmlValue(value: string): string | undefined {
  const text = value.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').trim();
  return text ? value : undefined;
}

export function HtmlDescription({
  value,
  onChange,
  label = 'Description',
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  const editor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = editor.current;
    if (!node || document.activeElement === node || node.innerHTML === value) return;
    node.innerHTML = value;
  }, [value]);

  function emit() {
    onChange(editor.current?.innerHTML ?? '');
  }

  function command(name: string, arg?: string) {
    editor.current?.focus();
    document.execCommand(name, false, arg);
    emit();
  }

  function addLink() {
    const href = window.prompt('Link URL');
    if (!href) return;
    command('createLink', href);
  }

  return (
    <div className="html-field">
      <div className="html-tools">
        <button type="button" onClick={() => command('bold')}>Bold</button>
        <button type="button" onClick={() => command('italic')}>Italic</button>
        <button type="button" onClick={() => command('formatBlock', 'h2')}>Heading</button>
        <button type="button" onClick={() => command('insertUnorderedList')}>List</button>
        <button type="button" onClick={addLink}>Link</button>
      </div>
      <div
        ref={editor}
        className="html-editor"
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-label={label}
        onInput={emit}
        suppressContentEditableWarning
      />
      <span className="note">Formatting is saved as HTML.</span>
    </div>
  );
}
