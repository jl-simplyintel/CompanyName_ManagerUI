import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2'; // For alerts
import Modal from 'react-modal'; // For modal handling

export default function ComplaintDetails() {
  const router = useRouter();
  const { id } = router.query; // Get complaint ID from URL
  const [complaint, setComplaint] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false); // Loading state for form submission
  const [status, setStatus] = useState(''); // Track complaint status
  const [replies, setReplies] = useState([]); // To store replies
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal state
  const [replyContent, setReplyContent] = useState(''); // Track reply content

  // Fetch complaint details based on the complaint ID
  const fetchComplaint = async () => {
    const query = `
      query Complaint($where: ComplaintWhereUniqueInput!) {
        complaint(where: $where) {
          id
          user {
            name
          }
          subject
          content
          status
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
        setError('Error fetching complaint');
        console.error('GraphQL errors:', json.errors);
      } else {
        setComplaint(json.data.complaint);
        setReplies(json.data.complaint.replies); // Store replies
        setStatus(json.data.complaint.status); // Set current status
      }
    } catch (err) {
      setError('Error fetching complaint');
      console.error('Fetch error:', err);
    }
  };

  useEffect(() => {
    if (id) {
      fetchComplaint();
    }
  }, [id]);

  // Handle status update
  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    const mutation = `
      mutation UpdateComplaint($id: ID!, $data: ComplaintUpdateInput!) {
        updateComplaint(where: { id: $id }, data: $data) {
          id
          status
        }
      }
    `;

    const variables = {
      id, // Complaint ID from URL
      data: { status }, // Send updated status
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
        setError('Error updating status');
        console.error('GraphQL errors:', json.errors);
      } else {
        Swal.fire({
          title: 'Success!',
          text: 'Status updated successfully!',
          icon: 'success',
          confirmButtonText: 'OK',
        });
      }
    } catch (err) {
      setError('Error updating status');
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
      mutation CreateComplaintReply($data: ComplaintReplyCreateInput!) {
        createComplaintReply(data: $data) {
          id
          content
          createdAt
        }
      }
    `;

    const variables = {
      data: {
        content: replyContent,
        complaint: { connect: { id } }, // Connect the reply to the current complaint
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
        setReplies((prevReplies) => [...prevReplies, json.data.createComplaintReply]); // Update replies in state
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
  if (!complaint) return <p>Loading complaint...</p>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-indigo-600">Complaint Details</h1>

      {/* Complaint details */}
      <form onSubmit={handleStatusUpdate} className="space-y-8 bg-white p-6 shadow-lg rounded-lg">
        {/* Name */}
        <div className="mb-4">
          <label className="block text-lg font-medium text-gray-800">Name</label>
          <input
            type="text"
            value={complaint.user?.name || 'No Name'}
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
              checked={complaint.isAnonymous === 'true'}
              className="sr-only peer"
              disabled
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-indigo-600 peer-focus:ring-4 peer-focus:ring-indigo-300 transition duration-200 ease-in-out"></div>
            <div className="absolute left-1 top-1 w-4 h-4 bg-white border border-gray-300 rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-full"></div>
          </label>
        </div>

        {/* Subject */}
        <div className="mb-4">
          <label className="block text-lg font-medium text-gray-800">Subject</label>
          <input
            type="text"
            value={complaint.subject}
            className="mt-1 block w-full border border-gray-500 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-md rounded-md px-2"
            disabled
          />
        </div>

        {/* Content */}
        <div className="mb-4">
          <label className="block text-lg font-medium text-gray-800">Content</label>
          <textarea
            value={complaint.content}
            className="mt-1 block w-full border border-gray-500 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-md rounded-md px-2"
            rows="4"
            disabled
          />
        </div>

        {/* Status */}
        <div className="mb-4">
          <label className="block text-lg font-medium text-gray-800 mb-2">Complaint Status</label>
          <div className="flex space-x-6">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="radio"
                name="status"
                value="0"
                checked={status === '0'}
                onChange={(e) => setStatus(e.target.value)}
                className="sr-only peer"
              />
              <div className={`w-28 h-8 flex items-center justify-center font-semibold ${status === '0' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'} rounded-full peer-focus:ring-4 peer-focus:ring-indigo-300 transition duration-200 ease-in-out`}>
                Closed
              </div>
            </label>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="radio"
                name="status"
                value="1"
                checked={status === '1'}
                onChange={(e) => setStatus(e.target.value)}
                className="sr-only peer"
              />
              <div className={`w-28 h-8 flex items-center justify-center font-semibold ${status === '1' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-600'} rounded-full peer-focus:ring-4 peer-focus:ring-yellow-300 transition duration-200 ease-in-out`}>
                Pending
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
          {loading ? 'Updating...' : 'Update Status'}
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
        contentLabel="Reply to Complaint"
        className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto mt-20"
      >
        <h2 className="text-lg font-bold mb-4">Reply to Complaint</h2>
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
