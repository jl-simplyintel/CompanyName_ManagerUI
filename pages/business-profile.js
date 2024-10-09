import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import BasicInformation from '../components/BasicInformation';
import ContactInformation from '../components/ContactInformation';
import BusinessInformation from '../components/BusinessInformation';

export default function BusinessProfile() {
  const { data: session } = useSession();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBusinessData = async () => {
    if (!session?.user?.id) return;

    const query = `
      query User($where: UserWhereUniqueInput!) {
        user(where: $where) {
          businesses {
            id
            name
            description
            industry
            contactEmail
            contactPhone
            website
            location
            address
            yearFounded
            typeOfEntity
            businessHours
            revenue
            employeeCount
            keywords
            companyLinkedIn
            companyFacebook
            companyTwitter
            technologiesUsed
            sicCodes
          }
        }
      }
    `;

    const variables = {
      where: { id: session?.user?.id },
    };

    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, variables }),
      });

      const json = await res.json();
      if (json.errors) {
        setError('Error fetching business data');
        console.error(json.errors);
      } else {
        const businessData = json.data.user.businesses[0];
        setBusiness(businessData);
      }
    } catch (err) {
      setError('Error fetching business data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessData();
  }, [session?.user?.id]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="flex">
      <div className="p-6 max-w-7xl mx-auto w-full bg-white shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold mb-6 text-indigo-600">Business Profile</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <BasicInformation business={business} />
          <ContactInformation business={business} />
          <BusinessInformation business={business} />
        </div>
      </div>
    </div>
  );
}
