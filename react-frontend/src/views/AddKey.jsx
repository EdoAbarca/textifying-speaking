import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";
import axios from 'axios';

function AddKey() {

    const [key, setKey] = useState("");
    const [options, setOptions] = useState([]);
    const [selectedOption, setSelectedOption] = useState("");
    const [formPass, setFormPass] = useState(false);
    const navigate = useNavigate();
  
    useEffect(() => {
      async function fetchOptions() {
        try {
          let response = await fetch("http://localhost:3001/key");
          const data = await response.json();
          console.log(data);
          setOptions(data);
        } catch (error) {
          console.log(error);
        }
      }
      fetchOptions();
    }, [])
  
    useEffect(() => {
      async function fetchUserKeys() {
        try {
          let response = await fetch(`http://localhost:3001/api/final/key/user/${user.idUser}`);
          const data = await response.json();
          console.log(data);
          setUserKeys(data);
        } catch (error) {
          console.log(error);
        }
      }
      fetchUserKeys();
    }, [])
  
    function goBack() {
      navigate(-1);
    }
  
    useEffect(() => {
      const keyPass = key.length > 0; //input
      const optionPass = selectedOption.length > 0; //Función seleccionada
  
      setFormPass(keyPass && optionPass);
    }, [selectedOption])
  
    async function handleSubmit(event) {
      event.preventDefault();  
      try {
        const response = await fetch("http://localhost:3001/api/final/key", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            "api_key": key,
            "goal": selectedOption
          })
        });
        const data = await response.json();
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
            text: "white"
          }
        }).showToast();
      }
    }
  
    return (
      <div>
        <div className="flex flex-col items-center justify-center h-screen">
          <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Agregar API Key</h2>
            <form className="flex flex-col">
              <input
                type="text"
                className="bg-gray-100 text-gray-900 border-0 rounded-md p-2 mb-4 focus:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition ease-in-out duration-150"
                placeholder="Llave acceso (API Key)"
                value={key}
                onChange={(event) => setKey(event.target.value)}
              />
              <select
                className="bg-gray-100 text-gray-900 border-0 rounded-md p-2 mb-4 focus:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition ease-in-out duration-150"
                value={selectedOption}
                onChange={(event) => setSelectedOption(event.target.value)}
              >
                <option value="">Seleccione una opción</option>
                {options.map((option) => (
                  <option key={option.id} value={option.name}>
                    {option.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                onClick={handleSubmit}
                className={`w-full py-2 border rounded-xl ${formPass ? "border-green-500 bg-white text-green-500 transition duration-500 ease-in-out hover:bg-green-500 hover:text-white" : "border-gray-300 bg-gray-300 text-gray-500"}`}
                disabled={!formPass}
              >
                Registrar
              </button>
              <Link onClick={goBack()} className="text-black py-2 px-4 mt-4 rounded-xl border border-black text-center font-semibold">
                Volver
              </Link>
            </form>
          </div>
        </div>
      </div>
    );
  }
  
  export default AddKey;