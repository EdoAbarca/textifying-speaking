function HealthCheck() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-green-600">Health Check</h1>
        <p className="mt-4 text-gray-700">Frontend is running successfully!</p>
      </div>
    </div>
  );
}

export default HealthCheck;
