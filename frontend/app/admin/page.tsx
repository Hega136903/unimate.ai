'use client';

import AdminPanel from '../components/AdminPanel';
import { AuthProvider } from '../context/AuthContext';

export default function AdminPage() {
  return (
    <AuthProvider>
      <div className="min-h-screen">
        <AdminPanel />
      </div>
    </AuthProvider>
  );
}
