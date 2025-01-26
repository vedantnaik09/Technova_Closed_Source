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

const ProjectEmployees: React.FC = () => {
 const [employees, setEmployees] = useState<Employee[]>([]);
 const [projects, setProjects] = useState<Project[]>([]);
 const [selectedProjectId, setSelectedProjectId] = useState<string>('');
 const [loading, setLoading] = useState(true);

 useEffect(() => {
   const fetchProjects = async () => {
     const token = localStorage.getItem('token');

     try {
       const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/projects`, {
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
       setProjects(data.projects);
       setLoading(false);
     } catch (error: any) {
       toast.error(error.message);
       setLoading(false);
     }
   };

   fetchProjects();
 }, []);

 const fetchProjectEmployees = async (projectId: string) => {
   const token = localStorage.getItem('token');

   try {
     const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/projects/employees/${projectId}`, {
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
     setEmployees(data.employees);
   } catch (error: any) {
     toast.error(error.message);
   }
 };

 const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
   const projectId = e.target.value;
   setSelectedProjectId(projectId);
   if (projectId) {
     fetchProjectEmployees(projectId);
   } else {
     setEmployees([]);
   }
 };

 const handleRemoveEmployee = async (employeeId: string) => {
   const token = localStorage.getItem('token');

   try {
     const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/projects/remove-member`, {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${token}`,
         'Content-Type': 'application/json'
       },
       body: JSON.stringify({ 
         projectId: selectedProjectId,
         employeeId 
       })
     });

     if (!response.ok) {
       throw new Error('Failed to remove employee');
     }

     setEmployees(employees.filter(emp => emp._id !== employeeId));
     toast.success('Employee removed from project');
   } catch (error: any) {
     toast.error(error.message);
   }
 };

 if (loading) {
   return (
     <div className="min-h-screen bg-black flex items-center justify-center">
       <div className="text-white">Loading projects...</div>
     </div>
   );
 }

 return (
   <div className="min-h-screen bg-black pb-10">
     <Navbar />
     <div className="container mx-auto px-4 py-8">
       <h2 className="text-3xl font-bold text-white mb-6">
         Project Employees
       </h2>

       <div className="mb-6">
         <select 
           value={selectedProjectId}
           onChange={handleProjectChange}
           className="w-full bg-zinc-900 text-white p-3 rounded-xl"
         >
           <option value="">Select a Project</option>
           {projects.map((project) => (
             <option key={project._id} value={project._id}>
               {project.name}
             </option>
           ))}
         </select>
       </div>

       {!selectedProjectId ? (
         <div className="bg-zinc-900 p-6 rounded-xl text-center">
           <p className="text-gray-400">Please select a project</p>
         </div>
       ) : employees.length === 0 ? (
         <div className="bg-zinc-900 p-6 rounded-xl text-center">
           <p className="text-gray-400">No employees assigned to this project</p>
         </div>
       ) : (
         <div className="grid gap-4">
           {employees.map((employee) => (
             <div 
               key={employee._id} 
               className="bg-zinc-900 p-4 rounded-xl flex justify-between items-center"
             >
               <div>
                 <h3 className="text-white font-semibold">
                   {employee.profile.firstName} {employee.profile.lastName}
                 </h3>
                 <p className="text-gray-400">{employee.email}</p>
               </div>
               <button
                 onClick={() => handleRemoveEmployee(employee._id)}
                 className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
               >
                 Remove
               </button>
             </div>
           ))}
         </div>
       )}
     </div>
   </div>
 );
};

export default ProjectEmployees;