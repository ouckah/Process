'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { authApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { Loader2, User, Mail, CheckCircle, XCircle, Edit, Save, X, ExternalLink, Eye, EyeOff, MessageSquare, Shield, Bell } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const { user, loading: authLoading, isAuthenticated, updateProfile, refreshUser } = useAuth();
  const router = useRouter();
  const [disconnecting, setDisconnecting] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameValue, setUsernameValue] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [updatingUsername, setUpdatingUsername] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);
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
      setEmailNotificationsEnabled(user.email_notifications_enabled !== false); // Default to true
    }
  }, [user]);

  // Refresh user data when component mounts to ensure we have latest avatar info
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      refreshUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading]);

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


  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50 dark:bg-ink-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
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
        email_notifications_enabled: emailNotificationsEnabled,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to update privacy settings. Please try again.';
      setPrivacyError(errorMessage);
    } finally {
      setUpdatingPrivacy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream-50 dark:bg-ink-950">
      <Header />
      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="mb-4">
            <div className="inline-block bg-ink-900 dark:bg-cream-50 px-4 py-1 border-4 border-ink-900 dark:border-cream-50 transform rotate-1">
              <h1 className="font-display text-2xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
                Profile Settings
              </h1>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-3 translate-y-3 group-hover:translate-x-4 group-hover:translate-y-4 transition-transform"></div>
            <div className="relative bg-cream-50 dark:bg-ink-900 border-4 border-ink-900 dark:border-cream-50 p-8 transform -rotate-1 group-hover:rotate-0 transition-transform">
              <div className="flex items-center space-x-6">
                <div className="relative flex-shrink-0">
                  <Avatar
                    discordAvatar={user?.discord_avatar}
                    discordId={user?.discord_id}
                    username={user?.username || ''}
                    size="xl"
                  />
                </div>
                <div className="flex-1">
                  <div className="inline-block bg-ink-900 dark:bg-cream-50 px-4 py-2 border-4 border-ink-900 dark:border-cream-50 transform -rotate-1">
                    <p className="font-display text-xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
                      Manage your account settings
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Account Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-12"
        >
          <div className="relative group">
            <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform"></div>
            <div className="relative bg-cream-50 dark:bg-ink-900 border-4 border-ink-900 dark:border-cream-50 p-8 transform rotate-1 group-hover:rotate-0 transition-transform">
              <div className="flex items-center justify-between mb-6">
                <div className="inline-block bg-ink-900 dark:bg-cream-50 px-4 py-1 border-4 border-ink-900 dark:border-cream-50 transform -rotate-1">
                  <h2 className="font-display text-xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
                    Account Information
                  </h2>
                </div>
                {user && (
                  <Link href={`/profile/${user.username}`}>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button variant="outline" size="sm" className="border-2 border-ink-900 dark:border-cream-50 font-black uppercase tracking-wider">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Public Profile
                      </Button>
                    </motion.div>
                  </Link>
                )}
              </div>
              
              <div className="space-y-6">
                {/* Username */}
                <div className="flex items-start space-x-4">
                  <div className="bg-indigo-600 dark:bg-indigo-500 p-3 border-2 border-ink-900 dark:border-cream-50 transform rotate-1">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-ink-900 dark:bg-cream-50 px-3 py-1 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1 inline-block mb-3">
                      <p className="font-body text-xs font-black uppercase tracking-wider text-cream-50 dark:text-ink-900">
                        Username
                      </p>
                    </div>
                    {isEditingUsername ? (
                      <div className="space-y-3">
                        <Input
                          value={usernameValue}
                          onChange={(e) => setUsernameValue(e.target.value)}
                          error={usernameError || undefined}
                          className="max-w-xs"
                          disabled={updatingUsername}
                        />
                        {usernameError && (
                          <div className="relative group">
                            <div className="absolute inset-0 bg-red-600 dark:bg-red-500 translate-x-1 translate-y-1"></div>
                            <div className="relative bg-red-600 dark:bg-red-500 border-2 border-ink-900 dark:border-cream-50 p-3 transform rotate-1">
                              <p className="font-body text-sm font-black uppercase tracking-wider text-white">{usernameError}</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center space-x-3">
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              size="sm"
                              onClick={handleSaveUsername}
                              disabled={updatingUsername}
                              className="border-2 border-ink-900 dark:border-cream-50 font-black uppercase tracking-wider"
                            >
                              <Save className="w-4 h-4 mr-1" />
                              {updatingUsername ? 'Saving...' : 'Save'}
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCancelEditUsername}
                              disabled={updatingUsername}
                              className="border-2 border-ink-900 dark:border-cream-50 font-black uppercase tracking-wider"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <p className="font-display text-xl font-black text-ink-900 dark:text-cream-50 uppercase tracking-tight">{user.username}</p>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleStartEditUsername}
                            className="border-2 border-ink-900 dark:border-cream-50 font-black uppercase tracking-wider"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start space-x-4 pt-6 border-t-4 border-ink-900 dark:border-cream-50">
                  <div className="bg-indigo-600 dark:bg-indigo-500 p-3 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-ink-900 dark:bg-cream-50 px-3 py-1 border-2 border-ink-900 dark:border-cream-50 transform rotate-1 inline-block mb-3">
                      <p className="font-body text-xs font-black uppercase tracking-wider text-cream-50 dark:text-ink-900">
                        Email
                      </p>
                    </div>
                    <p className="font-display text-xl font-black text-ink-900 dark:text-cream-50 uppercase tracking-tight">{user.email || 'Not set'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Privacy & Anonymization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-12"
        >
          <div className="relative group">
            <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform"></div>
            <div className="relative bg-cream-50 dark:bg-ink-900 border-4 border-ink-900 dark:border-cream-50 p-8 transform -rotate-1 group-hover:rotate-0 transition-transform">
              <div className="inline-block bg-ink-900 dark:bg-cream-50 px-4 py-1 border-4 border-ink-900 dark:border-cream-50 transform rotate-1 mb-6">
                <h2 className="font-display text-xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
                  Privacy & Anonymization
                </h2>
              </div>

              {privacyError && (
                <div className="relative group mb-6">
                  <div className="absolute inset-0 bg-red-600 dark:bg-red-500 translate-x-1 translate-y-1"></div>
                  <div className="relative bg-red-600 dark:bg-red-500 border-2 border-ink-900 dark:border-cream-50 p-4 transform -rotate-1">
                    <p className="font-body text-sm font-black uppercase tracking-wider text-white">{privacyError}</p>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {/* Anonymous Mode Toggle */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-1 translate-y-1"></div>
                  <div className="relative bg-cream-100 dark:bg-ink-800 border-4 border-ink-900 dark:border-cream-50 p-6 transform rotate-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="bg-indigo-600 dark:bg-indigo-500 p-3 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1">
                          <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="bg-ink-900 dark:bg-cream-50 px-3 py-1 border-2 border-ink-900 dark:border-cream-50 transform rotate-1 inline-block mb-2">
                            <p className="font-body text-sm font-black uppercase tracking-wider text-cream-50 dark:text-ink-900">
                              Anonymous Mode
                            </p>
                          </div>
                          <p className="font-body text-xs font-bold uppercase tracking-wider text-ink-700 dark:text-ink-300">
                            Hide your username on your public profile
                          </p>
                        </div>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsAnonymous(!isAnonymous)}
                        disabled={updatingPrivacy}
                        className={`relative inline-flex h-8 w-14 items-center border-4 border-ink-900 dark:border-cream-50 transition-colors ${
                          isAnonymous ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-ink-300 dark:bg-ink-700'
                        }`}
                      >
                        <motion.span
                          animate={{ x: isAnonymous ? 24 : 4 }}
                          className="inline-block h-6 w-6 bg-white border-2 border-ink-900 dark:border-cream-50"
                        />
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Display Name Input */}
                {isAnonymous && (
                  <div className="space-y-3">
                    <div className="bg-ink-900 dark:bg-cream-50 px-3 py-1 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1 inline-block">
                      <label className="font-body text-sm font-black uppercase tracking-wider text-cream-50 dark:text-ink-900">
                        Display Name (Optional)
                      </label>
                    </div>
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter a custom display name (optional)"
                      maxLength={100}
                      disabled={updatingPrivacy}
                    />
                    <div className="bg-ink-900 dark:bg-cream-50 px-3 py-1 border-2 border-ink-900 dark:border-cream-50 transform rotate-1 inline-block">
                      <p className="font-body text-xs font-black uppercase tracking-wider text-cream-50 dark:text-ink-900">
                        Shown instead of "Anonymous User"
                      </p>
                    </div>
                  </div>
                )}

                {/* Comments Toggle */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-1 translate-y-1"></div>
                  <div className="relative bg-cream-100 dark:bg-ink-800 border-4 border-ink-900 dark:border-cream-50 p-6 transform -rotate-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="bg-indigo-600 dark:bg-indigo-500 p-3 border-2 border-ink-900 dark:border-cream-50 transform rotate-1">
                          <MessageSquare className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="bg-ink-900 dark:bg-cream-50 px-3 py-1 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1 inline-block mb-2">
                            <p className="font-body text-sm font-black uppercase tracking-wider text-cream-50 dark:text-ink-900">
                              Enable Comments
                            </p>
                          </div>
                          <p className="font-body text-xs font-bold uppercase tracking-wider text-ink-700 dark:text-ink-300">
                            Allow comments on your public profile
                          </p>
                        </div>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setCommentsEnabled(!commentsEnabled)}
                        disabled={updatingPrivacy}
                        className={`relative inline-flex h-8 w-14 items-center border-4 border-ink-900 dark:border-cream-50 transition-colors ${
                          commentsEnabled ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-ink-300 dark:bg-ink-700'
                        }`}
                      >
                        <motion.span
                          animate={{ x: commentsEnabled ? 24 : 4 }}
                          className="inline-block h-6 w-6 bg-white border-2 border-ink-900 dark:border-cream-50"
                        />
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Email Notifications Toggle */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-1 translate-y-1"></div>
                  <div className="relative bg-cream-100 dark:bg-ink-800 border-4 border-ink-900 dark:border-cream-50 p-6 transform rotate-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="bg-indigo-600 dark:bg-indigo-500 p-3 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1">
                          <Bell className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="bg-ink-900 dark:bg-cream-50 px-3 py-1 border-2 border-ink-900 dark:border-cream-50 transform rotate-1 inline-block mb-2">
                            <p className="font-body text-sm font-black uppercase tracking-wider text-cream-50 dark:text-ink-900">
                              Email Notifications
                            </p>
                          </div>
                          <p className="font-body text-xs font-bold uppercase tracking-wider text-ink-700 dark:text-ink-300">
                            Receive email notifications for comments and questions
                          </p>
                        </div>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setEmailNotificationsEnabled(!emailNotificationsEnabled)}
                        disabled={updatingPrivacy}
                        className={`relative inline-flex h-8 w-14 items-center border-4 border-ink-900 dark:border-cream-50 transition-colors ${
                          emailNotificationsEnabled ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-ink-300 dark:bg-ink-700'
                        }`}
                      >
                        <motion.span
                          animate={{ x: emailNotificationsEnabled ? 24 : 4 }}
                          className="inline-block h-6 w-6 bg-white border-2 border-ink-900 dark:border-cream-50"
                        />
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-indigo-600 dark:bg-indigo-500 translate-x-1 translate-y-1"></div>
                  <div className="relative bg-indigo-600 dark:bg-indigo-500 border-4 border-ink-900 dark:border-cream-50 p-4 transform rotate-1">
                    <div className="bg-ink-900 dark:bg-cream-50 px-3 py-1 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1 inline-block mb-3">
                      <p className="font-body text-xs font-black uppercase tracking-wider text-cream-50 dark:text-ink-900">
                        Preview
                      </p>
                    </div>
                    <p className="font-body text-sm font-black uppercase tracking-wider text-white">
                      Your public profile will show as{' '}
                      <strong>
                        {isAnonymous
                          ? (displayName.trim() || 'Anonymous User')
                          : user?.username}
                      </strong>
                      {isAnonymous && ' (Anonymous)'}
                    </p>
                  </div>
                </div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={handleSavePrivacySettings}
                    disabled={updatingPrivacy}
                    className="border-2 border-ink-900 dark:border-cream-50 font-black uppercase tracking-wider"
                  >
                    {updatingPrivacy ? 'Saving...' : 'Save Privacy Settings'}
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Connected Accounts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="relative group">
            <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform"></div>
            <div className="relative bg-cream-50 dark:bg-ink-900 border-4 border-ink-900 dark:border-cream-50 p-8 transform rotate-1 group-hover:rotate-0 transition-transform">
              <div className="inline-block bg-ink-900 dark:bg-cream-50 px-4 py-1 border-4 border-ink-900 dark:border-cream-50 transform -rotate-1 mb-6">
                <h2 className="font-display text-xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
                  Connected Accounts
                </h2>
              </div>

              {/* Discord */}
              <div className="relative group">
                <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-1 translate-y-1"></div>
                <div className="relative bg-cream-100 dark:bg-ink-800 border-4 border-ink-900 dark:border-cream-50 p-6 transform -rotate-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-indigo-600 dark:bg-indigo-500 w-12 h-12 border-4 border-ink-900 dark:border-cream-50 transform rotate-1 flex items-center justify-center">
                        <span className="text-white font-black text-xl">D</span>
                      </div>
                      <div>
                        <div className="bg-ink-900 dark:bg-cream-50 px-3 py-1 border-2 border-ink-900 dark:border-cream-50 transform rotate-1 inline-block mb-2">
                          <p className="font-body text-sm font-black uppercase tracking-wider text-cream-50 dark:text-ink-900">
                            Discord
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {user.discord_id ? (
                            <div className="bg-green-600 dark:bg-green-500 px-3 py-1 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1 inline-flex items-center space-x-2">
                              <CheckCircle className="w-4 h-4 text-white" />
                              <span className="font-body text-xs font-black uppercase tracking-wider text-white">Connected</span>
                            </div>
                          ) : (
                            <div className="bg-ink-900 dark:bg-cream-50 px-3 py-1 border-2 border-ink-900 dark:border-cream-50 transform rotate-1 inline-flex items-center space-x-2">
                              <XCircle className="w-4 h-4 text-cream-50 dark:text-ink-900" />
                              <span className="font-body text-xs font-black uppercase tracking-wider text-cream-50 dark:text-ink-900">Not Connected</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      {user.discord_id ? (
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDiscordDisconnect}
                            disabled={disconnecting}
                            className="border-2 border-red-600 dark:border-red-500 text-red-600 dark:text-red-400 font-black uppercase tracking-wider"
                          >
                            {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                          </Button>
                        </motion.div>
                      ) : (
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            size="sm"
                            onClick={handleDiscordConnect}
                            className="border-2 border-ink-900 dark:border-cream-50 font-black uppercase tracking-wider"
                          >
                            Connect Discord
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
