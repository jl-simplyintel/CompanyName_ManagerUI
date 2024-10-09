import { useState } from 'react';

export default function ContactInformation({ business }) {
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
          contactEmail
        }
      }
    `;

    const variables = {
      where: { id: business.id },
      data: {
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        website: formData.website,
        location: formData.location,
        address: formData.address,
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
        console.error('Error updating contact information:', json.errors);
      } else {
        alert('Contact Information updated successfully!');
      }
    } catch (err) {
      console.error('Error updating contact information:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border border-gray-300 p-6 rounded-lg shadow-sm">
      <legend className="text-xl font-semibold text-indigo-600 mb-4">Contact Information</legend>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Contact Email</label>
        <input
          type="email"
          name="contactEmail"
          value={formData.contactEmail || ''}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-md rounded-md px-2"
          placeholder="Enter email"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
        <input
          type="text"
          name="contactPhone"
          value={formData.contactPhone || ''}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-md rounded-md px-2"
          placeholder="Enter phone number"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Website</label>
        <input
          type="url"
          name="website"
          value={formData.website || ''}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-md rounded-md px-2"
          placeholder="Enter website URL"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Location</label>
        <input
          type="text"
          name="location"
          value={formData.location || ''}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-md rounded-md px-2"
          placeholder="Enter location"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Address</label>
        <textarea
          name="address"
          value={formData.address || ''}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-md rounded-md px-2"
          rows="3"
          placeholder="Enter address"
        />
      </div>
      <button
        type="submit"
        className="mt-4 w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white py-3 rounded-md hover:shadow-lg transition-transform duration-200 ease-in-out transform hover:-translate-y-1"
      >
        Update Contact Information
      </button>
    </form>
  );
}
