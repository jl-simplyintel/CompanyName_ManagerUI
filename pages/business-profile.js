import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function BusinessProfile() {
  const { data: session } = useSession();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({});
  const [touchedFields, setTouchedFields] = useState({});

  const fetchBusinessData = async () => {
    if (!session?.user?.id) return;

    const query = `
      query User($where: UserWhereUniqueInput!) {
        user(where: $where) {
          businesses {
            id
            name
            description
            industry
            contactEmail
            contactPhone
            website
            location
            address
            yearFounded
            typeOfEntity
            businessHours
            revenue
            employeeCount
            keywords
            companyLinkedIn
            companyFacebook
            companyTwitter
            technologiesUsed
            sicCodes
          }
        }
      }
    `;

    const variables = {
      where: { id: session?.user?.id },
    };

    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, variables }),
      });

      const json = await res.json();
      if (json.errors) {
        setError('Error fetching business data');
        console.error(json.errors);
      } else {
        const businessData = json.data.user.businesses[0];
        setBusiness(businessData);
        setFormData(businessData); // Populate form data with the fetched business info
      }
    } catch (err) {
      setError('Error fetching business data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessData();
  }, [session?.user?.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    setTouchedFields((prev) => ({
      ...prev,
      [name]: true,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const updatedData = {};
    Object.keys(touchedFields).forEach((key) => {
      updatedData[key] = formData[key];
    });

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
      data: updatedData,
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
        setError('Error updating business');
        console.error(json.errors);
      } else {
        alert('Business updated successfully!');
      }
    } catch (err) {
      setError('Error updating business');
      console.error(err);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="flex">
      <form onSubmit={handleSubmit} className="p-6 max-w-7xl mx-auto w-full bg-white shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold mb-6 text-indigo-600">Business Profile</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Basic Information */}
          <fieldset className="border border-black p-6 rounded-md shadow-sm">
            <legend className="text-xl font-semibold text-indigo-600 mb-4">Basic Information</legend>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-500 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-md rounded-md px-2"
                placeholder="Enter the business name"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700">Industry</label>
              <input
                type="text"
                name="industry"
                value={formData.industry || ''}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-500 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-md rounded-md px-2"
                placeholder="Enter the industry"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700">Year Founded</label>
              <input
                type="number"
                name="yearFounded"
                value={formData.yearFounded || ''}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-500 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-md rounded-md px-2"
                placeholder="Enter the year"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700">Type of Entity</label>
              <input
                type="text"
                name="typeOfEntity"
                value={formData.typeOfEntity || ''}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-500 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-md rounded-md px-2"
                placeholder="Enter the entity type"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-500 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-md rounded-md px-2"
                rows="3"
                placeholder="Enter a description"
              />
            </div>
          </fieldset>

          {/* Contact Information */}
          <fieldset className="border border-black p-6 rounded-md shadow-sm">
            <legend className="text-xl font-semibold text-indigo-600 mb-4">Contact Information</legend>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700">Contact Email</label>
              <div className="relative mt-2">
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-500 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-md rounded-md px-2"
                  placeholder="Enter email"
                />
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
              <input
                type="text"
                name="contactPhone"
                value={formData.contactPhone || ''}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-500 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-md rounded-md px-2"
                placeholder="Enter phone number"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700">Website</label>
              <input
                type="url"
                name="website"
                value={formData.website || ''}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-500 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-md rounded-md px-2"
                placeholder="Enter website URL"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location || ''}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-500 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-md rounded-md px-2"
                placeholder="Enter location"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <textarea
                name="address"
                value={formData.address || ''}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-500 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-md rounded-md px-2"
                rows="3"
                placeholder="Enter address"
              />
            </div>
          </fieldset>

          {/* Business Information */}
          <fieldset className="border border-black p-6 rounded-md shadow-sm">
            <legend className="text-xl font-semibold text-indigo-600 mb-4">Business Information</legend>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700">Business Hours</label>
              <input
                type="text"
                name="businessHours"
                value={formData.businessHours || ''}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-500 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-md rounded-md px-2"
                placeholder="Enter business hours"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700">Revenue</label>
              <input
                type="text"
                name="revenue"
                value={formData.revenue || ''}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-500 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-md rounded-md px-2"
                placeholder="Enter revenue"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700">Employee Count</label>
              <input
                type="number"
                name="employeeCount"
                value={formData.employeeCount || ''}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-500 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-md rounded-md px-2"
                placeholder="Enter number of employees"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700">Keywords</label>
              <textarea
                name="keywords"
                value={formData.keywords || ''}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-500 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-md rounded-md px-2"
                rows="2"
                placeholder="Enter keywords"
              />
            </div>
          </fieldset>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="mt-8 w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white py-3 rounded-md hover:shadow-lg transition-transform duration-200 ease-in-out transform hover:-translate-y-1"
        >
          Update Business
        </button>
      </form>
    </div>
  );
}
