import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileVideo, faFileAudio } from "@fortawesome/free-solid-svg-icons";
//import Toastify from "toastify-js";
//import "toastify-js/src/toastify.css";
import { Temporal } from "@js-temporal/polyfill";

function Upload() {
	//const [wordCount, setWordCount] = useState(0);
	//const [duration, setDuration] = useState("");
	const [date, setDate] = useState("");
	const [time, setTime] = useState("");
	const [files, setFiles] = useState([]);
	const [transcriptors, setTranscriptors] = useState([]);
	const [summarizers, setSummarizers] = useState([]);
	const [keys, setKeys] = useState([]);
	const [transcription, setTranscription] = useState(""); //Pasar a array, considerando que pueden haber varios transcriptores
	const [processStarted, setProcessStarted] = useState(false);
	const [processFinished, setProcessFinished] = useState(false);

	useEffect(() => {
    fetch(`http://localhost:3001/model/transcript`)
      .then((response) => response.json())
      .then((data) => setTranscriptors(data))
      .catch((error) => console.log(error));
  }, []);

  useEffect(() => {
    fetch("http://localhost:3001/model/summary")
      .then((response) => response.json())
      .then((data) => setSummarizers(data))
      .catch((error) => console.log(error));
  }, []);

	//A revisar
  const handleKeyChange = (event) => {
    const id = event.target.id;
    const checked = event.target.checked;

    if (checked) {
      setKeys([...keys, keyOptions.find(key => key.id.toString() === id.toString())]);
    } else {
      setKeys(keys.filter(key => key.id.toString() !== id.toString()));
    }
  };

	const handleFileInputChange = (event) => {
    const files = event.target.files;
    setFiles(files);
  };

	/**
	 useEffect(() => {
    const AI_count = transcriptors.length + summarizers.length;
    const isFilesEmpty = files.length === 0;
    const pass = AI_count > 0 && !isFilesEmpty;
    setFormPass(pass);
  }, [files, transcriptors, summarizers]); 
	 */

  async function handleSubmit(event) {
		const init_time_execution = performance.now();
		//const finish_time_execution = performance.now();

    event.preventDefault();
    setProcessStarted(true);
    const nowDate = Temporal.Now.plainDateISO();
    const nowTime = Temporal.Now.plainTimeISO();
    const nowTimeWithoutMiliseconds = nowTime.toString().split(".")[0];
    setDate(nowDate.toString());
    setTime(nowTimeWithoutMiliseconds);
    const formData = new FormData();
    formData.append('files', files);

		for (let i = 0; i < files.length; i++) {
			//Llamar a la API para mandar los archivos a la API para la transcripción

			//Llamar a la API para mandar los archivos a la API para el resumen
		}

    try {
      console.log('Respuesta:', formData);
    } catch (error) {
      console.error('Error subiendo el archivo:', error);
    }
  };

  return (
    <>
      {!processStarted ? (
        <div className="flex justify-center items-center h-screen">
          <div className="w-1/3 bg-white p-8 rounded-lg shadow-2xl transition duration-500 hover:scale-105">
            <h1 className="text-2xl font-semibold text-center mb-6">Realizar análisis</h1>

            <form onSubmit={handleSubmit} className="align-items-center">
              <div className="mb-4">
                <label htmlFor="title" className="block text-gray-600">
                  Título
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:border-blue-500"
                  value={title}
                  onChange={handleTitleChange}
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-600">
                  Modelos transcriptores
                </label>
                {keyOptions.map((option) => (
                  <div key={option.id}>
                    <input
                      type="checkbox"
                      id={option.id}
                      name={option.api_key}
                      value={option}
                      checked={keys.some(key => key.id.toString() === option.id.toString())}
                      onChange={handleKeyChange}
                    />
                    <label htmlFor={option.id} className="ml-2">
                      {`${option.api_key.substring(0, 5)}********** (${option.ai.name})`}
                    </label>
                  </div>
                ))}
              </div>
							
							<div className="mb-4">
                <label className="block text-gray-600">
                  Modelos de resumen
                </label>
                {keyOptions.map((option) => (
                  <div key={option.id}>
                    <input
                      type="checkbox"
                      id={option.id}
                      name={option.api_key}
                      value={option}
                      checked={keys.some(key => key.id.toString() === option.id.toString())}
                      onChange={handleKeyChange}
                    />
                    <label htmlFor={option.id} className="ml-2">
                      {`${option.api_key.substring(0, 5)}********** (${option.ai.name})`}
                    </label>
                  </div>
                ))}
              </div>

              <div className="mb-4">
                <label htmlFor="files" className="block text-gray-600">
                  Archivos <FontAwesomeIcon icon={faFileVideo} />{" "} <FontAwesomeIcon icon={faFileAudio} />
                </label>
                <input
                  type="file"
                  id="files"
                  name="files"
                  multiple
                  accept=".mp3, .flac, .mp4, .mkv"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:border-blue-500"
                  onChange={handleFileInputChange}
                />
              </div>

              <button
                type="submit"
                className={`w-full py-2 border rounded-xl ${formPass ? "border-green-500 bg-white text-green-500 transition duration-500 ease-in-out hover:bg-green-500 hover:text-white" : "border-gray-300 bg-gray-300 text-gray-500"}`}
                disabled={!formPass}
              >
                Realizar transcripción
              </button>
              <Link
                to="/loggedin"
                className="w-full py-2 mt-2 rounded-xl border border-black text-black text-center block"
              >
                Volver
              </Link>
            </form>
          </div>
        </div>
      ) : (
        <>
          <div className="container mx-auto py-6">
            <div className="flex justify-center text-2xl font-bold">¡Análisis inicializado!</div>
          </div>
          <div className="container mx-auto py-3">
            <div className="font-bold">Información del análisis</div>
            <div>
              <ul>
                <li>Título: <span className="font-semibold">{title}</span></li>
                <li>Fecha inicio: <span className="font-semibold">{currentDate}</span></li>
                <li>Hora inicio: <span className="font-semibold">{currentTime}</span></li>
                <li>Cantidad archivos: <span className="font-semibold">{files.length}</span></li>
                <li>IAs usadas:
                  {usedAIs && usedAIs.map((ai, index) => (
                    <span key={index} className="font-semibold text-white rounded-xl bg-black inline-block ml-2 mb-2 px-2">
                      {ai}
                    </span>))}
                </li>
                <li>Categorías:
                  {tags && tags.map((tag, index) => (
                    <span className="font-semibold text-white rounded-xl bg-black inline-block ml-2 mb-2 px-2">
                      {tag.name}
                    </span>))}</li>
                <li>Estado: <span className="font-semibold">{!processFinished ? ("En proceso") : ("Finalizado")}</span></li>
                <li>Fecha término: <span className="font-semibold">{endDate}</span></li>
                <li>Hora término: <span className="font-semibold">{endTime}</span></li>
                <li>Resultado: <span className="font-semibold">{resultMessage}</span></li>
              </ul>
            </div>
          </div>
          <div className="mx-8">

            <div className="flex justify-between mb-1 py-2">
              <span className="text-base font-medium text-purple-700 dark:text-white">Originality</span>
              <span className="text-sm font-medium text-purple-700 dark:text-white">{files.length > 0 ? originalityDisplayCount : "0%"}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: files.length > 0 ? originalityDisplayCount : "0%" }}></div>
            </div>

            <div className="flex justify-between mb-1 py-2">
              <span className="text-base font-medium text-green-700 dark:text-white">ChatGPT (GPT-4)</span>
              <span className="text-sm font-medium text-green-700 dark:text-white">{files.length > 0 ? chatGPTDisplayCount : "0%"}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div className="bg-green-600 h-2.5 rounded-full" style={{ width: files.length > 0 ? chatGPTDisplayCount : "0%" }}></div>
            </div>

            <div className="flex justify-between mb-1 py-2">
              <span className="text-base font-medium text-red-700 dark:text-white">Fast Detect GPT</span>
              <span className="text-sm font-medium text-red-700 dark:text-white">{files.length > 0 ? fastDetectGPTDisplayCount : "0%"}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div className="bg-red-600 h-2.5 rounded-full" style={{ width: files.length > 0 ? fastDetectGPTDisplayCount : "0%" }}></div>
            </div>

            <div className="flex justify-between mb-1 py-2">
              <span className="text-base font-medium text-sky-700 dark:text-white">Lm Watermarking</span>
              <span className="text-sm font-medium text-sky-700 dark:text-white">{files.length > 0 ? lmWatermarkingDisplayCount : "0%"}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div className="bg-sky-600 h-2.5 rounded-full" style={{ width: files.length > 0 ? lmWatermarkingDisplayCount : "0%" }}></div>
            </div>

          </div>
          {processFinished &&
            <div className="grid grid-cols-1 sm:grid-cols-2 justify-between px-4 gap-4">
              <Link to={`/dashboard`} className="text-center mt-4 p-2 text-blue-500 bg-white border border-blue-500 rounded-xl transition ease-in-out duration-500 hover:bg-blue-500 hover:text-white">
                <button>Volver</button>
              </Link>
            </div>
          }
        </>
      )}
    </>
  );
}

export default Upload;
