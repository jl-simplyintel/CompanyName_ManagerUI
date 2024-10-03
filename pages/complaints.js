import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link'; // Import Link for routing
import Swal from 'sweetalert2'; // For alerts

export default function ComplaintsPage() {
  const { data: session } = useSession();
  const [complaints, setComplaints] = useState([]);
  const [error, setError] = useState(null);
  const [selectedComplaints, setSelectedComplaints] = useState([]); // Track selected complaints for mass deletion
  const [loading, setLoading] = useState(false);

  // Fetch complaints for the businesses managed by the user
  const fetchComplaints = async () => {
    const query = `
      query User($where: UserWhereUniqueInput!) {
        user(where: $where) {
          businesses {
            complaints {
              id
              user {
                id
                name
              }
              isAnonymous
              status
              createdAt
            }
          }
        }
      }
    `;

    const variables = {
      where: { id: session?.user?.id || '' }, // Ensure user ID is available
    };

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
        setError('Error fetching complaints');
        console.error('GraphQL errors:', json.errors);
      } else {
        const fetchedComplaints = json.data.user.businesses.flatMap((business) => business.complaints || []);
        setComplaints(fetchedComplaints);
      }
    } catch (err) {
      setError('Error fetching complaints');
      console.error('Fetch error:', err);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchComplaints();
    }
  }, [session?.user?.id]);

  // Toggle selection for mass delete
  const toggleSelectComplaint = (complaintId) => {
    setSelectedComplaints((prevSelected) =>
      prevSelected.includes(complaintId)
        ? prevSelected.filter((id) => id !== complaintId)
        : [...prevSelected, complaintId]
    );
  };

  // Handle mass deletion
  const handleMassDelete = async () => {
    if (selectedComplaints.length === 0) return;

    Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete ${selectedComplaints.length} complaints.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete them!',
      cancelButtonText: 'Cancel',
    }).then(async (result) => {
      if (result.isConfirmed) {
        setLoading(true);

        const deleteMutation = `
          mutation DeleteComplaint($where: ComplaintWhereUniqueInput!) {
            deleteComplaint(where: $where) {
              id
            }
          }
        `;

        try {
          // Perform the mass deletion
          for (const complaintId of selectedComplaints) {
            await fetch(process.env.NEXT_PUBLIC_API_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                query: deleteMutation,
                variables: { where: { id: complaintId } },
              }),
            });
          }

          Swal.fire('Deleted!', `${selectedComplaints.length} complaints have been deleted.`, 'success');

          // Re-fetch complaints after deletion
          fetchComplaints();
          setSelectedComplaints([]); // Clear selected complaints
        } catch (error) {
          console.error('Error deleting complaints:', error);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Convert status to human-readable text
  const renderStatus = (status) => {
    return status === '0' ? 'Closed' : 'Pending';
  };

  // Handle loading, error, or complaints display
  if (!session) return <p>Loading session...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Business Complaints</h1>
      <div className="mb-4">
        <button
          className={`bg-red-500 text-white py-2 px-4 rounded-md ${selectedComplaints.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          disabled={selectedComplaints.length === 0}
          onClick={handleMassDelete}
        >
          {loading ? 'Deleting...' : `Delete ${selectedComplaints.length} Selected`}
        </button>
      </div>
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr>
            <th className="py-3 px-4 border-b">
              <input
                type="checkbox"
                onChange={(e) =>
                  e.target.checked
                    ? setSelectedComplaints(complaints.map((complaint) => complaint.id))
                    : setSelectedComplaints([])
                }
              />
            </th>
            <th className="py-3 px-4 border-b text-left">Name</th>
            <th className="py-3 px-4 border-b text-left">Status</th>
            <th className="py-3 px-4 border-b text-left">Anonymous</th> {/* New Anonymous column */}
            <th className="py-3 px-4 border-b text-left">Date Created</th>
          </tr>
        </thead>
        <tbody>
          {complaints.length === 0 ? (
            <tr>
              <td colSpan="6" className="py-4 px-4 text-center text-gray-500">
                No complaints found.
              </td>
            </tr>
          ) : (
            complaints.map((complaint) => (
              <tr key={complaint.id}>
                <td className="py-3 px-4 border-b">
                  <input
                    type="checkbox"
                    checked={selectedComplaints.includes(complaint.id)}
                    onChange={() => toggleSelectComplaint(complaint.id)}
                  />
                </td>
                <td className="py-3 px-4 border-b">
                  <Link href={`/complaint/${complaint.id}`}>
                    {complaint.isAnonymous === 'true' ? 'Anonymous' : complaint.user.name}
                  </Link>
                </td>
                <td className="py-3 px-4 border-b">{renderStatus(complaint.status)}</td>
                <td className="py-3 px-4 border-b">
                  {/* Anonymous Checkbox styled as switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={complaint.isAnonymous === 'true'}
                      className="sr-only peer"
                      disabled
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-indigo-600 peer-focus:ring-4 peer-focus:ring-indigo-300 transition duration-200 ease-in-out"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white border border-gray-300 rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-full"></div>
                  </label>
                </td>
                <td className="py-3 px-4 border-b">
                  {new Date(complaint.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
