import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

interface Employee {
  _id: string;
  profile: {
    firstName: string;
    lastName: string;
  };
  email: string;
}

interface Project {
  _id: string;
  name: string;
}

const AddProjectEmployee: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      const token = localStorage.getItem('token');
  
      try {
        // Fetch projects
        const projectsResponse = await fetch(`${import.meta.env.VITE_BASE_URL}/api/projects`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
  
        if (!projectsResponse.ok) {
          throw new Error('Failed to fetch projects');
        }
  
        const projectsData = await projectsResponse.json();
        setProjects(projectsData.projects);
        setLoading(false);
      } catch (error: any) {
        toast.error(error.message);
        setLoading(false);
      }
    };
  
    fetchInitialData();
  }, []);
  
  useEffect(() => {
    const fetchEmployees = async () => {
      const token = localStorage.getItem('token');
  
      try {
        const employeesResponse = await fetch(
          `${import.meta.env.VITE_BASE_URL}/api/companies/employees`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
  
        if (!employeesResponse.ok) {
          throw new Error('Failed to fetch employees');
        }
  
        const employeesData = await employeesResponse.json();
        setEmployees(employeesData.employees);
      } catch (error: any) {
        toast.error(error.message);
      }
    };
  
    fetchEmployees();
  }, []); // Fetch employees once on component mount
  

  const handleAddEmployee = async () => {
    if (!selectedProjectId || !selectedEmployeeId) {
      toast.error('Please select both a project and an employee');
      return;
    }

    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/projects/add-member`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          projectId: selectedProjectId,
          userId: selectedEmployeeId 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add employee to project');
      }

      toast.success('Employee added to project successfully');
      // Reset selections
      setSelectedEmployeeId('');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-10">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-white mb-6">
          Add Employee to Project
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-white mb-2">Select Project</label>
            <select 
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full bg-zinc-900 text-white p-3 rounded-xl"
            >
              <option value="">Choose a Project</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-white mb-2">Select Employee</label>
            <select 
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full bg-zinc-900 text-white p-3 rounded-xl"
              disabled={!selectedProjectId}
            >
              <option value="">Choose an Employee</option>
              {employees.map((employee) => (
                <option key={employee._id} value={employee._id}>
                  {employee.profile.firstName} {employee.profile.lastName} - {employee.email}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleAddEmployee}
            disabled={!selectedProjectId || !selectedEmployeeId}
            className="w-full bg-green-600 text-white p-3 rounded-xl 
              hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            Add Employee to Project
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddProjectEmployee;