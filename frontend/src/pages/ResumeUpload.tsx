import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const ResumeUpload: React.FC = () => {
  const [resume, setResume] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validate file type
      if (file.type !== 'application/pdf') {
        toast.error('Only PDF files are allowed');
        e.target.value = '';
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        e.target.value = '';
        return;
      }

      setResume(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resume) {
      toast.error('Please select a resume to upload');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('resume', resume);

      const token = localStorage.getItem('token');
      
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/users/upload-resume`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Resume upload failed');
      }

      toast.success('Resume uploaded successfully');
      navigate('/dashboardEmployee');
    } catch (error) {
      toast.error('Failed to upload resume');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 bg-zinc-900/50 p-8 rounded-xl border border-zinc-800">
        <h2 className="text-3xl font-bold text-center mb-2">Upload Resume</h2>
        <form onSubmit={handleUpload} className="space-y-6">
          <div>
            <label
              htmlFor="resume"
              className="block text-sm font-medium mb-2"
            >
              Upload Resume (PDF only, max 5MB)
            </label>
            <input
              id="resume"
              type="file"
              accept=".pdf"
              className="input-field file:mr-4 file:rounded-md file:border-0 file:bg-zinc-700 file:text-white file:px-4 file:py-2 hover:file:bg-zinc-600"
              onChange={handleResumeChange}
            />
            {resume && (
              <p className="text-sm text-green-400 mt-2">
                {resume.name} selected
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !resume}
            className="w-full btn-primary disabled:opacity-50"
          >
            {loading ? 'Uploading...' : 'Upload Resume'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResumeUpload;