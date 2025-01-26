import React, { useState, useEffect, JSX } from 'react';
import axios from 'axios';
import { FaChartLine, FaUsers, FaFileAlt, FaCodeBranch, FaCircleNotch, FaClock, FaExclamationCircle, FaSpinner } from 'react-icons/fa';

interface ChartData {
  total_changes_image: string;
  differences_image?: string;
  hourly_activity_image: string;
  file_changes_image: string;
  repo_changes_image: string;
  top_files_image: string;
  pie_chart_image: string;
}

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

const DashboardEmployee: React.FC = () => {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const user = getUserFromLocalStorage();
      if (!user || !user.id) {
        setError('User ID not found in localStorage');
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get<ChartData>(`http://localhost:8000/get-chart?userid=${user.id}`);
        setChartData(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch chart data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Empty dependency array ensures this runs only once on mount

  const renderChart = (key: keyof ChartData, title: string, icon: JSX.Element, colSpan: number = 1) => {
    const base64Image = chartData?.[key];
    if (!base64Image) return null;

    return (
      <div
        key={key}
        className={`bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 hover:border-indigo-600/50 transition-all duration-300 hover:scale-[1.02] transform-gpu col-span-${colSpan}`}
        style={{ backdropFilter: 'blur(10px)' }} // Glassmorphism effect
      >
        <div className="text-indigo-400 mb-4">{icon}</div>
        <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          {title}
        </h2>
        <img 
          src={`data:image/png;base64,${base64Image}`} 
          alt={title}
          className="w-full h-auto rounded-lg"
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Employee Analytics Dashboard
        </h1>
        <p className="text-gray-400 mt-2">
          Visual insights into productivity and workflow patterns.
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-900/50 border border-red-800 text-red-400 px-4 py-3 rounded-lg mb-8 flex items-center animate-pulse">
          <FaExclamationCircle className="mr-2" />
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-4xl text-indigo-400" />
        </div>
      )}

      {/* Dynamic Grid Layout */}
      {chartData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {/* Large Cards */}
          {renderChart('total_changes_image', 'Total Changes Over Time', <FaChartLine className="w-8 h-8" />, 2)}
          {renderChart('hourly_activity_image', 'Hourly File Activity', <FaClock className="w-8 h-8" />, 2)}

          {/* Medium Cards */}
          {renderChart('file_changes_image', 'Total Changes per File', <FaFileAlt className="w-8 h-8" />)}
          {renderChart('repo_changes_image', 'Changes by Repository', <FaCodeBranch className="w-8 h-8" />)}
          {renderChart('top_files_image', 'Top 5 Most Active Files', <FaUsers className="w-8 h-8" />)}

          {/* Small Cards */}
          {renderChart('differences_image', 'First-Order Differences', <FaChartLine className="w-8 h-8" />)}
          {renderChart('pie_chart_image', 'Changes Distribution', <FaCircleNotch className="w-8 h-8" />)}
        </div>
      )}

      {/* Additional Spacing to Make the Page Longer */}
      <div className="h-32"></div>
    </div>
  );
};

export default DashboardEmployee;