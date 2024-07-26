import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileVideo, faFileAudio } from "@fortawesome/free-solid-svg-icons";
import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";
import { Temporal } from "@js-temporal/polyfill";

function Upload() {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [files, setFiles] = useState([]);
  const [transcriptors, setTranscriptors] = useState([]);
  const [summarizers, setSummarizers] = useState([]);
  const [selectedTranscriptor, setSelectedTranscriptor] = useState({});
  const [selectedSummarizer, setSelectedSummarizer] = useState({});
  const [processStarted, setProcessStarted] = useState(false);
  const [processFinished, setProcessFinished] = useState(false);
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);
  const [summarizationProgress, setSummarizationProgress] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        const keys = await axios.get("http://localhost:8001/api/key");
        const transcriptors = keys.data.filter((key) => key.model.purpose === "transcript");
        setTranscriptors(transcriptors);
        const summarizers = keys.data.filter((key) => key.model.purpose === "summarize");
        setSummarizers(summarizers);
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

  const handleFileInputChange = (event) => {
    setFiles(event.target.files);
  };

  const handleTranscriptorChange = (event) => {
    setSelectedTranscriptor(event.target.value);
  };

  const handleSummarizerChange = (event) => {
    setSelectedSummarizer(event.target.value);
  };

  async function handleSubmit(event) {
    // Start function, measure time
    const processStartedTime = performance.now();
    
    // Default values
    event.preventDefault();
    setProcessStarted(true);
  
    // Get current date and time
    const nowDate = Temporal.Now.plainDateISO().toString();
    const nowTime = Temporal.Now.plainTimeISO().toString().split(".")[0];
    setDate(nowDate);
    setTime(nowTime);
  
    // Initialize progress
    setTranscriptionProgress(0);
    setSummarizationProgress(0);
  
    try {
      for (let i = 0; i < files.length; i++) {
        let formData = new FormData();
        const file = files[i];
  
        // If the current file is a video, convert it to audio
        if (file.type.startsWith('video/')) {
          formData.append('files', file);
          const convertResponse = await axios.post("http://localhost:3001/convert-files", formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setTranscriptionProgress(progress);
            }
          });
  
          const audioFilePath = convertResponse.data.audioFilePath;
          formData = new FormData();
          formData.append('audioFilePath', audioFilePath);
        } else {
          formData.append('files', file);
        }
  
        // Transcribe the audio
        const transcriptionResponse = await axios.post("http://localhost:8001/api/transcript", formData);
  
        // Update transcription progress
        setTranscriptionProgress(((i + 1) / files.length) * 100);
  
        // Summarize the transcription if selected
        const summarizationResponse = await axios.post("http://localhost:8002/api/summarize", {
          text: transcriptionResponse.data.transcription
        });
  
        // Update summarization progress
        setSummarizationProgress(((i + 1) / files.length) * 100);
  
        // Create document with transcription and summary
        const transcription = {
          file: files[i].name,
          date: nowDate,
          time: nowTime,
          transcription: transcriptionResponse.data.transcription,
          summary: summarizationResponse.data.summary,
        };
        
        // Save to database
        await axios.post("http://localhost:3001/methods/create-transcription", transcription);
      }
      
      // Success notification
      Toastify({
        text: "Transcripción y resumen completados con éxito",
        duration: 3000,
        style: {
          background: "green",
        },
      }).showToast();
      setProcessFinished(true);
      
    } catch (error) {
      Toastify({
        text: "Error en la transcripción o resumen",
        duration: 3000,
        style: {
          background: "red",
          text: "white",
        },
      }).showToast();
      setProcessFinished(true);
    }
    // End function, measure time
    const processFinishedTime = performance.now();
    console.log("Tiempo de ejecución: " + (processFinishedTime - processStartedTime) + " ms");
  }
  

  return (
    <div className="flex justify-center items-center h-screen">
      {!processStarted ? (
        <div className="w-1/3 bg-white p-8 rounded-lg shadow-2xl transition duration-500 hover:scale-105">
          <h1 className="text-2xl font-semibold text-center mb-6">Realizar análisis</h1>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-600">Modelos transcriptores</label>
              <select
                value={selectedTranscriptor}
                onChange={handleTranscriptorChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:border-blue-500"
              >
                <option value="">Seleccione un transcriptor</option>
                {transcriptors.map((transcriptor) => (
                  <option key={transcriptor.id} value={transcriptor.api_key}>
                    {transcriptor.api_key.substring(0, 5) + '*****'}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-gray-600">Modelos de resumen</label>
              <select
                value={selectedSummarizer}
                onChange={handleSummarizerChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:border-blue-500"
              >
                <option value="">Seleccione un resumidor</option>
                {summarizers.map((summarizer) => (
                  <option key={summarizer.id} value={summarizer.api_key}>
                    {summarizer.api_key.substring(0, 5) + '*****'}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="files" className="block text-gray-600">
                Archivos <FontAwesomeIcon icon={faFileVideo} />{" "} <FontAwesomeIcon icon={faFileAudio} />
              </label>
              <input
                type="file"
                id="files"
                multiple
                accept=".mp3, .flac, .mp4, .mkv"
                onChange={handleFileInputChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 border rounded-xl bg-blue-500 text-white transition duration-500 ease-in-out hover:bg-blue-700"
            >
              Realizar transcripción
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-full py-2 mt-2 border rounded-xl bg-gray-500 text-white transition duration-500 ease-in-out hover:bg-gray-700"
            >
              Volver
            </button>
          </form>
        </div>
      ) : (
        <div className="container mx-auto py-6">
          <div className="flex justify-center text-2xl font-bold">¡Transcripción inicializada!</div>
          <div className="container mx-auto py-3">
            <div className="font-bold">Información de la transcripción</div>
            <ul>
              <li>Fecha inicio: <span className="font-semibold">{date}</span></li>
              <li>Hora inicio: <span className="font-semibold">{time}</span></li>
              <li>Cantidad archivos: <span className="font-semibold">{files.length}</span></li>
              <li>Transcriptor seleccionado: <span className="font-semibold">{selectedTranscriptor}</span></li>
              <li>Resumidor seleccionado: <span className="font-semibold">{selectedSummarizer}</span></li>
            </ul>
            <div className="py-4">
              <div className="flex justify-between mb-1">
                <span className="text-base font-medium text-blue-700">Transcription Progress</span>
                <span className="text-sm font-medium text-blue-700">{transcriptionProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${transcriptionProgress}%` }}></div>
              </div>
            </div>
            <div className="py-4">
              <div className="flex justify-between mb-1">
                <span className="text-base font-medium text-green-700">Summarization Progress</span>
                <span className="text-sm font-medium text-green-700">{summarizationProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${summarizationProgress}%` }}></div>
              </div>
            </div>
            {processFinished && (
              <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full py-2 mt-2 border rounded-xl bg-gray-500 text-white transition duration-500 ease-in-out hover:bg-gray-700"
            >
              Volver
            </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Upload;
