import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link'; // Import Link for routing
import Swal from 'sweetalert2'; // For alerts

export default function ReviewsPage() {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState(null);
  const [selectedReviews, setSelectedReviews] = useState([]); // Track selected reviews for mass deletion
  const [loading, setLoading] = useState(false);

  // Fetch reviews for the businesses managed by the user
  const fetchReviews = async () => {
    const query = `
      query User($where: UserWhereUniqueInput!) {
        user(where: $where) {
          businesses {
            reviews {
              id
              user {
                id
                name
              }
              isAnonymous
              rating
              moderationStatus
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
        setError('Error fetching reviews');
        console.error('GraphQL errors:', json.errors);
      } else {
        const fetchedReviews = json.data.user.businesses.flatMap((business) => business.reviews || []);
        setReviews(fetchedReviews);
      }
    } catch (err) {
      setError('Error fetching reviews');
      console.error('Fetch error:', err);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchReviews();
    }
  }, [session?.user?.id]);

  // Toggle selection for mass delete
  const toggleSelectReview = (reviewId) => {
    setSelectedReviews((prevSelected) =>
      prevSelected.includes(reviewId)
        ? prevSelected.filter((id) => id !== reviewId)
        : [...prevSelected, reviewId]
    );
  };

  // Handle mass deletion
  const handleMassDelete = async () => {
    if (selectedReviews.length === 0) return;

    Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete ${selectedReviews.length} reviews.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete them!',
      cancelButtonText: 'Cancel',
    }).then(async (result) => {
      if (result.isConfirmed) {
        setLoading(true);

        const deleteMutation = `
          mutation DeleteReview($where: ReviewWhereUniqueInput!) {
            deleteReview(where: $where) {
              id
            }
          }
        `;

        try {
          // Perform the mass deletion
          for (const reviewId of selectedReviews) {
            await fetch(process.env.NEXT_PUBLIC_API_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                query: deleteMutation,
                variables: { where: { id: reviewId } },
              }),
            });
          }

          Swal.fire('Deleted!', `${selectedReviews.length} reviews have been deleted.`, 'success');

          // Re-fetch reviews after deletion
          fetchReviews();
          setSelectedReviews([]); // Clear selected reviews
        } catch (error) {
          console.error('Error deleting reviews:', error);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Convert rating to star display
  const renderStars = (rating) => {
    return '⭐'.repeat(rating);
  };

  // Convert moderation status to human-readable text
  const renderModerationStatus = (status) => {
    switch (status) {
      case "0":
        return 'Approved';
      case "1":
        return 'Denied';
      case "2":
        return 'Pending Approval';
      default:
        return 'Unknown';
    }
  };

  // Handle loading, error, or reviews display
  if (!session) return <p>Loading session...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Business Reviews</h1>
      <div className="mb-4">
        <button
          className={`bg-red-500 text-white py-2 px-4 rounded-md ${selectedReviews.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          disabled={selectedReviews.length === 0}
          onClick={handleMassDelete}
        >
          {loading ? 'Deleting...' : `Delete ${selectedReviews.length} Selected`}
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
                    ? setSelectedReviews(reviews.map((review) => review.id))
                    : setSelectedReviews([])
                }
              />
            </th>
            <th className="py-3 px-4 border-b text-left">Name</th>
            <th className="py-3 px-4 border-b text-left">Rating</th>
            <th className="py-3 px-4 border-b text-left">Moderation Status</th>
            <th className="py-3 px-4 border-b text-left">Anonymous</th> {/* New Anonymous column */}
            <th className="py-3 px-4 border-b text-left">Date Created</th>
          </tr>
        </thead>
        <tbody>
          {reviews.length === 0 ? (
            <tr>
              <td colSpan="6" className="py-4 px-4 text-center text-gray-500">
                No reviews found.
              </td>
            </tr>
          ) : (
            reviews.map((review) => (
              <tr key={review.id}>
                <td className="py-3 px-4 border-b">
                  <input
                    type="checkbox"
                    checked={selectedReviews.includes(review.id)}
                    onChange={() => toggleSelectReview(review.id)}
                  />
                </td>
                <td className="py-3 px-4 border-b">
                  <Link href={`/review/${review.id}`}>
                    {review.user.name}
                  </Link>
                </td>
                <td className="py-3 px-4 border-b">{renderStars(review.rating)}</td>
                <td className="py-3 px-4 border-b">{renderModerationStatus(review.moderationStatus)}</td>
                <td className="py-3 px-4 border-b">
                  {/* Anonymous Checkbox styled as switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={String(review.isAnonymous) === 'true'}
                      className="sr-only peer"
                      disabled
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-indigo-600 peer-focus:ring-4 peer-focus:ring-indigo-300 transition duration-200 ease-in-out"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white border border-gray-300 rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-full"></div>
                  </label>
                </td>
                <td className="py-3 px-4 border-b">
                  {new Date(review.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
