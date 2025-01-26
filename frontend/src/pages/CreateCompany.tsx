import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';

const CreateCompany: React.FC = () => {
  const [companyName, setCompanyName] = useState('');
  const [companyDomain, setCompanyDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
      toast.error('Please log in first');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/users/create-company`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name: companyName, 
          domain: companyDomain 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create company');
      }

      const data = await response.json();

      // Update user in localStorage to reflect new role and companyId
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = {
        ...currentUser,
        role: 'COMPANY_OWNER',
        companyId: data.company._id
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      toast.success('Company created successfully!');
      navigate('/dashboard'); // Redirect to dashboard
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black pb-10">
      <Navbar />
      <div className="pt-24 flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8 bg-zinc-900/50 p-8 rounded-xl border border-zinc-800">
          <div>
            <h2 className="text-3xl font-bold text-center mb-2">
              Create Your Company
            </h2>
            <p className="text-center text-gray-400">
              Set up your company profile
            </p>
          </div>
          <form onSubmit={handleCreateCompany} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label 
                  htmlFor="companyName" 
                  className="block text-sm font-medium mb-2"
                >
                  Company Name
                </label>
                <input
                  id="companyName"
                  type="text"
                  required
                  className="input-field"
                  placeholder="Enter company name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <div>
                <label 
                  htmlFor="companyDomain" 
                  className="block text-sm font-medium mb-2"
                >
                  Company Domain
                </label>
                <input
                  id="companyDomain"
                  type="text"
                  required
                  className="input-field"
                  placeholder="Enter company domain"
                  value={companyDomain}
                  onChange={(e) => setCompanyDomain(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50"
            >
              {loading ? "Creating Company..." : "Create Company"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCompany;