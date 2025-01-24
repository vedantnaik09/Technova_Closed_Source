import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function Register() {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="pt-24 flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8 bg-zinc-900/50 p-8 rounded-xl border border-zinc-800">
          <div>
            <h2 className="text-3xl font-bold text-center mb-2">Create Account</h2>
            <p className="text-center text-gray-400">
              Start your productivity journey today
            </p>
          </div>
          <form className="mt-8 space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium mb-2">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    required
                    className="input-field"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium mb-2">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    required
                    className="input-field"
                    placeholder="Doe"
                  />
                </div>
              </div>
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
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  className="input-field"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                type="checkbox"
                required
                className="h-4 w-4 rounded border-gray-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-600"
              />
              <label htmlFor="terms" className="ml-2 text-sm">
                I agree to the{' '}
                <a href="#" className="text-indigo-400 hover:text-indigo-300">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-indigo-400 hover:text-indigo-300">
                  Privacy Policy
                </a>
              </label>
            </div>

            <button type="submit" className="w-full btn-primary">
              Create Account
            </button>

            <p className="text-center text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-400 hover:text-indigo-300">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}