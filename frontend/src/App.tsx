import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
// import { useAuth } from './contexts/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardEmployee from './pages/DashboardEmployee';
import Moderator from './pages/Moderator';
import Meet from './pages/Meet';
import CreateCompany from './pages/CreateCompany';
import CreateProject from './pages/CreateProject';
import AddCompanyEmployee from './pages/AddCompanyEmployee';
import ProjectEmployees from './pages/ProjectEmployees';
import AddProjectEmployee from './pages/AddProjectEmployee';
import EmployeeTaskView from './pages/EmployeeTaskView';
import ResumeUpload from './pages/ResumeUpload';
import ScheduleMeeting from './pages/ScheduleMeeting';
import TaskReview from './pages/TaskReview';

// function PrivateRoute({ children }: { children: React.ReactNode }) {
//   const { user, loading } = useAuth();
  
//   if (loading) return null;
  
//   return user ? <>{children}</> : <Navigate to="/login" />;
// }

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboardEmployee" element={<DashboardEmployee />} />
          <Route path="/moderator" element={<Moderator/>} />
          <Route path="/employeeMeet" element={<Meet/>} />
          <Route path="/create-company" element={< CreateCompany/>} />
          <Route path="/create-project" element={< CreateProject/>} />
          <Route path="/add-company-employee" element={< AddCompanyEmployee/>} />
          <Route path="/project-employees" element={< ProjectEmployees/>} />
          <Route path="/add-project-employee" element={< AddProjectEmployee/>} />
          <Route path="/employeeTaskView" element={< EmployeeTaskView/>} />
          <Route path="/upload-resume" element={< ResumeUpload/>} />
          <Route path="/schedule-meeting" element={< ScheduleMeeting/>} />
          <Route path="/task-review" element={< TaskReview/>} />

          <Route path="/task-view" element={< EmployeeTaskView/>} />

        </Routes>
      </Router>
      <Toaster position="top-right" />
    </AuthProvider>
  );
}

export default App;