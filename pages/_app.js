import { SessionProvider, useSession } from 'next-auth/react'; 
import '../styles/globals.css';
import Layout from '../components/Layout';  // Assuming your Layout component is in the components folder
import { useRouter } from 'next/router';
import { useEffect } from 'react';

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  const router = useRouter();
  
  // Define routes where Layout should be excluded
  const excludedRoutes = ['/auth/signin'];

  return (
    <SessionProvider session={session}>
      {excludedRoutes.some(route => router.pathname.startsWith(route)) ? (
        <Component {...pageProps} />
      ) : (
        <AuthGuard>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </AuthGuard>
      )}
    </SessionProvider>
  );  
}

// AuthGuard component to handle session check and redirection
function AuthGuard({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      // Redirect to the sign-in page if not authenticated
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <div>Loading...</div>; // Show loading screen while checking the session
  }

  if (status === 'authenticated') {
    return <>{children}</>; // Render the children if authenticated
  }

  return null; // Prevent any other renders if not authenticated
}

export default MyApp;
