import { Link } from 'react-router-dom';

function HealthCheck() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-3xl font-bold text-green-600">Health Check</h1>
        <p className="mt-4 text-gray-700">Frontend is running successfully!</p>
        <div className="mt-6 space-y-3">
          <Link
            to="/register"
            className="block w-full text-center bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default HealthCheck;
