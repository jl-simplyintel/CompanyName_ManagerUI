import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useDropzone } from 'react-dropzone';
import Swal from 'sweetalert2'; // For pretty alerts
import { AiOutlineLoading3Quarters } from 'react-icons/ai'; // Loader icon
import { FaTrashAlt } from 'react-icons/fa'; // Trash icon for deleting images

export default function EditProduct() {
  const { data: session } = useSession();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [businessId, setBusinessId] = useState('');
  const [businesses, setBusinesses] = useState([]);
  const [images, setImages] = useState([]); // Store product images
  const [reviews, setReviews] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { id } = router.query; // Get product ID from URL
  const renderModerationStatus = (status) => {
    switch (status) {
      case '0':
        return 'Approved';
      case '1':
        return 'Denied';
      case '2':
        return 'Pending Approval';
      default:
        return 'Unknown';
    }
  };

  // Fetch businesses that the user manages
  const fetchBusinesses = async () => {
    if (!session?.user?.id) return;

    const query = `
      query User($where: UserWhereUniqueInput!) {
        user(where: $where) {
          businesses {
            id
            name
          }
        }
      }
    `;

    const variables = {
      where: { id: session.user.id },
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
        setError('Error fetching businesses');
        console.error('GraphQL errors:', json.errors);
      } else {
        setBusinesses(json.data.user.businesses);
        if (json.data.user.businesses.length > 0) {
          setBusinessId(json.data.user.businesses[0].id); // Set default business ID
        }
      }
    } catch (err) {
      setError('Error fetching businesses');
      console.error('Fetch error:', err);
    }
  };

  // Fetch product details for editing
  const fetchProduct = async () => {
    const query = `
      query Product($where: ProductWhereUniqueInput!) {
        product(where: $where) {
          id
          name
          description
          business {
            id
          }
          images {
            id
            file {
              url
            }
          }
          reviews {
            id
            user {
              name
              email
            }
            rating
            content
            moderationStatus
            createdAt
          }
          complaints {
            id
            user {
              name
              email
            }
            subject
            content
            status
            createdAt
          }
        }
      }
    `;

    const variables = { where: { id } }; // Use product ID from URL

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
        setError('Error fetching product');
        console.error('GraphQL errors:', json.errors);
      } else {
        const product = json.data.product;
        setName(product.name);
        setDescription(product.description);
        setBusinessId(product.business.id);
        setImages(product.images); // Set existing images
        setReviews(product.reviews); // Set reviews
        setComplaints(product.complaints); // Set complaints
      }
    } catch (err) {
      setError('Error fetching product');
      console.error('Fetch error:', err);
    }
  };


  useEffect(() => {
    if (session?.user?.id) {
      fetchBusinesses();
    }
    if (id) {
      fetchProduct(); // Fetch product details when page is loaded
    }
  }, [session?.user?.id, id]);

  // Handle product update
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    setLoading(true);

    const query = `
      mutation UpdateProduct($id: ID!, $data: ProductUpdateInput!) {
        updateProduct(where: { id: $id }, data: $data) {
          id
          name
        }
      }
    `;

    const variables = {
      id, // Use the product ID
      data: {
        name,
        description,
        business: { connect: { id: businessId } }, // Link the product to the selected business
      },
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
        setError('Error updating product');
        console.error('GraphQL errors:', json.errors);
      } else {
        Swal.fire({
          title: 'Success!',
          text: 'Product updated successfully!',
          icon: 'success',
          confirmButtonText: 'OK',
        }).then(() => {
          router.push('/products');
        });
      }
    } catch (err) {
      setError('Error updating product');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle file drop (drag-and-drop)
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('productId', id); // Add product ID to the form data

    try {
      const response = await fetch(`/api/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.data && data.data.id) {
        // Reload product images after upload
        fetchProduct();
      }
    } catch (err) {
      console.error('Error uploading image:', err);
    }
  }, [id]);

  // Handle image deletion
  const handleDeleteImage = async (imageId) => {
    const deleteMutation = `
      mutation DeleteImage($imageId: ID!) {
        deleteImage(where: { id: $imageId }) {
          id
        }
      }
    `;

    try {
      await fetch(process.env.NEXT_PUBLIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: deleteMutation,
          variables: { imageId },
        }),
      });

      // Remove the image from the state after deletion
      setImages((prevImages) => prevImages.filter((image) => image.id !== imageId));
    } catch (err) {
      console.error('Error deleting image:', err);
    }
  };

  // Set up Dropzone for drag-and-drop functionality
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleUpdateModerationStatus = async (reviewId, status) => {
    const query = `
      mutation UpdateProductReview($where: ProductReviewWhereUniqueInput!, $data: ProductReviewUpdateInput!) {
        updateProductReview(where: $where, data: $data) {
          id
          moderationStatus
        }
      }
    `;

    const variables = {
      where: { id: reviewId }, // Use the correct `where` clause with `id`
      data: {
        moderationStatus: status // Pass moderationStatus as part of `data` object
      },
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
        console.error('Error updating review moderation status:', json.errors);
      } else {
        fetchProduct(); // Re-fetch product details to update UI
      }
    } catch (error) {
      console.error('Error updating review moderation status:', error);
    }
  };


  const handleToggleComplaintStatus = async (complaintId, status) => {
    const query = `
      mutation UpdateProductComplaint($where: ProductComplaintWhereUniqueInput!, $data: ProductComplaintUpdateInput!) {
        updateProductComplaint(where: $where, data: $data) {
          id
          status
        }
      }
    `;

    const variables = {
      where: { id: complaintId }, // Use the correct `where` clause with `id`
      data: {
        status: status // Pass status as part of `data` object
      },
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
        console.error('Error updating complaint status:', json.errors);
      } else {
        fetchProduct(); // Re-fetch product details to update UI
      }
    } catch (error) {
      console.error('Error updating complaint status:', error);
    }
  };

  if (!session) return <p>Loading session...</p>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-4xl font-extrabold mb-10 text-gray-900">Edit Product</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}

      <form onSubmit={handleUpdateProduct} className="space-y-8 bg-white p-8 shadow-lg rounded-lg">
        {/* Product Name */}
        <div className="mb-6">
          <label className="block text-lg font-medium text-gray-800">Product Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-3 block w-full border-gray-300 shadow-sm focus:ring-indigo-600 focus:border-indigo-600 text-lg p-4 rounded-md"
            placeholder="Enter product name"
            required
          />
        </div>

        {/* Product Description */}
        <div className="mb-6">
          <label className="block text-lg font-medium text-gray-800">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-3 block w-full border-gray-300 shadow-sm focus:ring-indigo-600 focus:border-indigo-600 text-lg p-4 rounded-md"
            rows="5"
            placeholder="Enter product description"
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className={`w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-4 px-6 rounded-md flex items-center justify-center font-semibold transition duration-200 hover:shadow-lg transform hover:-translate-y-1 ${loading ? 'opacity-70' : ''
            }`}
          disabled={loading}
        >
          {loading ? (
            <AiOutlineLoading3Quarters className="animate-spin mr-2" />
          ) : (
            'Update Product'
          )}
        </button>
      </form>

      {/* Existing Images */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Existing Images</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {images.map((image) => (
            <div key={image.id} className="relative group">
              <img
                src={`https://companynameadmin-008a72cce60a.herokuapp.com${image.file.url}`}
                alt="Product Image"
                className="w-full h-40 object-cover rounded-lg shadow-sm transition-transform transform group-hover:scale-105"
              />
              <button
                onClick={() => handleDeleteImage(image.id)}
                className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <FaTrashAlt />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Drag and Drop Image Upload */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed p-8 mt-12 rounded-lg text-center transition-colors ${isDragActive ? 'border-indigo-600 bg-indigo-100' : 'border-gray-300 bg-white'
          }`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-indigo-500 font-semibold">Drop the image here...</p>
        ) : (
          <p className="text-gray-600">Drag and drop an image here, or click to select one</p>
        )}
      </div>

      {/* Product Reviews Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Product Reviews</h2>
        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border rounded-lg p-4 shadow-md">
                <h3 className="text-lg font-semibold text-gray-800">{review.user.name || 'Anonymous'}</h3>
                <p className="text-sm text-gray-500">Rating: {review.rating} ⭐</p>
                <p className="text-sm text-gray-700 mt-2">{review.content}</p>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Moderation Status</label>
                  <div className="flex space-x-4">
                    <label className="cursor-pointer">
                      <input
                        type="radio"
                        name={`moderationStatus-${review.id}`}
                        value="0"
                        checked={review.moderationStatus === '0'}
                        onChange={() => handleUpdateModerationStatus(review.id, '0')}
                        className="sr-only"
                      />
                      <div className={`w-24 h-8 flex items-center justify-center font-semibold ${review.moderationStatus === '0' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'} rounded-full`}>
                        Approved
                      </div>
                    </label>
                    <label className="cursor-pointer">
                      <input
                        type="radio"
                        name={`moderationStatus-${review.id}`}
                        value="1"
                        checked={review.moderationStatus === '1'}
                        onChange={() => handleUpdateModerationStatus(review.id, '1')}
                        className="sr-only"
                      />
                      <div className={`w-24 h-8 flex items-center justify-center font-semibold ${review.moderationStatus === '1' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'} rounded-full`}>
                        Denied
                      </div>
                    </label>
                    <label className="cursor-pointer">
                      <input
                        type="radio"
                        name={`moderationStatus-${review.id}`}
                        value="2"
                        checked={review.moderationStatus === '2'}
                        onChange={() => handleUpdateModerationStatus(review.id, '2')}
                        className="sr-only"
                      />
                      <div className={`w-32 h-8 flex items-center justify-center font-semibold ${review.moderationStatus === '2' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-600'} rounded-full`}>
                        Pending
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No reviews found for this product.</p>
        )}
      </div>


      {/* Product Complaints Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Product Complaints</h2>
        {complaints.length > 0 ? (
          <div className="space-y-4">
            {complaints.map((complaint) => (
              <div key={complaint.id} className="border rounded-lg p-4 shadow-md">
                <h3 className="text-lg font-semibold text-gray-800">{complaint.user.name || 'Anonymous'}</h3>
                <p className="text-sm text-gray-500">Subject: {complaint.subject}</p>
                <p className="text-sm text-gray-700 mt-2">{complaint.content}</p>

                {/* Toggle switch for complaint status */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Complaint Status</label>
                  <div className="flex items-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={complaint.status === '0'}
                        onChange={() => handleToggleComplaintStatus(complaint.id, complaint.status === '0' ? '1' : '0')}
                        className="sr-only peer"
                      />
                      <div className={`w-12 h-6 bg-gray-200 rounded-full peer peer-checked:bg-green-600 peer-focus:ring-4 peer-focus:ring-green-300 transition duration-200 ease-in-out`}></div>
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white border border-gray-300 rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-full"></div>
                    </label>
                    <span className="ml-3 text-sm text-gray-600">{complaint.status === '0' ? 'Resolved' : 'Unresolved'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No complaints found for this product.</p>
        )}
      </div>
    </div>
  );
}
