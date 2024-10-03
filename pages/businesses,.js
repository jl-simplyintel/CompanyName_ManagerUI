import withAuth from '../components/withAuth';
import { gql, useQuery } from '@apollo/client';

const BUSINESS_LIST_QUERY = gql`
  query GetBusinesses {
    businesses {
      id
      name
      owner {
        name
      }
    }
  }
`;

function Businesses() {
  const { loading, error, data } = useQuery(BUSINESS_LIST_QUERY);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4">Manage Businesses</h1>
      <ul>
        {data.businesses.map((business) => (
          <li key={business.id} className="p-2 border-b">
            {business.name} (Owned by: {business.owner.name})
          </li>
        ))}
      </ul>
    </div>
  );
}

export default withAuth(Businesses);
