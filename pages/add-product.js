import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useDropzone } from 'react-dropzone';
import Swal from 'sweetalert2'; // Import SweetAlert2

export default function AddProduct() {
    const { data: session } = useSession();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [businessId, setBusinessId] = useState('');
    const [businesses, setBusinesses] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [productId, setProductId] = useState(null); // Store the product ID after creation
    const router = useRouter();

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

    useEffect(() => {
        if (session?.user?.id) {
            fetchBusinesses();
        }
    }, [session?.user?.id]);

    // Handle product creation
    const handleAddProduct = async (e) => {
        e.preventDefault();
        setLoading(true);

        const query = `
      mutation CreateProduct($data: ProductCreateInput!) {
        createProduct(data: $data) {
          id
          name
        }
      }
    `;

        const variables = {
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
                setError('Error adding product');
                console.error('GraphQL errors:', json.errors);
            } else {
                setProductId(json.data.createProduct.id);

                // Show success message using SweetAlert
                Swal.fire({
                    title: 'Success!',
                    text: 'Product created successfully!',
                    icon: 'success',
                    confirmButtonText: 'OK',
                }).then(() => {
                    // Optionally, redirect to the products page
                    router.push('/products');
                });
            }
        } catch (err) {
            setError('Error adding product');
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Handle file drop (drag-and-drop)
    const onDrop = useCallback(async (acceptedFiles) => {
        if (!productId) {
            setError('Create a product before uploading images.');
            return;
        }

        const file = acceptedFiles[0];
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`/api/upload`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (data.id) {
                // After uploading the image, associate it with the product in Keystone
                const imageMutation = `
          mutation UpdateProduct($productId: ID!, $imageId: ID!) {
            updateProduct(
              where: { id: $productId }
              data: { images: { connect: { id: $imageId } } }
            ) {
              id
            }
          }
        `;

                const variables = {
                    productId,
                    imageId: data.id,
                };

                await fetch(process.env.NEXT_PUBLIC_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ query: imageMutation, variables }),
                });
            }
        } catch (err) {
            console.error('Error uploading image:', err);
        }
    }, [productId]);

    // Set up Dropzone for drag-and-drop functionality
    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    if (!session) return <p>Loading session...</p>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Add a Product</h1>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <form onSubmit={handleAddProduct}>
                <div className="mb-4">
                    <label className="block text-sm font-medium">Product Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 block w-full border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="mt-1 block w-full border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        rows="3"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium">Select Business</label>
                    <select
                        value={businessId}
                        onChange={(e) => setBusinessId(e.target.value)}
                        className="mt-1 block w-full border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                    >
                        {businesses.map((business) => (
                            <option key={business.id} value={business.id}>
                                {business.name}
                            </option>
                        ))}
                    </select>
                </div>
                <button
                    type="submit"
                    className="bg-blue-500 text-white py-2 px-4 rounded-md"
                    disabled={loading}
                >
                    {loading ? 'Adding Product...' : 'Add Product'}
                </button>
            </form>

            {/* Drag and Drop Image Upload */}
            <div {...getRootProps()} className="border-2 border-dashed border-gray-300 p-6 mt-8 rounded-lg">
                <input {...getInputProps()} />
                {isDragActive ? (
                    <p className="text-blue-500">Drop the image here...</p>
                ) : (
                    <p className="text-gray-700">Drag and drop an image here, or click to select one</p>
                )}
            </div>
        </div>
    );
}
