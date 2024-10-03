import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data'; // Using form-data for multipart
import fetch from 'node-fetch'; // Ensure node-fetch is installed

export const config = {
  api: {
    bodyParser: false, // Disable the default body parser
  },
};

export default async function handler(req, res) {
  const form = new IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Formidable error:', err);
      return res.status(500).json({ error: 'Error parsing the form data' });
    }

    const fileArray = files.file;
    const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded or multiple files uploaded' });
    }

    // Ensure productId is a string and not an array
    const productId = Array.isArray(fields.productId) ? fields.productId[0] : fields.productId;

    try {
      // Prepare the file for upload
      const uploadDir = path.join(process.cwd(), 'public/images');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const newPath = path.join(uploadDir, file.originalFilename);
      fs.renameSync(file.filepath, newPath); // Move the file to the desired location

      // Create FormData to send the file via GraphQL
      const formData = new FormData();
      formData.append('operations', JSON.stringify({
        query: `
          mutation CreateImage($file: Upload!, $productId: ID!) {
            createImage(data: {
              file: { upload: $file },
              product: { connect: { id: $productId } }
            }) {
              id
              file {
                id
                url
              }
            }
          }
        `,
        variables: {
          file: null, // Will be replaced by file
          productId, // Pass as a single string
        }
      }));
      formData.append('map', JSON.stringify({ "0": ["variables.file"] }));
      formData.append('0', fs.createReadStream(newPath));

      // Make the GraphQL request with FormData and CSRF-compliant headers
      const response = await fetch(process.env.NEXT_PUBLIC_API_URL, {
        method: 'POST',
        headers: {
          // 'x-apollo-operation-name' is essential to prevent CSRF
          'x-apollo-operation-name': 'CreateImage', 
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`, // Add your token here if applicable
        },
        body: formData,
      });

      const json = await response.json();

      if (json.errors) {
        console.error('GraphQL Errors:', json.errors);
        return res.status(500).json({ error: json.errors });
      }

      res.status(200).json({ message: 'File uploaded successfully', data: json.data.createImage });
    } catch (error) {
      console.error('Error uploading file via GraphQL:', error);
      return res.status(500).json({ error: 'Error uploading file' });
    }
  });
}
