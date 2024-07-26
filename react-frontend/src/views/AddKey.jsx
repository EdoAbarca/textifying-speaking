import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";
import axios from 'axios';

const MODEL_API_URL = "http://localhost:3001/api/model";
const KEY_API_URL = "http://localhost:3001/api/key";
//const API_KEY = import.meta.env.API_KEY;//.env

function AddKey() {
  const [key, setKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [models, setModels] = useState([]);
  const [formPass, setFormPass] = useState(false);
  const [registeredKeys, setRegisteredKeys] = useState([]);
  const [registeredModels, setRegisteredModels] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        const modelResponse = await axios.get(MODEL_API_URL);
        setModels(modelResponse.data);

        const keyResponse = await axios.get(KEY_API_URL);
        const keys = keyResponse.data;
        setRegisteredKeys(keys.map((key) => key.api_key));
        setRegisteredModels(keys.map((key) => key.model));
      } catch (error) {
        console.error(error);
        Toastify({
          text: "Error al cargar los datos: " + error.message,
          duration: 3000,
          close: true,
          style: {
            background: "red",
            color: "white"
          }
        }).showToast();
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    const keyPass = key.length > 0;
    const modelPass = selectedModel.length > 0;

    setFormPass(keyPass && modelPass);
  }, [key, selectedModel]);

  function goBack() {
    navigate(-1);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    console.log("Modelo: ", selectedModel);

    if (registeredKeys.includes(key)) {
      Toastify({
        text: "La API Key ya está registrada.",
        duration: 3000,
        close: true,
        style: {
          background: "red",
          color: "white"
        }
      }).showToast();
      return;
    }

    if (registeredModels.includes(selectedModel)) {
      Toastify({
        text: "Ya hay una API Key registrada para este modelo.",
        duration: 3000,
        close: true,
        style: {
          background: "red",
          color: "white"
        }
      }).showToast();
      return;
    }

    try {
      const response = await axios.post(KEY_API_URL, {
        api_key: key,
        model: selectedModel,
      });
      const data = response.data;
      console.log(data);
      Toastify({
        text: "API Key agregada exitósamente.",
        duration: 3000,
        close: true,
        style: {
          background: "green"
        }
      }).showToast();
      goBack();
    } catch (error) {
      console.error(error);
      Toastify({
        text: "Error al agregar la API Key: " + error.message,
        duration: 3000,
        close: true,
        style: {
          background: "red",
          color: "white"
        }
      }).showToast();
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Agregar API Key</h2>
        <form className="flex flex-col" onSubmit={handleSubmit}>
          <input
            type="text"
            className="bg-gray-100 text-gray-900 border-0 rounded-md p-2 mb-4 focus:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition ease-in-out duration-150"
            placeholder="Llave acceso (API Key)"
            value={key}
            onChange={(event) => setKey(event.target.value)}
          />
          <select
            className="bg-gray-100 text-gray-900 border-0 rounded-md p-2 mb-4 focus:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition ease-in-out duration-150"
            value={selectedModel}
            onChange={(event) => setSelectedModel(event.target.value)}
          >
            <option value="">Seleccione un modelo</option>
            {models.map((model, index) => (
              <option key={index} value={model}>
                {model}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className={`w-full py-2 border rounded-xl ${formPass ? "border-green-500 bg-white text-green-500 transition duration-500 ease-in-out hover:bg-green-500 hover:text-white" : "border-gray-300 bg-gray-300 text-gray-500"}`}
            disabled={!formPass}
          >
            Registrar
          </button>
          <Link onClick={goBack} className="text-black py-2 px-4 mt-4 rounded-xl border border-black text-center font-semibold">
            Volver
          </Link>
        </form>
      </div>
    </div>
  );
}

export default AddKey;
