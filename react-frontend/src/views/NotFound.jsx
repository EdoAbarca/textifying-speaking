import { Link, useNavigate } from "react-router-dom";

function NotFound() {
  const navigate = useNavigate();
  return (
    <>
      <div className="bg-gray-200">
        <div className="w-4/5 m-auto py-16 min-h-screen flex items-center justify-center">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg pb-8">
            <div className="border-t border-gray-200 text-center pt-8">
              <h1 className="text-8xl font-bold text-red-600">Error 404</h1>
              <h1 className="text-6xl font-medium py-8">No encontrado.</h1>
              <p className="text-2xl pb-8 px-12 font-medium">¡Ups! La página solicitada no existe.</p>
              <button className="bg-gradient-to-r from-purple-400 to-blue-500 hover:from-purple-500 hover:to-blue-600 text-white font-semibold px-6 py-3 rounded-2xl mr-6">
                <Link to="/">Inicio</Link>
              </button>
              <button onClick={() => navigate(-1)} className="font-semibold px-6 py-3 rounded-2xl border shadow-lg">
                Volver
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default NotFound;