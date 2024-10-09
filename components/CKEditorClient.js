import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Dynamically import CKEditor and ClassicEditor to ensure they are client-side only.
const CKEditor = dynamic(() => import('@ckeditor/ckeditor5-react').then(mod => mod.CKEditor), {
  ssr: false, // Prevent server-side rendering
});
const ClassicEditor = dynamic(() => import('@ckeditor/ckeditor5-build-classic'), { ssr: false });

export default function CKEditorClient({ data, onChange }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // This ensures that CKEditor is only rendered on the client side
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div>Loading Editor...</div>; // Show this while waiting for CKEditor to load
  }

  return (
    <CKEditor
      editor={ClassicEditor}
      data={data}
      onChange={(event, editor) => {
        const editorData = editor.getData();
        onChange(editorData);
      }}
    />
  );
}
