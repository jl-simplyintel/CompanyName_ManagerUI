import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'manager') {
      fetchData();
    }
  }, [status, session]);

  const fetchData = async () => {
    const query = `
      query User($where: UserWhereUniqueInput!, $reviewsWhere2: ReviewWhereInput!, $complaintsWhere2: ComplaintWhereInput!, $reviewsWhere3: ProductReviewWhereInput!, $complaintsWhere3: ProductComplaintWhereInput!) {
        user(where: $where) {
          id
          name
          email
          businesses {
            id
            name
            reviews(where: $reviewsWhere2) {
              id
              user {
                name
              }
              rating
              moderationStatus
              createdAt
            }
            complaints(where: $complaintsWhere2) {
              id
              user {
                name
                email
              }
              isAnonymous
              subject
              content
              status
              createdAt
            }
            products {
              id
              name
              reviews(where: $reviewsWhere3) {
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
              complaints(where: $complaintsWhere3) {
                id
                user {
                  name
                }
                subject
                content
                status
                createdAt
              }
            }
          }
        }
      }
    `;

    const variables = {
      where: { id: session?.user?.id },
      reviewsWhere2: { moderationStatus: { equals: "2" } }, // Pending business reviews
      complaintsWhere2: { status: { equals: "1" } }, // Pending business complaints
      reviewsWhere3: { moderationStatus: { equals: "2" } }, // Pending product reviews
      complaintsWhere3: { status: { equals: "1" } }, // Pending product complaints
    };

    try {
      const response = await fetch(process.env.NEXT_PUBLIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, variables }),
      });

      const result = await response.json();
      if (result.errors) {
        console.error(result.errors);
        setError('Error fetching data. Please try again later.');
      } else {
        setData(result.data.user);
        setLoading(false);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setError('Error fetching data. Check your network or try again later.');
    }
  };

  if (loading) return <div>Loading data, please wait...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Welcome, {session?.user?.name}</h1>

      {/* Loop through businesses */}
      {data?.businesses?.map((business) => (
        <div key={business.id} className="mb-8 bg-white p-6 shadow-md rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">{business.name}</h2>

          {/* Business Reviews */}
          <Section title="Pending Reviews" data={business.reviews} renderItem={renderReview} linkPrefix="/review" />

          {/* Business Complaints */}
          <Section title="Pending Complaints" data={business.complaints} renderItem={renderComplaint} linkPrefix="/complaint" />

          {/* Product Reviews & Complaints */}
          {business.products.map((product) => (
            <div key={product.id} className="mb-4 bg-gray-50 p-4 rounded-md">
              <h4 className="text-lg font-semibold mb-2">{product.name}</h4>

              {/* Product Reviews */}
              <Section title="Product Reviews" data={product.reviews} renderItem={renderProductReview} linkPrefix={`/edit-product/${product.id}`} />

              {/* Product Complaints */}
              <Section title="Product Complaints" data={product.complaints} renderItem={renderProductComplaint} linkPrefix={`/edit-product/${product.id}`} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* Utility Components for Sections */
function Section({ title, data, renderItem, linkPrefix }) {
  return (
    <div className="mt-4">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <div className="overflow-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="py-2 text-left bg-gray-100 font-semibold">Details</th>
            </tr>
          </thead>
          <tbody>
            {data && data.length > 0 ? (
              data.map((item, idx) => (
                <tr key={idx} className="border-t">
                  <td className="py-2">
                    <Link href={`${linkPrefix}/${item.id}`} passHref>
                      <span className="text-blue-600 hover:underline cursor-pointer">
                        {renderItem(item)}
                      </span>
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="py-2 text-gray-500">No {title.toLowerCase()}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* Render Functions */
function renderReview(review) {
  return (
    <>
      <strong>{review.user.name}</strong> - Rating: {review.rating}
    </>
  );
}

function renderComplaint(complaint) {
  return (
    <>
      <strong>{complaint.user.name}</strong> - {complaint.subject}
    </>
  );
}

function renderProductReview(review) {
  return (
    <>
      <strong>{review.user.name}</strong> - Rating: {review.rating}
    </>
  );
}

function renderProductComplaint(complaint) {
  return (
    <>
      <strong>{complaint.user.name}</strong> - {complaint.subject}
    </>
  );
}
