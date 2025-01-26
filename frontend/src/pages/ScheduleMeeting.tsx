import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Moderator from '../pages/Moderator';

interface User {
  _id: string;
  profile: {
    firstName: string;
    lastName: string;
  };
}

const ScheduleMeeting: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [employees, setEmployees] = useState<User[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [meetingShortId, setMeetingShortId] = useState<string>('');
  const navigate = useNavigate();

  const generateShortId = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 5; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  useEffect(() => {
    // Fetch projects for project manager
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://172.31.0.36:5000/api/projects', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }

        
        const data = await response.json();
        console.log(data);
        setProjects(data.projects);
      } catch (error) {
        toast.error('Failed to load projects');
      }
    };

    fetchProjects();
    
    // Generate meeting short ID
    setMeetingShortId(generateShortId());
  }, []);

  const fetchProjectEmployees = async (projectId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://172.31.0.36:5000/api/projects/employees/${projectId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch project employees');
      }
      
      const data = await response.json();
      console.log(data);
      setEmployees(data.employees);
    } catch (error) {
      toast.error('Failed to load project employees');
    }
  };

  const handleProjectSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const projectId = e.target.value;
    setSelectedProject(projectId);
    fetchProjectEmployees(projectId);
  };

  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      const userId = user ? JSON.parse(user).id : '';
      const roomId = meetingShortId;
      const response = await fetch('http://172.31.0.36:5000/api/meetings/schedule', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId:userId,
          roomId: roomId,
          projectId: selectedProject,
          participants: selectedEmployees,
          audioUrl: '', // You can modify this as needed
          timestamps: [], // You can modify this as needed
          isLast: false // You can modify this as needed
        })
      });
    if (!response.ok) {
      throw new Error('Failed to schedule meeting');
    }

    // Call the Moderator component and pass roomId as a prop
    navigate(`/moderator?id=${roomId}`, { state: { roomId, initiate: true } });
    //   const data = await response.json();
      toast.success('Meeting scheduled successfully');
    } catch (error) {
      toast.error('Failed to schedule meeting');
    }
  };

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-md mx-auto bg-zinc-900/50 p-8 rounded-xl border border-zinc-800">
        <h2 className="text-3xl font-bold text-center mb-6">Schedule Meeting</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="project" className="block text-sm font-medium mb-2">
              Select Project
            </label>
            <select
              id="project"
              value={selectedProject}
              onChange={handleProjectSelect}
              className="input-field"
              required
            >
              <option value="">Choose a Project</option>
              {projects.map(project => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {selectedProject && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Select Participants
              </label>
              <div className="space-y-2">
                {employees.map(employee => (
                  <div key={employee._id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={employee._id}
                      checked={selectedEmployees.includes(employee._id)}
                      onChange={() => handleEmployeeSelect(employee._id)}
                      className="mr-2"
                    />
                    <label htmlFor={employee._id}>
                      {employee.profile.firstName} {employee.profile.lastName}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              Meeting Room ID
            </label>
            <input
              type="text"
              value={meetingShortId}
              readOnly
              className="input-field bg-zinc-700 cursor-not-allowed"
            />
          </div>

          <button
            type="submit"
            disabled={!selectedProject || selectedEmployees.length === 0}
            className="w-full btn-primary disabled:opacity-50"
          >
            Schedule Meeting
          </button>
        </form>
      </div>
    </div>
  );
};

export default ScheduleMeeting;