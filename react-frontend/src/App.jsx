import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './views/Home';
import Dashboard from './views/Dashboard';
import FAQ from './views/FAQ';
import Upload from './views/Upload';
import NotFound from './views/NotFound';
import AddKey from './views/AddKey';

function App() {
  return (
    <Router>
      <Routes>
        <Route exact path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/add_key" element={<AddKey />} />
        <Route path='*' element={<NotFound />} />
      </Routes>
    </Router>
  ); 
}

export default App
