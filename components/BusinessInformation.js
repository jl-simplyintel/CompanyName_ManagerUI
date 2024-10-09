import { useState } from 'react';

export default function BusinessInformation({ business }) {
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
          businessHours
        }
      }
    `;

    const variables = {
      where: { id: business.id },
      data: {
        businessHours: formData.businessHours,
        revenue: formData.revenue,
        employeeCount: formData.employeeCount,
        keywords: formData.keywords,
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
        console.error('Error updating business information:', json.errors);
      } else {
        alert('Business Information updated successfully!');
      }
    } catch (err) {
      console.error('Error updating business information:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border border-gray-300 p-6 rounded-lg shadow-sm">
      <legend className="text-xl font-semibold text-indigo-600 mb-4">Business Information</legend>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Business Hours</label>
        <input
          type="text"
          name="businessHours"
          value={formData.businessHours || ''}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-md rounded-md px-2"
          placeholder="Enter business hours"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Revenue</label>
        <input
          type="text"
          name="revenue"
          value={formData.revenue || ''}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-md rounded-md px-2"
          placeholder="Enter revenue"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Employee Count</label>
        <input
          type="number"
          name="employeeCount"
          value={formData.employeeCount || ''}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-md rounded-md px-2"
          placeholder="Enter number of employees"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Keywords</label>
        <textarea
          name="keywords"
          value={formData.keywords || ''}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-md rounded-md px-2"
          rows="2"
          placeholder="Enter keywords"
        />
      </div>
      <button
        type="submit"
        className="mt-4 w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white py-3 rounded-md hover:shadow-lg transition-transform duration-200 ease-in-out transform hover:-translate-y-1"
      >
        Update Business Information
      </button>
    </form>
  );
}
