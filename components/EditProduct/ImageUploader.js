// manager-ui/components/EditProduct/ImageUploader.js
import { useDropzone } from 'react-dropzone';
import { FaTrashAlt } from 'react-icons/fa'; // Trash icon for deleting images

export default function ImageUploader({ images, handleDeleteImage, onDrop }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <>
      {/* Existing Images */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Existing Images</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {images.map((image) => (
            <div key={image.id} className="relative group">
              <img
                src={`https://companynameadmin-008a72cce60a.herokuapp.com${image.file.url}`}
                alt="Product Image"
                className="w-full h-40 object-cover rounded-lg shadow-sm transition-transform transform group-hover:scale-105"
              />
              <button
                onClick={() => handleDeleteImage(image.id)}
                className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <FaTrashAlt />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Drag and Drop Image Upload */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed p-8 mt-12 rounded-lg text-center transition-colors ${isDragActive ? 'border-indigo-600 bg-indigo-100' : 'border-gray-300 bg-white'
          }`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-indigo-500 font-semibold">Drop the image here...</p>
        ) : (
          <p className="text-gray-600">Drag and drop an image here, or click to select one</p>
        )}
      </div>
    </>
  );
}
