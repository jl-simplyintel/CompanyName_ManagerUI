import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { Slate, Editable, withReact } from 'slate-react';
import { createEditor } from 'slate';
import { withHistory } from 'slate-history';

const SlateEditor = ({ initialValue, onChange }) => {
  // Provide a default structure if initialValue is not provided
  const [value, setValue] = useState(initialValue || [{ type: 'paragraph', children: [{ text: '' }] }]);
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);

  useEffect(() => {
    if (initialValue) {
      setValue(initialValue); // Update the value once the initialValue is available
    }
  }, [initialValue]);

  const handleChange = (newValue) => {
    setValue(newValue);
    onChange(newValue); // Pass the content to the parent
  };

  return (
    <Slate editor={editor} value={value} onChange={handleChange}>
      <Editable placeholder="Enter some text..." />
    </Slate>
  );
};

export default SlateEditor;
