import { useEffect, useState } from 'react';
import { FaTasks, FaUser, FaClock, FaFlag, FaCogs, FaProjectDiagram } from 'react-icons/fa';
import Navbar from '../components/Navbar';

// Define the Task interface based on the provided data structure
interface Task {
  _id: string;
  title: string;
  description: string;
  assignedTo: {
    _id: string;
    email: string;
  } | null; // Updated to allow null
  estimatedHours: number;
  status: string;
  priority: number;
  aiMetadata: string;
  project_id: string;
}

const EmployeeTaskView = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      const user = getUserFromLocalStorage();
      if (!user || !user.id) {
        throw new Error('User or User ID not found in localStorage');
      }

      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/tasks/user/${user.id}/tasks`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const data: Task[] = await response.json();
      setTasks(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="text-red-500 text-2xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <Navbar />
      <h1 className="mt-14 text-2xl font-bold mb-8 flex items-center">
        <FaTasks className="mr-2" /> My Tasks
      </h1>

      {tasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <div
              key={task._id} // Ensure task._id is unique
              className="p-6 bg-zinc-900 rounded-xl border border-zinc-800 hover:border-indigo-600/50 transition-all duration-300"
            >
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <FaProjectDiagram className="mr-2 text-indigo-400" />{task.description}
              </h2>

              <div className="space-y-3">
                <div className="flex items-center text-gray-400">
                  <FaUser className="mr-2" /> Assigned To: {task.assignedTo ? task.assignedTo.email : "Unassigned"} {/* Handle null assignedTo */}
                </div>
                <div className="flex items-center text-gray-400">
                  <FaClock className="mr-2" /> Estimated Hours: {task.estimatedHours}
                </div>
                <div className="flex items-center text-gray-400">
                  <FaFlag className="mr-2" /> Status: {task.status}
                </div>
                <div className="flex items-center text-gray-400">
                  <FaCogs className="mr-2" /> Priority: {task.priority}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-400">No tasks assigned.</div>
      )}
    </div>
  );
};

// Helper function to retrieve the user from localStorage
const getUserFromLocalStorage = () => {
  try {
    const userString = localStorage.getItem('user');
    const parsedUser = userString ? JSON.parse(userString) : null;
    console.log('User from localStorage:', parsedUser); // Debugging
    return parsedUser;
  } catch (error) {
    console.error('Error retrieving user from localStorage:', error);
    return null;
  }
};

export default EmployeeTaskView;