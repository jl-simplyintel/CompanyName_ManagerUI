import { useSession } from 'next-auth/react';

export default function Dashboard() {

  return (
    <div className="flex">

      {/* Main content */}
      <div className="flex-grow p-6">
        <h1 className="text-2xl font-bold">Welcome to the Dashboard</h1>
        <p>Your business management portal.</p>
      </div>
    </div>
  );
}
