import React, { useState, useEffect } from 'react';
import SupervisorLayout from './SupervisorLayout';
import './Supervisor.css';

function RetrainCTModel() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState(null);
  const [refreshingStats, setRefreshingStats] = useState(false);
  const [progress, setProgress] = useState(0);

  const fetchStats = async () => {
    setRefreshingStats(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/retrain-model/stats');
      if (!res.ok) throw new Error('Failed to load stats');
      const data = await res.json();
      setStats(data);
    } catch {
      setStats(null);
    } finally {
      setRefreshingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const simulateProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 400);
  };

  const handleRetrain = async () => {
    setMessage('');

    if (stats && stats.total < 5) {
      setMessage('❌ Need at least 5 eligible scans to retrain the model.');
      return;
    }

    setLoading(true);
    simulateProgress();

    try {
      const response = await fetch('http://127.0.0.1:8000/retrain-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
         body: JSON.stringify({
          epochs: 5,
          learning_rate: 0.001
          }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Retraining failed.');
      }

      const data = await response.json();
      setMessage(
       `${data.message || '✅ Retraining completed.'}` +
        (data.external_accuracy !== null && data.external_accuracy !== undefined
        ? `\n📊 Test Accuracy: ${(data.external_accuracy * 100).toFixed(2)}%`
        : '')
      );

      fetchStats();
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
      setProgress(100);
    }
  };

  return (
    <SupervisorLayout>
      <div className="admin-container">
        <h2>🧠 Retrain Stroke CT Model</h2>
        <p>This will retrain the model using labeled CT scans marked for training.</p>

        {refreshingStats ? (
          <p>🔄 Loading stats...</p>
        ) : stats ? (
          <div className="stats-panel">
            <p><strong>Total eligible images:</strong> {stats.total}</p>
            <ul>
              <li>🧩 Normal: {stats.by_class?.Normal || 0}</li>
              <li>🩸 Hemorrhagic: {stats.by_class?.Hemorrhagic || 0}</li>
              <li>🕳 Ischemic: {stats.by_class?.Ischemic || 0}</li>
            </ul>
          </div>
        ) : (
          <p style={{ color: 'red' }}>⚠ Unable to load stats.</p>
        )}

        <button onClick={handleRetrain} className="green-button">
          {loading ? 'Retraining...' : '🔁 Retrain Model'}
        </button>

        {loading && (
          <div className="progress-bar">
            <div className="progress" style={{ width: `${progress}%` }}></div>
          </div>
        )}

        {message && (
          <div style={{ marginTop: '1rem', fontWeight: 'bold' }}>
            {message}
          </div>
        )}
      </div>
    </SupervisorLayout>
  );
}

export default RetrainCTModel;
