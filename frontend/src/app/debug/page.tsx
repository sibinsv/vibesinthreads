'use client';

import React, { useState, useEffect } from 'react';

export default function DebugPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Debug page useEffect triggered');
    
    const testAPI = async () => {
      try {
        console.log('Testing direct fetch to API...');
        const response = await fetch('http://localhost:5000/api/v1/products/featured?limit=8');
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('API response:', result);
        setData(result);
      } catch (err) {
        console.error('API Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    testAPI();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>API Debug Page</h1>
      
      {loading && <p>Loading...</p>}
      
      {error && (
        <div style={{ color: 'red', padding: '10px', border: '1px solid red' }}>
          <h3>Error:</h3>
          <p>{error}</p>
        </div>
      )}
      
      {data && (
        <div style={{ marginTop: '20px' }}>
          <h3>API Response:</h3>
          <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}