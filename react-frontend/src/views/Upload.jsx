import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Camera, Mic, ArrowLeft } from 'lucide-react';
import { Temporal } from '@js-temporal/polyfill';
import Toastify from 'toastify-js';
import "toastify-js/src/toastify.css";

// Custom hook for API key management
const useAPIKeys = () => {
  const [apiKeys, setAPIKeys] = useState({ transcriptors: [], summarizers: [] });

  useEffect(() => {
    const fetchKeys = async () => {
      try {
        const { data } = await axios.get("http://localhost:8001/api/key");
        setAPIKeys({
          transcriptors: data.filter(key => key.model.purpose === "transcript"),
          summarizers: data.filter(key => key.model.purpose === "summarize")
        });
      } catch (error) {
        showNotification('Error loading API keys: ' + error.message, 'error');
      }
    };

    fetchKeys();
  }, []);

  return apiKeys;
};

// Notification helper
const showNotification = (message, type = 'success') => {
  Toastify({
    text: message,
    duration: 3000,
    close: true,
    style: {
      background: type === 'success' ? 'green' : 'red',
      color: 'white'
    }
  }).showToast();
};

const Upload = () => {
  const navigate = useNavigate();
  const { transcriptors, summarizers } = useAPIKeys();
  
  const [formData, setFormData] = useState({
    files: [],
    selectedTranscriptor: '',
    selectedSummarizer: '',
    includeSummary: false  // New state for summary toggle
  });

  const [processState, setProcessState] = useState({
    started: false,
    finished: false,
    date: '',
    time: '',
    transcriptionProgress: 0,
    summarizationProgress: 0
  });

  const handleFileInputChange = (event) => {
    const files = Array.from(event.target.files);
    const validTypes = ['.mp3', '.flac', '.mp4', '.mkv'];
    
    const invalidFiles = files.filter(file => 
      !validTypes.some(type => file.name.toLowerCase().endsWith(type))
    );

    if (invalidFiles.length > 0) {
      showNotification(`Invalid file types detected: ${invalidFiles.map(f => f.name).join(', ')}`, 'error');
      return;
    }

    setFormData(prev => ({ ...prev, files }));
  };

  const processFile = async (file) => {
    const formData = new FormData();
    
    if (file.type.startsWith('video/')) {
      formData.append('files', file);
      const { data: { audioFilePath } } = await axios.post(
        "http://localhost:3001/convert-files",
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );
      formData.set('files', audioFilePath);
    } else {
      formData.append('files', file);
    }

    const { data: { transcription } } = await axios.post(
      "http://localhost:8001/api/transcript",
      formData,
      {
        headers: {
          'Authorization': `Bearer ${formData.selectedTranscriptor}`
        }
      }
    );

    let summary = null;
    if (formData.includeSummary && formData.selectedSummarizer) {
      const { data: summaryData } = await axios.post(
        "http://localhost:8002/api/summarize",
        { text: transcription },
        {
          headers: {
            'Authorization': `Bearer ${formData.selectedSummarizer}`
          }
        }
      );
      summary = summaryData.summary;
    }

    return { transcription, summary };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const startTime = performance.now();

    if (!formData.selectedTranscriptor) {
      showNotification('Please select a transcriptor', 'error');
      return;
    }

    if (formData.includeSummary && !formData.selectedSummarizer) {
      showNotification('Please select a summarizer or disable summarization', 'error');
      return;
    }

    if (formData.files.length === 0) {
      showNotification('Please select at least one file', 'error');
      return;
    }

    const now = Temporal.Now;
    setProcessState(prev => ({
      ...prev,
      started: true,
      date: now.plainDateISO().toString(),
      time: now.plainTimeISO().toString().split(".")[0]
    }));

    try {
      for (let i = 0; i < formData.files.length; i++) {
        const { transcription, summary } = await processFile(formData.files[i]);
        
        // Update progress
        setProcessState(prev => ({
          ...prev,
          transcriptionProgress: ((i + 1) / formData.files.length) * 100,
          summarizationProgress: ((i + 1) / formData.files.length) * 100
        }));

        // Save to database
        await axios.post("http://localhost:3001/methods/create-transcription", {
          file: formData.files[i].name,
          date: processState.date,
          time: processState.time,
          transcription,
          summary
        });
      }

      const processingTime = (performance.now() - startTime) / 1000;
      showNotification(`Processing completed in ${processingTime.toFixed(2)} seconds`);
      setProcessState(prev => ({ ...prev, finished: true }));

    } catch (error) {
      showNotification('Error during processing: ' + error.message, 'error');
      setProcessState(prev => ({ ...prev, finished: true }));
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      {!processState.started ? (
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-2xl">
          <h1 className="text-2xl font-semibold text-center mb-6">Audio Processing</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <SelectField
              label="Transcription Model"
              value={formData.selectedTranscriptor}
              onChange={e => setFormData(prev => ({ ...prev, selectedTranscriptor: e.target.value }))}
              options={transcriptors}
            />
            
            <div className="space-y-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.includeSummary}
                  onChange={e => setFormData(prev => ({ ...prev, includeSummary: e.target.checked }))}
                  className="rounded text-blue-600"
                />
                <span>Include summarization</span>
              </label>

              {formData.includeSummary && (
                <SelectField
                  label="Summarization Model"
                  value={formData.selectedSummarizer}
                  onChange={e => setFormData(prev => ({ ...prev, selectedSummarizer: e.target.value }))}
                  options={summarizers}
                />
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-gray-600 mb-2">
                Files 
                <Icon icon="mdi:video" className="inline mx-1" />
                <Icon icon="mdi:microphone" className="inline mx-1" />
              </label>
              <input
                type="file"
                multiple
                accept=".mp3,.flac,.mp4,.mkv"
                onChange={handleFileInputChange}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <button type="submit" className="button-primary w-full">
                Start Processing
              </button>
              <button 
                type="button"
                onClick={() => navigate('/dashboard')}
                className="button-secondary w-full"
              >
                Back
              </button>
            </div>
          </form>
        </div>
      ) : (
        <ProcessingView
          state={processState}
          formData={formData}
          onBack={() => navigate(-1)}
        />
      )}
    </div>
  );
};

// Subcomponents
const SelectField = ({ label, value, onChange, options }) => (
  <div>
    <label className="block text-gray-600 mb-2">{label}</label>
    <select
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
    >
      <option value="">Select a model</option>
      {options.map(option => (
        <option key={option.id} value={option.api_key}>
          {option.api_key.substring(0, 5) + '*'.repeat(5)}
        </option>
      ))}
    </select>
  </div>
);



const ProcessingView = ({ state, formData, onBack }) => (
  <div className="w-full max-w-2xl bg-white p-8 rounded-lg shadow-2xl">
    <h2 className="text-2xl font-bold text-center mb-6">Processing Files</h2>
    
    <div className="space-y-4 mb-8">
      <InfoItem label="Start Date" value={state.date} />
      <InfoItem label="Start Time" value={state.time} />
      <InfoItem label="Files" value={formData.files.length} />
      <ProgressBar 
        label="Transcription Progress"
        progress={state.transcriptionProgress}
        color="blue"
      />
      {formData.includeSummary && (
        <ProgressBar 
          label="Summarization Progress"
          progress={state.summarizationProgress}
          color="green"
        />
      )}
    </div>

    {state.finished && (
      <button onClick={onBack} className="button-secondary w-full">
        <Icon icon="mdi:arrow-left" className="inline mr-2" /> Back
      </button>
    )}
  </div>
);


const InfoItem = ({ label, value }) => (
  <div className="flex justify-between items-center">
    <span className="text-gray-600">{label}:</span>
    <span className="font-semibold">{value}</span>
  </div>
);

const ProgressBar = ({ label, progress, color }) => (
  <div>
    <div className="flex justify-between mb-1">
      <span className={`text-${color}-700 font-medium`}>{label}</span>
      <span className={`text-${color}-700`}>{Math.round(progress)}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div 
        className={`bg-${color}-600 h-2.5 rounded-full transition-all duration-300`}
        style={{ width: `${progress}%` }}
      />
    </div>
  </div>
);

export default Upload;