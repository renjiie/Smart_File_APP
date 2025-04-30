import React, { useState } from 'react';
import './App.css';

// This is a web preview that simulates our React Native app
function App() {
  const [activeTab, setActiveTab] = useState('files');
  const [processingFiles, setProcessingFiles] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [results, setResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Simulate processing files
  const handleFileSelect = () => {
    setProcessingFiles(true);
    setProgressValue(0);
    
    // Simulate progress
    const interval = setInterval(() => {
      setProgressValue(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setProcessingFiles(false);
            alert('Files processed successfully!');
          }, 500);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  // Simulate folder scan
  const handleFolderScan = () => {
    setProcessingFiles(true);
    setProgressValue(0);
    
    // Simulate progress
    const interval = setInterval(() => {
      setProgressValue(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setProcessingFiles(false);
            alert('Folder scanned successfully! Found 12 files.');
          }, 500);
          return 100;
        }
        return prev + 5;
      });
    }, 200);
  };

  // Simulate search
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setProcessingFiles(true);
    setProgressValue(0);
    
    // Simulate search progress
    const interval = setInterval(() => {
      setProgressValue(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setProcessingFiles(false);
            // Generate mock results
            const mockResults = [
              { 
                id: '1', 
                type: 'text', 
                path: '/Documents/notes.txt',
                snippet: `...found a match for "${searchQuery}" in this text file...`,
                similarity: 0.92
              },
              { 
                id: '2', 
                type: 'image', 
                path: '/Pictures/vacation.jpg',
                snippet: null,
                similarity: 0.87
              },
              { 
                id: '3', 
                type: 'video', 
                path: '/Videos/tutorial.mp4',
                snippet: null,
                similarity: 0.79
              },
            ];
            setResults(mockResults);
          }, 500);
          return 100;
        }
        return prev + 20;
      });
    }, 200);
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Multimodal Search</h1>
      </header>
      
      <div className="content">
        {/* Tab Navigation */}
        <div className="tab-container">
          <button 
            className={`tab ${activeTab === 'files' ? 'active-tab' : ''}`}
            onClick={() => setActiveTab('files')}
          >
            Select Files
          </button>
          <button 
            className={`tab ${activeTab === 'folder' ? 'active-tab' : ''}`}
            onClick={() => setActiveTab('folder')}
          >
            Scan Folder
          </button>
        </div>
        
        {/* Content based on active tab */}
        <div className="main-content">
          {activeTab === 'files' ? (
            <div className="file-selector">
              <h3>Select Files to Process</h3>
              <p>Choose text, image, or video files to extract content for search.</p>
              <button className="button" onClick={handleFileSelect}>
                Select Files
              </button>
            </div>
          ) : (
            <div className="folder-selector">
              <h3>Scan Folder for Files</h3>
              <p>Choose a folder to scan for text, image, and video files.</p>
              <button className="button purple" onClick={handleFolderScan}>
                Scan Folder
              </button>
              <div className="help-text">
                This will recursively scan the selected folder and all subfolders
              </div>
            </div>
          )}
          
          {/* Search Bar */}
          <div className="search-section">
            <h3>Search Your Files</h3>
            <form onSubmit={handleSearch} className="search-form">
              <input 
                type="text" 
                placeholder="Enter search query..." 
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="search-button">Search</button>
            </form>
          </div>
          
          {/* Progress Bar */}
          {processingFiles && (
            <div className="progress-container">
              <p className="progress-text">
                Processing... {progressValue}% complete
              </p>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{width: `${progressValue}%`}}
                ></div>
              </div>
            </div>
          )}
          
          {/* Results */}
          {results.length > 0 && (
            <div className="results-list">
              <h3>Search Results</h3>
              {results.map(result => (
                <div key={result.id} className="result-item">
                  <div className="result-header">
                    <div className={`result-type ${result.type}`}>
                      {result.type.toUpperCase()}
                    </div>
                    <div className="result-score">
                      {Math.round(result.similarity * 100)}% match
                    </div>
                  </div>
                  <div className="result-path">{result.path}</div>
                  {result.snippet && (
                    <div className="result-snippet">{result.snippet}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <footer className="footer">
        <p>Web Preview of React Native Multimodal Search App</p>
        <p className="note">This is a simulation of the mobile app interface</p>
      </footer>
    </div>
  );
}

export default App;