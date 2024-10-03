import { SessionProvider } from 'next-auth/react'; 
import '../styles/globals.css';
import Layout from '../components/Layout';  // Assuming your Layout component is in the components folder
import { useRouter } from 'next/router';

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  const router = useRouter();
  
  // Define routes where Layout should be excluded
  const excludedRoutes = ['/auth/signin'];

  return (
    <SessionProvider session={session}>
        {excludedRoutes.some(route => router.pathname.startsWith(route)) ? (
          <Component {...pageProps} />
        ) : (
          <Layout>
            <Component {...pageProps} />
          </Layout>
        )}
    </SessionProvider>
  );  
}

export default MyApp;
