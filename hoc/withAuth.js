import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const withAuth = (WrappedComponent) => {
  return (props) => {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
      if (status === 'unauthenticated') {
        router.push('/auth/signin'); // Redirect to sign-in page if not authenticated
      }
    }, [status]);

    if (status === 'loading') {
      return <p>Loading...</p>; // Show loading state while checking authentication
    }

    if (session && session.user.role !== 'manager') {
      router.push('/unauthorized'); // Redirect if user is not a manager
      return null;
    }

    return <WrappedComponent {...props} />;
  };
};

export default withAuth;
