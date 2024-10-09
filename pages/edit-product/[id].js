// manager-ui/pages/edit-product/[id].js
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Swal from 'sweetalert2'; // For pretty alerts
import EditProductForm from '../../components/EditProduct/EditProductForm';
import ImageUploader from '../../components/EditProduct/ImageUploader';
import ProductComplaints from '../../components/EditProduct/ProductComplaints';
import ProductReviews from '../../components/EditProduct/ProductReviews';

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

  // Handle update moderation status for reviews
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

  // Handle toggle complaint status
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

      <EditProductForm 
        name={name}
        description={description}
        setName={setName}
        setDescription={setDescription}
        handleUpdateProduct={handleUpdateProduct}
        loading={loading}
      />

      {/* Image Uploader */}
      <ImageUploader 
        images={images}
        handleDeleteImage={handleDeleteImage}
        onDrop={onDrop}
      />

      {/* Product Reviews */}
      <ProductReviews 
        reviews={reviews}
        handleUpdateModerationStatus={handleUpdateModerationStatus}
      />

      {/* Product Complaints */}
      <ProductComplaints 
        complaints={complaints}
        handleToggleComplaintStatus={handleToggleComplaintStatus}
      />
    </div>
  );
}
