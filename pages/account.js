import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Swal from 'sweetalert2'; // For alerts

export default function AccountPage() {
  const { data: session } = useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch the current user details
  const fetchUserDetails = async () => {
    if (!session?.user?.id) return;

    const query = `
      query User($where: UserWhereUniqueInput!) {
        user(where: $where) {
          id
          name
          email
        }
      }
    `;

    const variables = { where: { id: session.user.id } };

    try {
      const response = await fetch(process.env.NEXT_PUBLIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, variables }),
      });

      const json = await response.json();

      if (json.errors) {
        setError('Error fetching user details');
        console.error('GraphQL errors:', json.errors);
      } else {
        const user = json.data.user;
        setName(user.name);
        setEmail(user.email);
      }
    } catch (err) {
      setError('Error fetching user details');
      console.error('Fetch error:', err);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserDetails();
    }
  }, [session?.user?.id]);

  // Handle form submission for updating user details
  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    setLoading(true);

    const mutation = `
      mutation UpdateUser($id: ID!, $data: UserUpdateInput!) {
        updateUser(where: { id: $id }, data: $data) {
          id
          name
          email
        }
      }
    `;

    const variables = {
      id: session?.user?.id,
      data: { name, email },
    };

    try {
      const response = await fetch(process.env.NEXT_PUBLIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: mutation, variables }),
      });

      const json = await response.json();

      if (json.errors) {
        setError('Error updating account details');
        console.error('GraphQL errors:', json.errors);
      } else {
        Swal.fire({
          title: 'Success!',
          text: 'Account details updated successfully!',
          icon: 'success',
          confirmButtonText: 'OK',
        });
      }
    } catch (err) {
      setError('Error updating account details');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle password change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!currentPassword || !newPassword) {
      setError('Please enter both current and new password.');
      setLoading(false);
      return;
    }

    const mutation = `
      mutation UpdateUserPassword($id: ID!, $currentPassword: String!, $newPassword: String!) {
        updateUserPassword(id: $id, currentPassword: $currentPassword, newPassword: $newPassword) {
          id
        }
      }
    `;

    const variables = {
      id: session?.user?.id,
      currentPassword,
      newPassword,
    };

    try {
      const response = await fetch(process.env.NEXT_PUBLIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: mutation, variables }),
      });

      const json = await response.json();

      if (json.errors) {
        setError('Error updating password');
        console.error('GraphQL errors:', json.errors);
      } else {
        Swal.fire({
          title: 'Success!',
          text: 'Password updated successfully!',
          icon: 'success',
          confirmButtonText: 'OK',
        });
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch (err) {
      setError('Error updating password');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!session) return <p>Loading session...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-indigo-600">My Account</h1>

      {/* Account details form */}
      <form onSubmit={handleUpdateAccount} className="space-y-6 bg-white p-6 shadow-lg rounded-lg">
        <div className="mb-4">
          <label className="block text-lg font-medium text-gray-800">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-md rounded-md px-3"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-lg font-medium text-gray-800">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-md rounded-md px-3"
            required
          />
        </div>

        <button
          type="submit"
          className={`bg-indigo-600 text-white py-2 px-4 rounded-md flex items-center justify-center ${loading ? 'opacity-70' : ''}`}
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update Account'}
        </button>
      </form>

      {/* Password change form */}
      <h2 className="text-2xl font-semibold mt-12 mb-6">Change Password</h2>
      <form onSubmit={handleChangePassword} className="space-y-6 bg-white p-6 shadow-lg rounded-lg">
        <div className="mb-4">
          <label className="block text-lg font-medium text-gray-800">Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="mt-1 block w-full border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-md rounded-md px-3"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-lg font-medium text-gray-800">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1 block w-full border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-md rounded-md px-3"
            required
          />
        </div>

        <button
          type="submit"
          className={`bg-indigo-600 text-white py-2 px-4 rounded-md flex items-center justify-center ${loading ? 'opacity-70' : ''}`}
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
}
