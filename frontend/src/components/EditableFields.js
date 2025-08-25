import React, { memo, useEffect, useRef } from 'react';

const EditableText = memo(({ value, onChange, autoFocus, id }) => {
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <input
      ref={inputRef}
      type="text"
      className="form-control form-control-sm"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      id={id}
    />
  );
});

const EditableNumber = memo(({ value, onChange, step, autoFocus, id }) => {
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <input
      ref={inputRef}
      type="number"
      className="form-control form-control-sm"
      value={value || ''}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      onClick={(e) => e.stopPropagation()}
      step={step}
      id={id}
    />
  );
});

EditableText.displayName = 'EditableText';
EditableNumber.displayName = 'EditableNumber';

export { EditableText, EditableNumber };
