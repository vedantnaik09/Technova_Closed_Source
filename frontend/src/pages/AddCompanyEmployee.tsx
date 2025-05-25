import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';

const AddCompanyEmployee: React.FC = () => {
 const [email, setEmail] = useState('');
 const [role, setRole] = useState('EMPLOYEE');
 const [loading, setLoading] = useState(false);
 const navigate = useNavigate();

 const handleAddEmployee = async (e: React.FormEvent) => {
   e.preventDefault();
   
   const token = localStorage.getItem('token');

   if (!token) {
     toast.error('Please log in first');
     return;
   }

   try {
     setLoading(true);
     const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/companies/add-member`, {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${token}`
       },
       body: JSON.stringify({ 
         email, 
         role 
       })
     });

     if (!response.ok) {
       const errorData = await response.json();
       throw new Error(errorData.error || 'Failed to add employee');
     }
     toast.success('Employee added successfully!');
     navigate('/company/members'); // Redirect to company members list
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
             Add Company Employee
           </h2>
           <p className="text-center text-gray-400">
             Invite a new member to your company
           </p>
         </div>
         <form onSubmit={handleAddEmployee} className="mt-8 space-y-6">
           <div className="space-y-4">
             <div>
               <label 
                 htmlFor="email" 
                 className="block text-sm font-medium mb-2"
               >
                 Employee Email
               </label>
               <input
                 id="email"
                 type="email"
                 required
                 className="input-field"
                 placeholder="Enter employee email"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
               />
             </div>
             <div>
               <label 
                 htmlFor="role" 
                 className="block text-sm font-medium mb-2"
               >
                 Employee Role
               </label>
               <select
                 id="role"
                 required
                 className="input-field"
                 value={role}
                 onChange={(e) => setRole(e.target.value)}
               >
                 <option value="EMPLOYEE">Employee</option>
                 <option value="PROJECT_MANAGER">Project Manager</option>
               </select>
             </div>
           </div>

           <button
             type="submit"
             disabled={loading}
             className="w-full btn-primary disabled:opacity-50"
           >
             {loading ? "Adding Employee..." : "Add Employee"}
           </button>
         </form>
       </div>
     </div>
   </div>
 );
};

export default AddCompanyEmployee;