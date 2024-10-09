// pages/_document.js

import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head>
        {/* CKEditor 5 CSS */}
        <link rel="stylesheet" href="https://cdn.ckeditor.com/ckeditor5/43.2.0/ckeditor5.css" />
      </Head>
      <body>
        <Main />
        <NextScript />
        {/* CKEditor 5 JS from CDN */}
        <script src="https://cdn.ckeditor.com/ckeditor5/43.2.0/classic/ckeditor.js"></script>
      </body>
    </Html>
  );
}
