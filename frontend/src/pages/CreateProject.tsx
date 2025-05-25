import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';

const CreateProject: React.FC = () => {
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectManager, setProjectManager] = useState('');
  const [projectManagers, setProjectManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch project managers when component mounts
  useEffect(() => {
    const fetchProjectManagers = async () => {
      const token = localStorage.getItem('token');
 
      try {
        const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/projects/project-managers`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
  
        if (!response.ok) {
          throw new Error('Failed to fetch project managers');
        }
  
        const data = await response.json();
  
        // Assuming the API returns an array directly
        console.log('data', data); // Verify the structure
        setProjectManagers(data); // Update with the correct structure
      } catch (error: any) {
        toast.error(error.message);
      }
    };
  
    fetchProjectManagers();
  }, []);
  

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token) {
      toast.error('Please log in first');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/projects/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name: projectName, 
          description: projectDescription,
          projectManagerId: projectManager,
          companyId: user.companyId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create project');
      }

      toast.success('Project created successfully!');
      navigate('/projects'); // Redirect to projects list
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
              Create New Project
            </h2>
            <p className="text-center text-gray-400">
              Set up your project details
            </p>
          </div>
          <form onSubmit={handleCreateProject} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label 
                  htmlFor="projectName" 
                  className="block text-sm font-medium mb-2"
                >
                  Project Name
                </label>
                <input
                  id="projectName"
                  type="text"
                  required
                  className="input-field"
                  placeholder="Enter project name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>
              <div>
                <label 
                  htmlFor="projectDescription" 
                  className="block text-sm font-medium mb-2"
                >
                  Project Description
                </label>
                <textarea
                  id="projectDescription"
                  required
                  className="input-field"
                  placeholder="Describe your project"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                />
              </div>
              <div>
                <label 
                  htmlFor="projectManager" 
                  className="block text-sm font-medium mb-2"
                >
                  Assign Project Manager
                </label>
                <select
  id="projectManager"
  required
  className="input-field"
  value={projectManager}
  onChange={(e) => setProjectManager(e.target.value)}
>
  <option value="" disabled>Select Project Manager</option>
  {projectManagers && projectManagers.length > 0 ? (
    projectManagers.map((manager) => (
      <option key={manager._id} value={manager._id}>
        {manager.profile.firstName} {manager.profile.lastName}
      </option>
    ))
  ) : (
    <option disabled>Loading Project Managers...</option>
  )}
</select>

              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50"
            >
              {loading ? "Creating Project..." : "Create Project"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateProject;