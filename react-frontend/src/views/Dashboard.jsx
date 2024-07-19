import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faListUl, faEye, faEyeSlash, faTrash } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

const Dashboard = () => {
	const [selectedView, setSelectedView] = useState('Transcripts');
	const views = ['Transcripts', 'API keys', 'Analytics', 'Upload'];
	const navigate = useNavigate();

	return (
		<div className="p-6">
			<div className="flex justify-center py-2 space-x-4 rounded-xl bg-gray-200">
				{views.map((view) => (
					<button
						key={view}
						onClick={() => setSelectedView(view)}
						className={`px-4 rounded-xl transition duration-500 ease-in-out ${selectedView === view ? 'bg-white' : 'bg-gray-200 text-gray-700'}`}
					>
						{view}
					</button>
				))}
			</div>
			<div className="mt-4">
				{selectedView === 'Transcripts' && <Transcripts />}
				{selectedView === 'Analytics' && <Analytics />}
				{selectedView === 'API keys' && <APIs />}
				{selectedView === 'Upload' && navigate("/upload")}
			</div>
		</div>
	);
};

const Transcripts = () => {
	const transcripts = [
		{ file: 'Meeting Recap.mp3', duration: '12:34', wordCount: '2,345', date: '13-07-2024', transcription: 'Meeting recap transcription text...', summary: 'Meeting recap summary text...' },
		{ file: 'Interview Highlights.mp3', duration: '8:56', wordCount: '1,789', date: '13-07-2024', transcription: 'Interview highlights transcription text...', summary: 'Interview highlights summary text...' },
		{ file: 'Team Brainstorm.mp3', duration: '15:22', wordCount: '3,456', date: '13-07-2024', transcription: 'Team brainstorm transcription text...', summary: 'Team brainstorm summary text...' },
	];

	const [openRowIndex, setOpenRowIndex] = useState(null);
	const [expandedTranscript, setExpandedTranscript] = useState(null);
	const dropdownRefs = useRef([]);

	const handleToggle = (index) => {
		setOpenRowIndex((prevIndex) => (prevIndex === index ? null : index));
	};

	const handleClickOutside = (event) => {
		if (dropdownRefs.current.every((ref) => ref && !ref.contains(event.target))) {
			setOpenRowIndex(null);
		}
	};

	const handleExpand = (transcript) => {
		setExpandedTranscript(transcript);
		setOpenRowIndex(null); // Close the dropdown
	};

	const handleCloseExpand = () => {
		setExpandedTranscript(null);
	};

	useEffect(() => {
		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	return (
		<div>
			<h1 className="text-2xl font-semibold">Transcripts</h1>
			<p className="text-center text-gray-500">View and manage all your transcribed files.</p>
			<div className="mt-4">
				<table className="min-w-full bg-white border border-gray-200">
					<thead>
						<tr>
							<th className="py-2 px-4 border-b">File</th>
							<th className="py-2 px-4 border-b">Duration</th>
							<th className="py-2 px-4 border-b">Word Count</th>
							<th className="py-2 px-4 border-b">Date</th>
							<th className="py-2 px-4 border-b">Actions</th>
						</tr>
					</thead>
					<tbody>
						{transcripts.map((transcript, index) => (
							<TranscriptRow
								key={index}
								transcript={transcript}
								isOpen={openRowIndex === index}
								onToggle={() => handleToggle(index)}
								onExpand={() => handleExpand(transcript)}
								ref={(el) => (dropdownRefs.current[index] = el)}
							/>
						))}
					</tbody>
				</table>
			</div>
			{expandedTranscript && (
				<Modal onClose={handleCloseExpand} transcript={expandedTranscript} />
			)}
		</div>
	);
};

const TranscriptRow = React.forwardRef(({ transcript, isOpen, onToggle, onExpand }, ref) => {
	return (
		<tr>
			<td className="py-2 px-4 border-b">{transcript.file}</td>
			<td className="py-2 px-4 border-b">{transcript.duration}</td>
			<td className="py-2 px-4 border-b">{transcript.wordCount}</td>
			<td className="py-2 px-4 border-b">{transcript.date}</td>
			<td className="py-2 px-4 border-b text-center relative" ref={ref}>
				<button
					onClick={onToggle}
					className="inline-flex justify-center items-center w-10 h-10 rounded-full border border-gray-300 shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
				>
					<FontAwesomeIcon icon={faListUl} />
				</button>
				{isOpen && (
					<div className="absolute right-0 z-10 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 dropdown-menu">
						<div className="py-1">
							<button onClick={onExpand} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">Expand</button>
							<button onClick={onToggle} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">Download</button>
							<button onClick={onToggle} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">Delete</button>
						</div>
					</div>
				)}
			</td>
		</tr>
	);
});

const Modal = ({ onClose, transcript }) => {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
			<div className="bg-white w-3/4 h-3/4 p-4 rounded-md relative">
				<button
					onClick={onClose}
					className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
				>
					Close
				</button>
				<div className="grid grid-cols-2 gap-4 h-full">
					<div className="border p-4 overflow-y-scroll">
						<h2 className="text-lg font-semibold">Transcription</h2>
						<p>{transcript.transcription}</p>
					</div>
					<div className="border p-4 overflow-y-scroll">
						<h2 className="text-lg font-semibold">Summary</h2>
						<p>{transcript.summary}</p>
					</div>
				</div>
			</div>
		</div>
	);
};

const Analytics = () => {
	return (
		<div>
			<h1 className="text-2xl font-semibold">Analytics</h1>
			<p className="text-center text-gray-500">View your analytics here (T.B.A.).</p>
			{/* Add analytics content here */}
		</div>
	);
};

const APIs = () => {
	const [apiKeys, setApiKeys] = useState([
		{ key: 'api-key-t', service: 'Transcriptors' },
		{ key: 'api-key-s', service: 'Summarizers' },
	]);
	const [showKey, setShowKey] = useState(Array(apiKeys.length).fill(false));

	const handleToggleShowKey = (index) => {
		const newShowKey = [...showKey];
		newShowKey[index] = !newShowKey[index];
		setShowKey(newShowKey);
	};

	const handleDeleteKey = (index) => {
		const confirmDelete = window.confirm('Are you sure you want to delete this API key?');
		if (confirmDelete) {
			const newApiKeys = [...apiKeys];
			newApiKeys.splice(index, 1);
			setApiKeys(newApiKeys);
		}
	};

	return (
		<div>
			<h1 className="text-2xl font-semibold">API keys</h1>
			<p className="text-center text-gray-500">Manage your API keys here.</p>
			<div className="flex justify-between items-center my-4">
				<button className="px-4 py-2 bg-blue-500 text-white rounded">Add API Key</button>
				<select className="px-4 py-2 border rounded">
					<option value="Transcriptors">Transcriptors</option>
					<option value="Summarizers">Summarizers</option>
				</select>
			</div>
			<table className="min-w-full bg-white">
				<thead>
					<tr>
						<th className="py-2 px-4 border-b">Key</th>
						<th className="py-2 px-4 border-b">Service</th>
						<th className="py-2 px-4 border-b">Options</th>
					</tr>
				</thead>
				<tbody>
					{apiKeys.map((apiKey, index) => (
						<tr key={index}>
							<td className="py-2 px-4 border-b">
								{showKey[index] ? apiKey.key : '**********'}
							</td>
							<td className="py-2 px-4 border-b">{apiKey.service}</td>
							<td className="py-2 px-4 border-b">
								<button onClick={() => handleToggleShowKey(index)} className="mr-2">
									<FontAwesomeIcon icon={showKey[index] ? faEyeSlash : faEye} />
								</button>
								<button onClick={() => handleDeleteKey(index)}>
									<FontAwesomeIcon icon={faTrash} />
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

export default Dashboard;
