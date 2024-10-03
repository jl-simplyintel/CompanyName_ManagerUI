import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2'; // For alerts
import Modal from 'react-modal'; // For modal handling

export default function ReviewDetails() {
  const router = useRouter();
  const { id } = router.query; // Get review ID from URL
  const [review, setReview] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false); // Loading state for form submission
  const [moderationStatus, setModerationStatus] = useState(''); // Track moderation status
  const [replies, setReplies] = useState([]); // To store replies
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal state
  const [replyContent, setReplyContent] = useState(''); // Track reply content

  // Fetch review details based on the review ID
  const fetchReview = async () => {
    const query = `
      query Review($where: ReviewWhereUniqueInput!) {
        review(where: $where) {
          id
          user {
            name
          }
          rating
          content
          moderationStatus
          createdAt
          isAnonymous
          replies {
            id
            content
            createdAt
          }
        }
      }
    `;

    const variables = { where: { id } };

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
        setError('Error fetching review');
        console.error('GraphQL errors:', json.errors);
      } else {
        setReview(json.data.review);
        setReplies(json.data.review.replies); // Store replies
        setModerationStatus(json.data.review.moderationStatus); // Set current moderation status
      }
    } catch (err) {
      setError('Error fetching review');
      console.error('Fetch error:', err);
    }
  };

  useEffect(() => {
    if (id) {
      fetchReview();
    }
  }, [id]);

  // Handle moderation status update
  const handleModerationUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    const mutation = `
      mutation UpdateReview($id: ID!, $data: ReviewUpdateInput!) {
        updateReview(where: { id: $id }, data: $data) {
          id
          moderationStatus
        }
      }
    `;

    const variables = {
      id, // Review ID from URL
      data: { moderationStatus }, // Send updated moderation status
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
        setError('Error updating moderation status');
        console.error('GraphQL errors:', json.errors);
      } else {
        Swal.fire({
          title: 'Success!',
          text: 'Moderation status updated successfully!',
          icon: 'success',
          confirmButtonText: 'OK',
        });
      }
    } catch (err) {
      setError('Error updating moderation status');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Open and close modal
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // Handle reply submission
  const handleReplySubmit = async (e) => {
    e.preventDefault();
    const mutation = `
      mutation CreateReviewReply($data: ReviewReplyCreateInput!) {
        createReviewReply(data: $data) {
          id
          content
          createdAt
        }
      }
    `;

    const variables = {
      data: {
        content: replyContent,
        review: { connect: { id } }, // Connect the reply to the current review
      },
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
        setError('Error submitting reply');
        console.error('GraphQL errors:', json.errors);
      } else {
        setReplies((prevReplies) => [...prevReplies, json.data.createReviewReply]); // Update replies in state
        setReplyContent(''); // Reset the reply content
        closeModal(); // Close modal
        Swal.fire({
          title: 'Success!',
          text: 'Reply submitted successfully!',
          icon: 'success',
          confirmButtonText: 'OK',
        });
      }
    } catch (err) {
      setError('Error submitting reply');
      console.error('Fetch error:', err);
    }
  };

  if (error) return <p>{error}</p>;
  if (!review) return <p>Loading review...</p>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-indigo-600">Review Details</h1>

      {/* Review details */}
      <form onSubmit={handleModerationUpdate} className="space-y-8 bg-white p-6 shadow-lg rounded-lg">
        {/* Name */}
        <div className="mb-4">
          <label className="block text-lg font-medium text-gray-800">Name</label>
          <input
            type="text"
            value={review.user?.name || 'No Name'}
            className="mt-1 block w-full border border-gray-500 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-md rounded-md px-2"
            disabled
          />
        </div>

        {/* Anonymous Checkbox */}
        <div className="mb-4 flex items-center">
          <label className="text-lg font-medium text-gray-800 mr-4">Anonymous</label>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={review.isAnonymous === 'true'}
              className="sr-only peer"
              disabled
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-indigo-600 peer-focus:ring-4 peer-focus:ring-indigo-300 transition duration-200 ease-in-out"></div>
            <div className="absolute left-1 top-1 w-4 h-4 bg-white border border-gray-300 rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-full"></div>
          </label>
        </div>

        {/* Rating */}
        <div className="mb-4">
          <label className="block text-lg font-medium text-gray-800">Rating</label>
          <input
            type="text"
            value={`${review.rating} ⭐`}
            className="mt-1 block w-full border border-gray-500 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-md rounded-md px-2"
            disabled
          />
        </div>

        {/* Date Created */}
        <div className="mb-4">
          <label className="block text-lg font-medium text-gray-800">Date Created</label>
          <input
            type="text"
            value={new Date(review.createdAt).toLocaleDateString()}
            className="mt-1 block w-full border border-gray-500 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-md rounded-md px-2"
            disabled
          />
        </div>

        {/* Content */}
        <div className="mb-4">
          <label className="block text-lg font-medium text-gray-800">Content</label>
          <textarea
            value={review.content}
            className="mt-1 block w-full border border-gray-500 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-md rounded-md px-2"
            rows="4"
            disabled
          />
        </div>

        {/* Moderation Status */}
        <div className="mb-4">
          <label className="block text-lg font-medium text-gray-800 mb-2">Moderation Status</label>
          <div className="flex space-x-6">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="radio"
                name="moderationStatus"
                value="0"
                checked={moderationStatus === '0'}
                onChange={(e) => setModerationStatus(e.target.value)}
                className="sr-only peer"
              />
              <div className={`w-28 h-8 flex items-center justify-center font-semibold ${moderationStatus === '0' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'} rounded-full peer-focus:ring-4 peer-focus:ring-indigo-300 transition duration-200 ease-in-out`}>
                Approved
              </div>
            </label>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="radio"
                name="moderationStatus"
                value="1"
                checked={moderationStatus === '1'}
                onChange={(e) => setModerationStatus(e.target.value)}
                className="sr-only peer"
              />
              <div className={`w-28 h-8 flex items-center justify-center font-semibold ${moderationStatus === '1' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600'} rounded-full peer-focus:ring-4 peer-focus:ring-red-300 transition duration-200 ease-in-out`}>
                Denied
              </div>
            </label>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="radio"
                name="moderationStatus"
                value="2"
                checked={moderationStatus === '2'}
                onChange={(e) => setModerationStatus(e.target.value)}
                className="sr-only peer"
              />
              <div className={`w-44 h-8 flex items-center justify-center font-semibold ${moderationStatus === '2' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-600'} rounded-full peer-focus:ring-4 peer-focus:ring-yellow-300 transition duration-200 ease-in-out`}>
                Pending Approval
              </div>
            </label>
          </div>
        </div>

        {/* Update Button */}
        <button
          type="submit"
          className={`bg-indigo-600 text-white py-2 px-4 rounded-md flex items-center justify-center ${loading ? 'opacity-70' : ''}`}
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update Moderation Status'}
        </button>
      </form>

      {/* Reply Button */}
      <button
        onClick={openModal}
        className="bg-indigo-600 text-white py-2 px-4 mt-4 rounded-md"
      >
        Reply
      </button>

      {/* Modal for reply */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Reply to Review"
        className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto mt-20"
      >
        <h2 className="text-lg font-bold mb-4">Reply to Review</h2>
        <form onSubmit={handleReplySubmit}>
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md mb-4"
            rows="4"
            placeholder="Write your reply..."
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white py-2 px-4 rounded-md"
          >
            Submit Reply
          </button>
          <button
            type="button"
            onClick={closeModal}
            className="ml-2 bg-gray-400 text-white py-2 px-4 rounded-md"
          >
            Cancel
          </button>
        </form>
      </Modal>

      {/* Replies section */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Replies</h2>
        {replies.length > 0 ? (
          replies.map((reply) => (
            <div key={reply.id} className="border p-4 rounded-lg shadow mb-4">
              <p className="text-sm">{reply.content}</p>
              <p className="text-xs text-gray-400">Replied on {new Date(reply.createdAt).toLocaleDateString()}</p>
            </div>
          ))
        ) : (
          <p>No replies yet.</p>
        )}
      </div>
    </div>
  );
}
