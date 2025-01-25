import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleSignInInitiated, setGoogleSignInInitiated] = useState(false);
  const navigate = useNavigate();
  const { signUp, signInWithGoogle } = useAuth();

  interface SignInResult {
    user: any; // Replace `any` with your user type if available
    additionalUserInfo?: {
      isNewUser: boolean;
    };
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!role) {
      toast.error('Please select a role');
      return;
    }

    if (!googleSignInInitiated) {
      if (password !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      try {
        setLoading(true);
        await signUp(email, password);
        navigate('/dashboardEmployee');
      } catch (error) {
        setLoading(false);
        toast.error('Failed to create an account. Please try again.');
      }
    } else {
      // Handle Google sign-in redirection after role selection
      toast.success('Account successfully created with Google!');
      navigate('/dashboardEmployee');
    }
  };

  
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
  
      // Explicitly type the result
      const result: SignInResult = await signInWithGoogle();
  
      // Check if the user is new
      const isNewUser = result?.additionalUserInfo?.isNewUser;
  
      if (isNewUser) {
        setGoogleSignInInitiated(true); // Show role dropdown for new users
      } else {
        // Redirect existing user directly to dashboard
        navigate('/dashboardEmployee');
      }
    } catch (error) {
      setLoading(false);
      setGoogleSignInInitiated(false);
      toast.error('Google sign-in failed. Please try again.');
    }
  };
  

  return (
    <div className="min-h-screen bg-black pb-10">
      <Navbar />
      <div className="pt-24 flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8 bg-zinc-900/50 p-8 rounded-xl border border-zinc-800">
          <div>
            <h2 className="text-3xl font-bold text-center mb-2">Create Account</h2>
            <p className="text-center text-gray-400">
              Start your productivity journey today
            </p>
          </div>
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {!googleSignInInitiated && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    className="input-field"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    className="input-field"
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium mb-2"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    className="input-field"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Role Dropdown */}
            {googleSignInInitiated || !googleSignInInitiated ? (
              <div className="space-y-4">
                <label htmlFor="role" className="block text-sm font-medium mb-2">
                  Select Role
                </label>
                <select
                  id="role"
                  required
                  className="input-field"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="" disabled>
                    Choose a role
                  </option>
                  <option value="Company">Company</option>
                  <option value="Project Manager">Project Manager</option>
                  <option value="Employee">Employee</option>
                </select>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50"
            >
              {loading ? 'Processing...' : googleSignInInitiated ? 'Proceed' : 'Create Account'}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-zinc-900/50 text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading || googleSignInInitiated}
              className="w-full flex items-center justify-center gap-2 btn-secondary disabled:opacity-50"
            >
              <FcGoogle className="w-5 h-5" />
              {loading ? 'Signing in...' : 'Google'}
            </button>

            {!googleSignInInitiated && (
              <p className="text-center text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-indigo-400 hover:text-indigo-300">
                  Sign in
                </Link>
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
