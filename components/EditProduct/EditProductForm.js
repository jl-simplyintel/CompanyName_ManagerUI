// manager-ui/components/EditProduct/EditProductForm.js
import { useState } from 'react';
import { AiOutlineLoading3Quarters } from 'react-icons/ai'; // Loader icon

export default function EditProductForm({ name, setName, description, setDescription, handleUpdateProduct, loading }) {
  return (
    <form onSubmit={handleUpdateProduct} className="space-y-8 bg-white p-8 shadow-lg rounded-lg">
      {/* Product Name */}
      <div className="mb-6">
        <label className="block text-lg font-medium text-gray-800">Product Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-3 block w-full border-gray-300 shadow-sm focus:ring-indigo-600 focus:border-indigo-600 text-lg p-4 rounded-md"
          placeholder="Enter product name"
          required
        />
      </div>

      {/* Product Description */}
      <div className="mb-6">
        <label className="block text-lg font-medium text-gray-800">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-3 block w-full border-gray-300 shadow-sm focus:ring-indigo-600 focus:border-indigo-600 text-lg p-4 rounded-md"
          rows="5"
          placeholder="Enter product description"
          required
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className={`w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-4 px-6 rounded-md flex items-center justify-center font-semibold transition duration-200 hover:shadow-lg transform hover:-translate-y-1 ${loading ? 'opacity-70' : ''
          }`}
        disabled={loading}
      >
        {loading ? (
          <AiOutlineLoading3Quarters className="animate-spin mr-2" />
        ) : (
          'Update Product'
        )}
      </button>
    </form>
  );
}
