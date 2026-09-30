import React, { useState, useEffect } from 'react';
import { useAuth, useApp } from '../context/AppContext';
import {
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  User,
  GraduationCap,
  Building,
  KeyRound,
  Bookmark,
} from 'lucide-react';
import { KitsLogo } from '../components/KitsLogo';

interface SignInPageProps {
  onNavigate: (page: string, filterParam?: string) => void;
  onNavigateWishlist?: (highlightProjectId?: string) => void;
}

export const SignInPage: React.FC<SignInPageProps> = ({ onNavigate, onNavigateWishlist }) => {
  const {
    currentUser,
    isAuthenticated,
    isLoadingAuth,
    signIn,
    registerAccount,
    setupPassword,
    signOut,
  } = useAuth();
  const { saveToWishlist } = useApp();

  // Mode: 'login' | 'register' | 'setup-password'
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'setup-password'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Registration form state (Exact 5 fields in order: Email, Full Name, Branch, Roll Number, Password)
  const [regEmail, setRegEmail] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regBranch, setRegBranch] = useState('cse');
  const [regRollNumber, setRegRollNumber] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Setup password state
  const [setupIdentifier, setSetupIdentifier] = useState('');
  const [setupNewPassword, setSetupNewPassword] = useState('');
  const [showSetupPassword, setShowSetupPassword] = useState(false);

  // Feedback state
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Branch options
  const collegeBranches = [
    { id: 'cse', name: 'Computer Science and Engineering (CSE)' },
    { id: 'aiml', name: 'Artificial Intelligence and Machine Learning (AI & ML)' },
    { id: 'ece', name: 'Electronics and Communication Engineering (ECE)' },
    { id: 'eee', name: 'Electrical and Electronics Engineering (EEE)' },
    { id: 'me', name: 'Mechanical Engineering (ME)' },
    { id: 'it', name: 'Information Technology (IT)' },
    { id: 'csd', name: 'CSE Data Science (CSD)' },
    { id: 'civil', name: 'Civil Engineering (CIVIL)' },
  ];

  const checkAndRedirectWishlist = async () => {
    const pendingId = typeof window !== 'undefined'
      ? sessionStorage.getItem('kits_pending_wishlist_id')
      : null;

    if (pendingId) {
      try {
        sessionStorage.removeItem('kits_pending_wishlist_id');
        await saveToWishlist(pendingId);
        if (onNavigateWishlist) {
          onNavigateWishlist(pendingId);
          return true;
        }
      } catch (e) {
        console.warn('Auto-save wishlist failed:', e);
      }
    }
    return false;
  };

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      checkAndRedirectWishlist().then((handled) => {
        if (handled) {
          // Redirect handled by onNavigateWishlist
        }
      });
    }
  }, [isAuthenticated, currentUser]);

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      setAuthError('Please provide both email and password.');
      return;
    }

    setAuthError(null);
    setAuthSuccess(null);
    setIsSubmitting(true);

    try {
      await signIn(loginEmail.trim(), loginPassword);
      setAuthSuccess('Login successful! Redirecting...');
      setTimeout(async () => {
        const handled = await checkAndRedirectWishlist();
        if (!handled) {
          onNavigate('my-group');
        }
      }, 400);
    } catch (err: any) {
      setAuthError(err.message || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail.trim() || !regFullName.trim() || !regRollNumber.trim() || !regPassword) {
      setAuthError('Please fill in all five required registration fields.');
      return;
    }

    setAuthError(null);
    setAuthSuccess(null);
    setIsSubmitting(true);

    try {
      await registerAccount({
        email: regEmail.trim(),
        fullName: regFullName.trim(),
        branch: regBranch,
        rollNumber: regRollNumber.trim().toUpperCase(),
        password: regPassword,
      });
      setAuthSuccess('Registration successful! Opening student dashboard...');
      setTimeout(async () => {
        const handled = await checkAndRedirectWishlist();
        if (!handled) {
          onNavigate('my-group');
        }
      }, 400);
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Setup Password Submit
  const handleSetupPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupIdentifier.trim() || !setupNewPassword) {
      setAuthError('Please provide your email/roll number and new password.');
      return;
    }

    setAuthError(null);
    setAuthSuccess(null);
    setIsSubmitting(true);

    try {
      if (setupPassword) {
        await setupPassword(setupIdentifier.trim(), setupNewPassword);
        setAuthSuccess('Password set successfully! You are now logged in.');
        setTimeout(async () => {
          const handled = await checkAndRedirectWishlist();
          if (!handled) {
            onNavigate('my-group');
          }
        }, 400);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Could not set password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If already authenticated, display current session status & quick navigation
  if (isAuthenticated && currentUser) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-[#EEF2F6] flex flex-col justify-center items-center py-12 px-4 sm:px-6">
        <div className="w-full max-w-md bg-white rounded-xl shadow-md border border-slate-200/80 p-8 space-y-6">
          <div className="flex items-center justify-center gap-3">
            <KitsLogo variant="mark" size="md" />
            <h1 className="text-xl sm:text-2xl font-bold font-heading text-[#112240] tracking-tight">
              KITS PROJECTHUB
            </h1>
          </div>

          <div className="text-center pt-2">
            <div className="w-16 h-16 rounded-full bg-[#0d6efd]/10 text-[#0d6efd] mx-auto flex items-center justify-center mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-[#112240]">Logged In Successfully</h2>
            <p className="text-xs text-slate-500 mt-1">{currentUser.email}</p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Full Name:</span>
              <span className="font-semibold text-slate-900">{currentUser.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Roll Number:</span>
              <span className="font-mono font-semibold text-[#0d6efd]">
                {currentUser.studentRollNumber || currentUser.rollNumber || 'Verified Student'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Department:</span>
              <span className="font-semibold text-slate-900">{currentUser.departmentName || (currentUser.departmentId ? currentUser.departmentId.toUpperCase() : 'CSE')}</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => onNavigate('my-group')}
              className="w-full py-2.5 px-4 rounded-lg bg-[#0d6efd] hover:bg-[#0b5ed7] text-white font-semibold text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0d6efd] focus:ring-offset-2"
            >
              Open Student Dashboard
            </button>
            <button
              onClick={() => onNavigate('explore')}
              className="w-full py-2.5 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm transition-colors"
            >
              Browse Projects Catalog
            </button>
            <button
              onClick={signOut}
              className="w-full py-2 px-4 rounded-lg text-rose-600 hover:bg-rose-50 font-medium text-xs transition-colors"
            >
              Logout of Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#EEF2F6] flex flex-col justify-center items-center py-10 px-4 sm:px-6">
      {/* Top Header: Logo beside exact heading KITS PROJECTHUB */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <KitsLogo variant="mark" size="lg" />
        <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#112240] tracking-tight uppercase">
          KITS PROJECTHUB
        </h1>
      </div>

      {/* Centered White Form Card */}
      <div className="w-full max-w-[440px] bg-white rounded-xl shadow-md border border-slate-200/80 p-6 sm:p-8">
        {/* Pending Wishlist Notice */}
        {typeof window !== 'undefined' && sessionStorage.getItem('kits_pending_wishlist_id') && (
          <div className="mb-5 p-3.5 bg-pink-50 border border-pink-200 rounded-lg text-xs text-[#CA0765] flex items-start gap-2.5 animate-fadeIn">
            <Bookmark className="w-4 h-4 text-[#CA0765] shrink-0 mt-0.5" />
            <div className="leading-snug font-medium">
              Sign in to save this project to your personal Wishlist. It will be added automatically upon successful sign-in.
            </div>
          </div>
        )}

        {/* Error Alert */}
        {authError && (
          <div
            role="alert"
            className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2.5 animate-fadeIn"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="leading-snug">{authError}</div>
          </div>
        )}

        {/* Success Alert */}
        {authSuccess && (
          <div
            role="alert"
            className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-start gap-2.5 animate-fadeIn"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="leading-snug">{authSuccess}</div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 1. LOGIN TO YOUR ACCOUNT FORM                                             */}
        {/* ========================================================================= */}
        {authMode === 'login' && (
          <div>
            <h2 className="text-2xl font-bold font-heading text-[#112240] text-center mb-6">
              Login to Your Account
            </h2>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Field 1: Username(Email) */}
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-sm font-semibold text-[#1e293b] mb-1.5"
                >
                  Username(Email)
                </label>
                <div className="flex rounded-md border border-slate-300 focus-within:ring-2 focus-within:ring-[#0d6efd] focus-within:border-[#0d6efd] overflow-hidden bg-white">
                  <span className="inline-flex items-center px-3 bg-slate-100 text-slate-500 border-r border-slate-300 text-sm select-none">
                    @
                  </span>
                  <input
                    id="login-email"
                    type="text"
                    required
                    autoComplete="username"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@kitsts.ac.in"
                    className="flex-1 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent"
                  />
                </div>
              </div>

              {/* Field 2: Password with Show/Hide */}
              <div>
                <label
                  htmlFor="login-password"
                  className="block text-sm font-semibold text-[#1e293b] mb-1.5"
                >
                  Password
                </label>
                <div className="relative rounded-md border border-slate-300 focus-within:ring-2 focus-within:ring-[#0d6efd] focus-within:border-[#0d6efd] overflow-hidden bg-white">
                  <input
                    id="login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Your Roll Number or Password"
                    className="w-full px-3 py-2.5 pr-10 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent"
                  />
                  <button
                    type="button"
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Full-width Blue Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || isLoadingAuth}
                  className="w-full py-2.5 px-4 rounded-md bg-[#0d6efd] hover:bg-[#0b5ed7] disabled:bg-blue-300 text-white font-semibold text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0d6efd] focus:ring-offset-2 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span>Signing in...</span>
                  ) : (
                    <span>Login</span>
                  )}
                </button>
              </div>
            </form>

            {/* Switch to Registration Link */}
            <div className="mt-6 text-center text-xs text-slate-600 space-y-2">
              <div>
                Don’t have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setAuthError(null);
                    setAuthSuccess(null);
                  }}
                  className="font-semibold text-[#0d6efd] hover:text-[#0b5ed7] hover:underline focus:outline-none"
                >
                  Register
                </button>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('setup-password');
                    setAuthError(null);
                    setAuthSuccess(null);
                  }}
                  className="text-[11px] text-slate-500 hover:text-[#0d6efd] hover:underline"
                >
                  Existing student without a password? Set Password
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. CREATE YOUR ACCOUNT FORM (Exact 5 Fields)                                */}
        {/* ========================================================================= */}
        {authMode === 'register' && (
          <div>
            <h2 className="text-2xl font-bold font-heading text-[#112240] text-center mb-6">
              Create Your Account
            </h2>

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {/* Field 1: Email */}
              <div>
                <label
                  htmlFor="reg-email"
                  className="block text-xs font-semibold text-[#1e293b] mb-1"
                >
                  1. Email *
                </label>
                <div className="flex rounded-md border border-slate-300 focus-within:ring-2 focus-within:ring-[#0d6efd] focus-within:border-[#0d6efd] overflow-hidden bg-white">
                  <span className="inline-flex items-center px-2.5 bg-slate-100 text-slate-500 border-r border-slate-300 text-xs select-none">
                    @
                  </span>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="student.name@kitsts.ac.in"
                    className="flex-1 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent"
                  />
                </div>
              </div>

              {/* Field 2: Full Name */}
              <div>
                <label
                  htmlFor="reg-fullname"
                  className="block text-xs font-semibold text-[#1e293b] mb-1"
                >
                  2. Full Name *
                </label>
                <div className="relative rounded-md border border-slate-300 focus-within:ring-2 focus-within:ring-[#0d6efd] focus-within:border-[#0d6efd] overflow-hidden bg-white">
                  <input
                    id="reg-fullname"
                    type="text"
                    required
                    autoComplete="name"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="e.g. A. Rahul"
                    className="w-full px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent"
                  />
                </div>
              </div>

              {/* Field 3: Branch (Dropdown) */}
              <div>
                <label
                  htmlFor="reg-branch"
                  className="block text-xs font-semibold text-[#1e293b] mb-1"
                >
                  3. Branch *
                </label>
                <select
                  id="reg-branch"
                  required
                  value={regBranch}
                  onChange={(e) => setRegBranch(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0d6efd] focus:border-[#0d6efd]"
                >
                  {collegeBranches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Field 4: Roll Number */}
              <div>
                <label
                  htmlFor="reg-roll"
                  className="block text-xs font-semibold text-[#1e293b] mb-1"
                >
                  4. Roll Number *
                </label>
                <input
                  id="reg-roll"
                  type="text"
                  required
                  value={regRollNumber}
                  onChange={(e) => setRegRollNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. 21B91A0501"
                  className="w-full px-3 py-2 text-xs font-mono font-semibold uppercase rounded-md border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d6efd] focus:border-[#0d6efd]"
                />
              </div>

              {/* Field 5: Password with Show/Hide */}
              <div>
                <label
                  htmlFor="reg-password"
                  className="block text-xs font-semibold text-[#1e293b] mb-1"
                >
                  5. Password *
                </label>
                <div className="relative rounded-md border border-slate-300 focus-within:ring-2 focus-within:ring-[#0d6efd] focus-within:border-[#0d6efd] overflow-hidden bg-white">
                  <input
                    id="reg-password"
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    minLength={4}
                    autoComplete="new-password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Enter password (e.g. Roll Number)"
                    className="w-full px-3 py-2 pr-10 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent"
                  />
                  <button
                    type="button"
                    aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Full-width Blue Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || isLoadingAuth}
                  className="w-full py-2.5 px-4 rounded-md bg-[#0d6efd] hover:bg-[#0b5ed7] disabled:bg-blue-300 text-white font-semibold text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0d6efd] focus:ring-offset-2 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span>Registering...</span>
                  ) : (
                    <span>Register</span>
                  )}
                </button>
              </div>
            </form>

            {/* Switch to Login Link */}
            <div className="mt-5 text-center text-xs text-slate-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError(null);
                  setAuthSuccess(null);
                }}
                className="font-semibold text-[#0d6efd] hover:text-[#0b5ed7] hover:underline focus:outline-none"
              >
                Login
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. SET PASSWORD FOR PRE-EXISTING ACCOUNTS                                */}
        {/* ========================================================================= */}
        {authMode === 'setup-password' && (
          <div>
            <h2 className="text-xl font-bold font-heading text-[#112240] text-center mb-2">
              Set Account Password
            </h2>
            <p className="text-xs text-slate-500 text-center mb-5">
              Enter your college email or roll number to set your Argon2id password.
            </p>

            <form onSubmit={handleSetupPasswordSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="setup-id"
                  className="block text-xs font-semibold text-[#1e293b] mb-1"
                >
                  Email Address or Roll Number
                </label>
                <input
                  id="setup-id"
                  type="text"
                  required
                  value={setupIdentifier}
                  onChange={(e) => setSetupIdentifier(e.target.value)}
                  placeholder="23B91A0501"
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d6efd]"
                />
              </div>

              <div>
                <label
                  htmlFor="setup-pwd"
                  className="block text-xs font-semibold text-[#1e293b] mb-1"
                >
                  New Password
                </label>
                <div className="relative rounded-md border border-slate-300 focus-within:ring-2 focus-within:ring-[#0d6efd] overflow-hidden bg-white">
                  <input
                    id="setup-pwd"
                    type={showSetupPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={setupNewPassword}
                    onChange={(e) => setSetupNewPassword(e.target.value)}
                    placeholder="Enter at least 6 characters"
                    className="w-full px-3 py-2 pr-10 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSetupPassword(!showSetupPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showSetupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-md bg-[#0d6efd] hover:bg-[#0b5ed7] text-white font-semibold text-xs uppercase tracking-wider transition-colors shadow-sm"
              >
                {isSubmitting ? 'Updating...' : 'Set Password & Sign In'}
              </button>
            </form>

            <div className="mt-5 text-center text-xs text-slate-600">
              Back to{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError(null);
                  setAuthSuccess(null);
                }}
                className="font-semibold text-[#0d6efd] hover:underline"
              >
                Login
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Institutional Footer Notice */}
      <div className="mt-8 text-center text-xs text-slate-500 max-w-sm">
        Kamala Institute of Technology &amp; Science (KITS) Singapur · Huzurabad, Karimnagar
      </div>
    </div>
  );
};
