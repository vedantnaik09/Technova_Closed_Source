import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function Login() {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="pt-24 flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8 bg-zinc-900/50 p-8 rounded-xl border border-zinc-800">
          <div>
            <h2 className="text-3xl font-bold text-center mb-2">Welcome Back</h2>
            <p className="text-center text-gray-400">
              Log in to access your workspace
            </p>
          </div>
          <form className="mt-8 space-y-6">
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
                  placeholder="Enter your email"
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
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-600"
                />
                <label htmlFor="remember-me" className="ml-2 text-sm">
                  Remember me
                </label>
              </div>
              <a href="#" className="text-sm text-indigo-400 hover:text-indigo-300">
                Forgot password?
              </a>
            </div>

            <button type="submit" className="w-full btn-primary">
              Sign In
            </button>

            <p className="text-center text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-indigo-400 hover:text-indigo-300">
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}