import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-6">Bienvenido a Textify Speaking.</h1>
      <Link to="/dashboard" className="text-blue-500 hover:underline mb-4">Ir al panel</Link>
      <Link to="/faq" className="text-blue-500 hover:underline">FAQ</Link>
      <Link to="/data" className="text-blue-500 hover:underline">Ir a datos</Link>
    </div>
  );
}

export default Home;
