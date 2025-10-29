import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [message, setMessage] = useState('Loading...');

  useEffect(() => {
    // Fetch data from backend
    fetch('/api/hello')
      .then(response => response.text())
      .then(data => setMessage(data))
      .catch(error => {
        console.error('Error:', error);
        setMessage('Error connecting to backend');
      });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>MOPS Project</h1>
        <p>Message from Backend: <strong>{message}</strong></p>
      </header>
    </div>
  )
}

export default App