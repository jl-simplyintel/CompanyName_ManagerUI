import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Swal from 'sweetalert2'; // For alerts

export default function JobListingsPage() {
  const { data: session } = useSession();
  const [jobListings, setJobListings] = useState([]);
  const [editMode, setEditMode] = useState(null); // Track which job is being edited
  const [editedJob, setEditedJob] = useState({});
  const [selectedJobs, setSelectedJobs] = useState([]); // Track selected jobs for mass deletion
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false); // Track modal visibility
  const [newJob, setNewJob] = useState({ title: '', description: '', location: '', salary: '' }); // New job details
  const [businessId, setBusinessId] = useState(null); // Track business ID

  // Fetch job listings for the businesses managed by the user
  const fetchJobListings = async () => {
    const query = `
      query User($where: UserWhereUniqueInput!) {
        user(where: $where) {
          businesses {
            id
            jobListings {
              id
              title
              description
              location
              salary
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
        setError('Error fetching job listings');
        console.error('GraphQL errors:', json.errors);
      } else {
        const fetchedBusinesses = json.data.user.businesses || [];
        setJobListings(fetchedBusinesses.flatMap((business) => business.jobListings || []));

        // Save the business ID to use when creating a job listing
        if (fetchedBusinesses.length > 0) {
          setBusinessId(fetchedBusinesses[0].id); // Assuming the user manages one business, otherwise handle multiple businesses
        }
      }
    } catch (err) {
      setError('Error fetching job listings');
      console.error('Fetch error:', err);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchJobListings();
    }
  }, [session?.user?.id]);

  // Toggle selection for mass delete
  const toggleSelectJob = (jobId) => {
    setSelectedJobs((prevSelected) =>
      prevSelected.includes(jobId)
        ? prevSelected.filter((id) => id !== jobId)
        : [...prevSelected, jobId]
    );
  };

  // Handle mass deletion
  const handleMassDelete = async () => {
    if (selectedJobs.length === 0) return;

    Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete ${selectedJobs.length} job listings.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete them!',
      cancelButtonText: 'Cancel',
    }).then(async (result) => {
      if (result.isConfirmed) {
        setLoading(true);

        const deleteMutation = `
          mutation DeleteJobListing($where: JobListingWhereUniqueInput!) {
            deleteJobListing(where: $where) {
              id
            }
          }
        `;

        try {
          // Perform the mass deletion
          for (const jobId of selectedJobs) {
            await fetch(process.env.NEXT_PUBLIC_API_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                query: deleteMutation,
                variables: { where: { id: jobId } },
              }),
            });
          }

          Swal.fire('Deleted!', `${selectedJobs.length} job listings have been deleted.`, 'success');

          // Re-fetch job listings after deletion
          fetchJobListings();
          setSelectedJobs([]); // Clear selected job listings
        } catch (error) {
          console.error('Error deleting job listings:', error);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Enter edit mode for a job listing
  const handleEdit = (job) => {
    setEditMode(job.id); // Set the job in edit mode
    setEditedJob(job); // Store the edited job data locally
  };

  // Handle field changes in edit mode
  const handleFieldChange = (e, field) => {
    setEditedJob({
      ...editedJob,
      [field]: e.target.value,
    });
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditMode(null); // Exit edit mode
    setEditedJob({}); // Clear edited job data
  };

  // Handle update
  const handleUpdate = async (jobId) => {
    const updateMutation = `
      mutation UpdateJobListing($where: JobListingWhereUniqueInput!, $data: JobListingUpdateInput!) {
        updateJobListing(where: $where, data: $data) {
          id
          title
          description
          location
          salary
        }
      }
    `;

    const variables = {
      where: { id: jobId },
      data: {
        title: editedJob.title,
        description: editedJob.description,
        location: editedJob.location,
        salary: parseFloat(editedJob.salary), // Ensure salary is a number
      },
    };

    try {
      await fetch(process.env.NEXT_PUBLIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: updateMutation, variables }),
      });

      Swal.fire('Updated!', 'Job listing has been updated.', 'success');
      fetchJobListings();
      handleCancelEdit(); // Exit edit mode
    } catch (error) {
      console.error('Error updating job listing:', error);
    }
  };

  // Add a new job listing
  const handleAddListing = async () => {
    if (!businessId) {
      Swal.fire('Error!', 'No business ID found for the user.', 'error');
      return;
    }

    const addMutation = `
      mutation CreateJobListing($data: JobListingCreateInput!) {
        createJobListing(data: $data) {
          id
          title
          description
          location
          salary
          business {
            id
          }
        }
      }
    `;

    const variables = {
      data: {
        title: newJob.title,
        description: newJob.description,
        location: newJob.location,
        salary: parseFloat(newJob.salary),
        business: { connect: { id: businessId } }, // Connect the job listing to the business
      },
    };

    try {
      await fetch(process.env.NEXT_PUBLIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: addMutation, variables }),
      });

      Swal.fire('Added!', 'New job listing has been added.', 'success');
      fetchJobListings();
      setShowModal(false); // Close the modal after adding
      setNewJob({ title: '', description: '', location: '', salary: '' }); // Clear form inputs
    } catch (error) {
      console.error('Error adding job listing:', error);
      Swal.fire('Error!', 'There was an error adding the job listing.', 'error');
    }
  };

  // Handle loading, error, or job listings display
  if (!session) return <p>Loading session...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Job Listings</h1>

      {/* Add Listing Button */}
      <div className="mb-4">
        <button
          className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600"
          onClick={() => setShowModal(true)}
        >
          Add Listing
        </button>
      </div>

      <div className="mb-4">
        <button
          className={`bg-red-500 text-white py-2 px-4 rounded-md ${selectedJobs.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={selectedJobs.length === 0}
          onClick={handleMassDelete}
        >
          {loading ? 'Deleting...' : `Delete ${selectedJobs.length} Selected`}
        </button>
      </div>

      {/* Job Listings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobListings.length === 0 ? (
          <p className="text-center text-gray-500">No job listings found.</p>
        ) : (
          jobListings.map((job) => (
            <div key={job.id} className="bg-white p-4 rounded-lg shadow-lg">
              {editMode === job.id ? (
                <div>
                  <input
                    type="text"
                    value={editedJob.title}
                    onChange={(e) => handleFieldChange(e, 'title')}
                    className="mb-2 w-full p-2 border rounded"
                  />
                  <textarea
                    value={editedJob.description}
                    onChange={(e) => handleFieldChange(e, 'description')}
                    className="mb-2 w-full p-2 border rounded"
                  />
                  <input
                    type="text"
                    value={editedJob.location}
                    onChange={(e) => handleFieldChange(e, 'location')}
                    className="mb-2 w-full p-2 border rounded"
                  />
                  <input
                    type="number"
                    value={editedJob.salary}
                    onChange={(e) => handleFieldChange(e, 'salary')}
                    className="mb-2 w-full p-2 border rounded"
                  />
                  <div className="flex justify-between mt-4">
                    <button
                      className="bg-green-500 text-white py-1 px-2 rounded hover:bg-green-700 transition duration-300"
                      onClick={() => handleUpdate(job.id)}
                    >
                      Update
                    </button>
                    <button
                      className="bg-gray-500 text-white py-1 px-2 rounded hover:bg-gray-700 transition duration-300"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">{job.title}</h3>
                    <p className="text-sm mb-2">Location: {job.location}</p>
                    <p className="text-sm mb-2">Salary: {job.salary ? `$${job.salary}` : 'N/A'}</p>
                    <p className="text-sm mb-2">Description: {job.description}</p>
                    <p className="text-xs text-gray-400">Created on: {new Date(job.createdAt).toLocaleDateString()}</p>
                  </div>

                  <input
                    type="checkbox"
                    checked={selectedJobs.includes(job.id)}
                    onChange={() => toggleSelectJob(job.id)}
                    className="mt-2"
                  />

                  <div className="flex justify-between mt-4">
                    <button
                      className="bg-blue-500 text-white py-1 px-2 rounded hover:bg-blue-700 transition duration-300"
                      onClick={() => handleEdit(job)}
                    >
                      Edit
                    </button>
                    <button
                      className="bg-red-500 text-white py-1 px-2 rounded hover:bg-red-700 transition duration-300"
                      onClick={() => toggleSelectJob(job.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Job Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
            <h2 className="text-2xl font-semibold mb-4">Add Job Listing</h2>
            <input
              type="text"
              placeholder="Title"
              value={newJob.title}
              onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
              className="w-full p-2 mb-4 border rounded"
            />
            <textarea
              placeholder="Description"
              value={newJob.description}
              onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
              className="w-full p-2 mb-4 border rounded"
            />
            <input
              type="text"
              placeholder="Location"
              value={newJob.location}
              onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
              className="w-full p-2 mb-4 border rounded"
            />
            <input
              type="number"
              placeholder="Salary"
              value={newJob.salary}
              onChange={(e) => setNewJob({ ...newJob, salary: e.target.value })}
              className="w-full p-2 mb-4 border rounded"
            />
            <div className="flex justify-between">
              <button
                className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-700 transition duration-300"
                onClick={handleAddListing}
              >
                Add Listing
              </button>
              <button
                className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-700 transition duration-300"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
