import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { FaHome, FaBusinessTime, FaUserAlt, FaSignOutAlt, FaBox, FaStar, FaRegCommentAlt } from 'react-icons/fa';

export default function Sidebar({ user }) {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false); // Sidebar collapse state

  const fetchBusinesses = async () => {
    if (!user?.id) return;

    const query = `
      query User($where: UserWhereUniqueInput!) {
        user(where: $where) {
          id
          businesses {
            name
          }
        }
      }
    `;

    const variables = {
      where: { id: user?.id },
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
        setError('Error fetching businesses');
        console.error('GraphQL errors:', json.errors);
      } else {
        setBusinesses(json.data.user.businesses || []);
      }
    } catch (err) {
      setError('Error fetching businesses');
      console.error('Error fetching businesses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, [user?.id]);

  const handleLogout = () => {
    setIsLoggingOut(true);
    signOut({ callbackUrl: '/auth/signin' });
  };

  // Handle loading and error states
  if (loading) return <p>Loading businesses...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="flex">
      {/* Sidebar */}
      <div
        className={`${isCollapsed ? 'w-20' : 'w-64'
          } h-screen bg-gray-900 text-white transition-all duration-300 ease-in-out flex flex-col justify-between sticky top-0`}
      >
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between">
          <Link href="/dashboard">
            <button className="focus:outline-none text-white text-xl flex items-center space-x-2">
              <FaHome className="text-2xl" />
              {!isCollapsed && (
                <span className="text-xl font-semibold text-blue-400">
                  CompanyName
                </span>
              )}
            </button>
          </Link>

          {/* Toggle Button */}
          <button
            className="text-white focus:outline-none"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d={
                  isCollapsed
                    ? 'M6 18L18 6M6 6l12 12'
                    : 'M4 6h16M4 12h16m-7 6h7'
                }
              />
            </svg>
          </button>
        </div>

        {/* User Info */}
        <div className="p-4">
          <h2 className="text-lg font-semibold">
            {isCollapsed ? '' : `Welcome, ${user?.name || 'Loading...'}`}
          </h2>
          {!isCollapsed && (
            <h3 className="text-md text-gray-400 truncate">
              {businesses.length > 0
                ? businesses.map((b) => b.name).join(', ')
                : 'N/A'}
            </h3>
          )}
        </div>

        {/* Sidebar Navigation Links */}
        <nav className="flex-grow p-4 space-y-6">
          <ul className="space-y-4">
            <li>
              <Link href="/dashboard">
                <div className="flex items-center space-x-4 cursor-pointer hover:bg-gray-700 p-3 rounded-md transition-colors duration-200">
                  <FaHome className="text-xl" />
                  {!isCollapsed && <span className="text-base">Dashboard</span>}
                </div>
              </Link>
            </li>
            <li>
              <Link href="/business-profile">
                <div className="flex items-center space-x-4 cursor-pointer hover:bg-gray-700 p-3 rounded-md transition-colors duration-200">
                  <FaBusinessTime className="text-xl" />
                  {!isCollapsed && (
                    <span className="text-base">Business Profile</span>
                  )}
                </div>
              </Link>
            </li>
            <li>
              <Link href="/products">
                <div className="flex items-center space-x-4 cursor-pointer hover:bg-gray-700 p-3 rounded-md transition-colors duration-200">
                  <FaBox className="text-xl" />
                  {!isCollapsed && (
                    <span className="text-base">Products and Services</span>
                  )}
                </div>
              </Link>
            </li>
            <li>
              <Link href="/reviews">
                <div className="flex items-center space-x-4 cursor-pointer hover:bg-gray-700 p-3 rounded-md transition-colors duration-200">
                  <FaStar className="text-xl" />
                  {!isCollapsed && <span className="text-base">Reviews</span>}
                </div>
              </Link>
            </li>
            <li>
              <Link href="/complaints">
                <div className="flex items-center space-x-4 cursor-pointer hover:bg-gray-700 p-3 rounded-md transition-colors duration-200">
                  <FaRegCommentAlt  className="text-xl" />
                  {!isCollapsed && <span className="text-base">Complaints</span>}
                </div>
              </Link>
            </li>
            <li>
              <Link href="/account">
                <div className="flex items-center space-x-4 cursor-pointer hover:bg-gray-700 p-3 rounded-md transition-colors duration-200">
                  <FaUserAlt className="text-xl" />
                  {!isCollapsed && <span className="text-base">Account</span>}
                </div>
              </Link>
            </li>
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-4">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-md flex items-center justify-center font-semibold transition-colors duration-200 ${isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            <FaSignOutAlt className="mr-2" />
            {!isCollapsed && (isLoggingOut ? 'Logging out...' : 'Logout')}
          </button>
        </div>
      </div>
    </div>

  );
}
