import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react'; // Import useSession from next-auth
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react'; // Import Swiper components
import 'swiper/css'; // Import core Swiper styles
import 'swiper/css/navigation'; // Import Swiper navigation styles if needed
import 'swiper/css/pagination'; // Import Swiper pagination styles if needed

export default function Products() {
  const { data: session, status } = useSession(); // Access session and status from next-auth
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch products using native fetch
  const fetchProducts = async () => {
    if (!session?.user?.id) return; // Ensure session and user ID are available

    const query = `
      query User($where: UserWhereUniqueInput!) {
        user(where: $where) {
          businesses {
            products {
              id
              name
              description
              images {
                id
                file {
                  id
                  filesize
                  width
                  height
                  extension
                  url
                }
              }
              reviews {
                rating
              }
            }
          }
        }
      }
    `;

    const variables = {
      where: { id: session.user.id }, // Use the session's user ID
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
        setError('Error fetching products');
        console.error('GraphQL errors:', json.errors);
      } else {
        const fetchedProducts = json.data.user.businesses.flatMap((business) => business.products || []);
        setProducts(fetchedProducts);
      }
    } catch (err) {
      setError('Error fetching products');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch products when the session is available
  useEffect(() => {
    if (session?.user?.id) {
      fetchProducts();
    }
  }, [session?.user?.id]);

  // Function to calculate the average rating
  const calculateAverageRating = (reviews) => {
    if (!reviews || reviews.length === 0) return 'No ratings';
    const totalRating = reviews.reduce((sum, review) => sum + Number(review.rating), 0);
    const averageRating = totalRating / reviews.length;
    return averageRating.toFixed(1);
  };

  // Handle product deletion
  const handleDelete = async (productId) => {
    const query = `
      mutation DeleteProduct($where: ProductWhereUniqueInput!) {
        deleteProduct(where: $where) {
          id
        }
      }
    `;

    const variables = {
      where: { id: productId },
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
        console.error('Error deleting product:', json.errors);
        return;
      }

      // After deleting, refresh the product list
      fetchProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  // Handle loading, error, or product data
  if (status === 'loading') return <p>Loading session...</p>;
  if (loading) return <p>Loading products...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-extrabold text-indigo-600">Products</h1>
        <Link href="/add-product">
          <button className="bg-indigo-600 text-white py-2 px-4 rounded-md shadow-md hover:bg-indigo-700 transition duration-200 ease-in-out">
            Add a Product
          </button>
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="text-gray-600 text-center">No products found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <div
              key={product.id}
              className="border rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out"
            >
              <h2 className="text-xl font-bold mb-3 text-gray-800">{product.name}</h2>
              <p className="text-sm text-gray-600 mb-4">{product.description}</p>

              {/* Display product images using Swiper carousel */}
              {product.images.length > 0 ? (
                <Swiper
                  spaceBetween={10}
                  slidesPerView={1}
                  className="mb-4 rounded-lg overflow-hidden"
                >
                  {product.images.map((image) => (
                    <SwiperSlide key={image.id}>
                      <img
                        src={`https://companynameadmin-008a72cce60a.herokuapp.com${image.file.url}`}
                        alt={product.name}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>
              ) : (
                <p className="text-sm text-gray-500">No images available</p>
              )}

              {/* Display average rating */}
              <div className="flex items-center justify-between mt-4">
                <div>
                  <span className="text-sm text-gray-500">Average Rating: </span>
                  <span className="text-lg font-bold text-yellow-500">
                    {calculateAverageRating(product.reviews)} ⭐
                  </span>
                </div>
              </div>

              {/* Edit and Delete Buttons */}
              <div className="flex justify-between mt-6">
                <Link href={`/edit-product/${product.id}`}>
                  <button className="bg-indigo-600 text-white py-2 px-4 rounded-md shadow-md hover:bg-indigo-700 transition duration-200 ease-in-out">
                    Edit
                  </button>
                </Link>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="bg-red-500 text-white py-2 px-4 rounded-md shadow-md hover:bg-red-600 transition duration-200 ease-in-out"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
