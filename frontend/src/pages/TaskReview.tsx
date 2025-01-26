import { Link } from 'react-router-dom';
import { FaCheckCircle, FaRegLightbulb, FaDownload, FaClock, FaTasks } from 'react-icons/fa';
import Navbar from '../components/Navbar';

interface CircleProps {
    percentage: number;
}
// Dummy data - replace with API data later
const taskDetails = {
    taskName: "Implement User Authentication Flow",
    employee: {
        name: "John Carter",
        role: "Senior Developer",
        avatar: "https://randomuser.me/api/portraits/men/1.jpg"
    },
    dueDate: "2024-03-25",
    status: "Submitted for Review",
    description: "Implement JWT-based authentication flow with refresh tokens and secure cookie storage.",
    submission: {
        files: [
            { name: "auth-service.js", url: "#", type: "code" },
            { name: "test-results.pdf", url: "#", type: "document" }
        ],
        message: "Implemented core authentication logic with test coverage. Pending security review."
    },
    genaiAssessment: {
        completionPercentage: 75,
        pointers: [
            {
                type: "positive",
                text: "Excellent error handling in authentication middleware"
            },
            {
                type: "improvement",
                text: "Missing rate limiting on login endpoints"
            },
            {
                type: "suggestion",
                text: "Consider implementing 2FA for sensitive operations"
            }
        ]
    }
};

const ProgressCircle: React.FC<CircleProps> = ({ percentage }) => {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative w-48 h-48">
            <svg className="w-full h-full transform -rotate-90">
                <circle
                    cx="96"
                    cy="96"
                    r={radius}
                    className="stroke-current text-zinc-700"
                    strokeWidth="12"
                    fill="transparent"
                />
                <circle
                    cx="96"
                    cy="96"
                    r={radius}
                    className="stroke-current text-indigo-500 transition-all duration-500"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold gradient-text">{percentage}%</span>
            </div>
        </div>
    );
};

export default function TaskReview() {
    return (
        <div className="min-h-screen bg-black">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 py-12 pt-24">
                {/* Task Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">{taskDetails.taskName}</h1>
                        <div className="flex items-center text-gray-400">
                            <FaTasks className="mr-2" />
                            <span>Development Team • Due {taskDetails.dueDate}</span>
                        </div>
                    </div>
                    <span className="mt-4 md:mt-0 px-4 py-2 bg-indigo-600/10 rounded-full text-indigo-400">
                        {taskDetails.status}
                    </span>
                </div>

                {/* Main Content Grid */}
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="space-y-8">
                        {/* Task Overview */}
                        <div className="p-6 bg-zinc-900/50 rounded-xl border border-zinc-800">
                            <h2 className="text-2xl font-semibold mb-4">Task Overview</h2>
                            <div className="flex items-center mb-6">
                                <img
                                    src={taskDetails.employee.avatar}
                                    alt={taskDetails.employee.name}
                                    className="w-12 h-12 rounded-full mr-4"
                                />
                                <div>
                                    <h3 className="font-semibold">{taskDetails.employee.name}</h3>
                                    <p className="text-gray-400 text-sm">{taskDetails.employee.role}</p>
                                </div>
                            </div>
                            <p className="text-gray-300">{taskDetails.description}</p>
                        </div>

                        {/* Submitted Work */}
                        <div className="p-6 bg-zinc-900/50 rounded-xl border border-zinc-800">
                            <h2 className="text-2xl font-semibold mb-4">Submitted Work</h2>
                            <div className="mb-6">
                                {taskDetails.submission.files.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-black rounded-lg mb-2">
                                        <div className="flex items-center">
                                            <FaDownload className="mr-2 text-gray-400" />
                                            <span className="text-gray-300">{file.name}</span>
                                        </div>
                                        <a
                                            href={file.url}
                                            className="text-indigo-400 hover:text-indigo-300 transition-colors"
                                            download
                                        >
                                            Download
                                        </a>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 bg-black rounded-lg">
                                <h3 className="font-semibold mb-2">Submission Notes</h3>
                                <p className="text-gray-300">{taskDetails.submission.message}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - GenAI Assessment */}
                    <div className="p-6 bg-zinc-900/50 rounded-xl border border-zinc-800 h-fit">
                        <h2 className="text-2xl font-semibold mb-6">AI Assessment</h2>

                        <div className="flex flex-col items-center mb-8">
                            <ProgressCircle percentage={taskDetails.genaiAssessment.completionPercentage} />
                            <p className="mt-4 text-gray-400 text-center">
                                Estimated completion based on code analysis and task requirements
                            </p>
                        </div>

                        <div className="space-y-6">
                            {taskDetails.genaiAssessment.pointers.map((pointer, index) => (
                                <div key={index} className="p-4 bg-black rounded-lg border border-zinc-800">
                                    <div className="flex items-start">
                                        <span className={`mr-3 mt-1 ${pointer.type === 'positive' ? 'text-green-400' :
                                                pointer.type === 'improvement' ? 'text-yellow-400' : 'text-indigo-400'
                                            }`}>
                                            {pointer.type === 'positive' ? <FaCheckCircle /> :
                                                pointer.type === 'improvement' ? <FaClock /> : <FaRegLightbulb />}
                                        </span>
                                        <p className="text-gray-300">{pointer.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* File Content Preview */}
                <div className="mt-8 p-6 bg-zinc-900/50 rounded-xl border border-zinc-800">
                    <h2 className="text-2xl font-semibold mb-4">Code Preview</h2>
                    <div className="overflow-x-auto">
                        <pre className="p-4 bg-black rounded-lg text-gray-300 font-mono text-sm">
                            {`// auth-service.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

function generateAccessToken(user) {
  return jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { userId: user.id, tokenVersion: user.tokenVersion },
    process.env.REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

// Middleware for authentication
function authenticateToken(req, res, next) {
  const token = req.cookies.access_token;
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}`}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
}