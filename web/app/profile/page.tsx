'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { authApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Loader2, User, Mail, CheckCircle, XCircle } from 'lucide-react';

export default function ProfilePage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleDiscordConnect = () => {
    // Redirect to Discord OAuth
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    // Backend callback URL (where Discord redirects)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const redirectUri = encodeURIComponent(`${apiUrl}/auth/discord/callback`);
    const scopes = encodeURIComponent('identify email');
    const state = encodeURIComponent(JSON.stringify({ userId: user.id }));
    
    if (!clientId) {
      alert('Discord OAuth is not configured. Please set NEXT_PUBLIC_DISCORD_CLIENT_ID in your environment variables.');
      return;
    }

    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scopes}&state=${state}`;
    window.location.href = discordAuthUrl;
  };

  const handleDiscordDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Discord account?')) {
      return;
    }

    setDisconnecting(true);
    try {
      await authApi.disconnectDiscord();
      // Refresh user data and reload page to update auth context
      await authApi.getMe();
      // Small delay to ensure data is updated
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to disconnect Discord account. Please try again.');
      setDisconnecting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-grow max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
          <p className="text-gray-600">Manage your account settings and connected accounts.</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* User Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Username</p>
                  <p className="text-lg font-medium text-gray-900">{user.username}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-lg font-medium text-gray-900">{user.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Connected Accounts */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Connected Accounts</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">D</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Discord</p>
                    <p className="text-sm text-gray-500">
                      {user.discord_id ? 'Connected' : 'Not connected'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {user.discord_id ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDiscordDisconnect}
                        disabled={disconnecting}
                      >
                        {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                      </Button>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-gray-400" />
                      <Button
                        size="sm"
                        onClick={handleDiscordConnect}
                      >
                        Connect Discord
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

