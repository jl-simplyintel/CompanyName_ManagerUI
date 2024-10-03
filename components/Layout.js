import Sidebar from './sidebar';
import { useSession } from 'next-auth/react';

export default function Layout({ children }) {
  const { data: session, status } = useSession();
  return (
    <div className="flex bg-sky-100">
        <Sidebar user={session?.user} />
      <main className="flex-grow p-6 max-w-7xl mx-auto">{children}</main>
    </div>
  );
}
