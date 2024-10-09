import { useState } from 'react';

export default function BasicInformation({ business }) {
  const [formData, setFormData] = useState(business);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const mutation = `
      mutation UpdateBusiness($where: BusinessWhereUniqueInput!, $data: BusinessUpdateInput!) {
        updateBusiness(where: $where, data: $data) {
          id
          name
        }
      }
    `;

    const variables = {
      where: { id: business.id },
      data: {
        name: formData.name,
        industry: formData.industry,
        yearFounded: formData.yearFounded,
        typeOfEntity: formData.typeOfEntity,
        description: formData.description,
      },
    };

    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: mutation, variables }),
      });

      const json = await res.json();
      if (json.errors) {
        console.error('Error updating basic information:', json.errors);
      } else {
        alert('Basic Information updated successfully!');
      }
    } catch (err) {
      console.error('Error updating basic information:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border border-gray-300 p-6 rounded-lg shadow-sm">
      <legend className="text-xl font-semibold text-indigo-600 mb-4">Basic Information</legend>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          name="name"
          value={formData.name || ''}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-md rounded-md px-2"
          placeholder="Enter the business name"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Industry</label>
        <input
          type="text"
          name="industry"
          value={formData.industry || ''}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-md rounded-md px-2"
          placeholder="Enter the industry"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Year Founded</label>
        <input
          type="number"
          name="yearFounded"
          value={formData.yearFounded || ''}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-md rounded-md px-2"
          placeholder="Enter the year"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Type of Entity</label>
        <input
          type="text"
          name="typeOfEntity"
          value={formData.typeOfEntity || ''}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-md rounded-md px-2"
          placeholder="Enter the entity type"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-md rounded-md px-2"
          rows="3"
          placeholder="Enter a description"
        />
      </div>
      <button
        type="submit"
        className="mt-4 w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white py-3 rounded-md hover:shadow-lg transition-transform duration-200 ease-in-out transform hover:-translate-y-1"
      >
        Update Basic Information
      </button>
    </form>
  );
}
