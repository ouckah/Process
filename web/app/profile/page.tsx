'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useProcesses } from '@/hooks/useProcesses';
import { authApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader2, User, Mail, CheckCircle, XCircle, Edit, Save, X, ExternalLink, Eye, EyeOff, MessageSquare, Shield } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, loading: authLoading, isAuthenticated, updateProfile } = useAuth();
  const { data: processes } = useProcesses();
  const router = useRouter();
  const [disconnecting, setDisconnecting] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameValue, setUsernameValue] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [updatingUsername, setUpdatingUsername] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [updatingPrivacy, setUpdatingPrivacy] = useState(false);
  const [privacyError, setPrivacyError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setUsernameValue(user.username);
      setDisplayName(user.display_name || '');
      setIsAnonymous(user.is_anonymous || false);
      setCommentsEnabled(user.comments_enabled !== false); // Default to true
    }
  }, [user]);

  const handleStartEditUsername = () => {
    setIsEditingUsername(true);
    setUsernameError(null);
  };

  const handleCancelEditUsername = () => {
    setIsEditingUsername(false);
    setUsernameValue(user?.username || '');
    setUsernameError(null);
  };

  const handleSaveUsername = async () => {
    if (!usernameValue.trim()) {
      setUsernameError('Username cannot be empty');
      return;
    }

    if (usernameValue === user?.username) {
      setIsEditingUsername(false);
      return;
    }

    setUpdatingUsername(true);
    setUsernameError(null);

    try {
      await updateProfile({ username: usernameValue.trim() });
      setIsEditingUsername(false);
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to update username. Please try again.';
      setUsernameError(errorMessage);
    } finally {
      setUpdatingUsername(false);
    }
  };

  // Calculate stats
  const totalProcesses = processes?.length || 0;
  const publicProcesses = processes?.filter(p => p.is_public).length || 0;
  const offersCount = processes?.filter(p => p.status === 'completed').length || 0;
  const activeCount = processes?.filter(p => p.status === 'active').length || 0;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 dark:text-primary-400" />
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

  const handleSavePrivacySettings = async () => {
    setUpdatingPrivacy(true);
    setPrivacyError(null);

    try {
      await updateProfile({
        display_name: displayName.trim() || null,
        is_anonymous: isAnonymous,
        comments_enabled: commentsEnabled,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to update privacy settings. Please try again.';
      setPrivacyError(errorMessage);
    } finally {
      setUpdatingPrivacy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <Header />
      <main className="flex-grow max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Profile</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your account settings and connected accounts.</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 space-y-6">
          {/* User Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Account Information</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Username</p>
                    {isEditingUsername ? (
                      <div className="mt-1">
                        <Input
                          value={usernameValue}
                          onChange={(e) => setUsernameValue(e.target.value)}
                          error={usernameError || undefined}
                          className="max-w-xs"
                          disabled={updatingUsername}
                        />
                        <div className="flex items-center space-x-2 mt-2">
                          <Button
                            size="sm"
                            onClick={handleSaveUsername}
                            disabled={updatingUsername}
                          >
                            <Save className="w-4 h-4 mr-1" />
                            {updatingUsername ? 'Saving...' : 'Save'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancelEditUsername}
                            disabled={updatingUsername}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{user.username}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleStartEditUsername}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{user.email || 'Not set'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Stats */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Your Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalProcesses}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Processes</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{publicProcesses}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Public</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{offersCount}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Offers</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{activeCount}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Active</div>
              </div>
            </div>
            {user && (
              <div className="mt-4">
                <Link href={`/profile/${user.username}`}>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Public Profile
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Privacy & Anonymization */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Privacy & Anonymization</h2>
            {privacyError && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
                <p className="text-sm">{privacyError}</p>
              </div>
            )}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Anonymous Mode</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Hide your username on your public profile. "Anonymous User" will be shown instead.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAnonymous(!isAnonymous)}
                  disabled={updatingPrivacy}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isAnonymous ? 'bg-primary-600 dark:bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isAnonymous ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {isAnonymous && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Display Name (Optional)
                  </label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter a custom display name (optional)"
                    maxLength={100}
                    disabled={updatingPrivacy}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    If set, this name will be shown instead of "Anonymous User" when anonymous mode is enabled.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Enable Comments</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Allow others to post comments and questions on your public profile.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCommentsEnabled(!commentsEnabled)}
                  disabled={updatingPrivacy}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    commentsEnabled ? 'bg-primary-600 dark:bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      commentsEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Preview:</strong> Your public profile will show as{' '}
                  <strong>
                    {isAnonymous
                      ? (displayName.trim() || 'Anonymous User')
                      : user?.username}
                  </strong>
                  {isAnonymous && ' (Anonymous)'}
                </p>
              </div>

              <Button
                onClick={handleSavePrivacySettings}
                disabled={updatingPrivacy}
              >
                {updatingPrivacy ? 'Saving...' : 'Save Privacy Settings'}
              </Button>
            </div>
          </div>

          {/* Connected Accounts */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Connected Accounts</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">D</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Discord</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {user.discord_id ? 'Connected' : 'Not connected'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {user.discord_id ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />
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
                      <XCircle className="w-5 h-5 text-gray-400 dark:text-gray-500" />
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

