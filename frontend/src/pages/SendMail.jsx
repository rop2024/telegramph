import { useState, useEffect } from 'react';
import { draftsAPI, receiversAPI, mailAPI } from '../services/api';
import { Send, Users, FileText } from 'lucide-react';

const SendMail = () => {
  const [drafts, setDrafts] = useState([]);
  const [receivers, setReceivers] = useState([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [loadingReceivers, setLoadingReceivers] = useState(true);

  // Single send state
  const [selectedDraft, setSelectedDraft] = useState('');
  const [selectedReceiver, setSelectedReceiver] = useState('');
  const [sendingSingle, setSendingSingle] = useState(false);

  // Bulk send state
  const [selectedBulkDraft, setSelectedBulkDraft] = useState('');
  const [selectedBulkReceivers, setSelectedBulkReceivers] = useState(new Set());
  const [batchDelay, setBatchDelay] = useState(1000);
  const [sendingBulk, setSendingBulk] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  // Toast-ish simple messages
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDrafts();
    fetchReceivers();
  }, []);

  const fetchDrafts = async () => {
    try {
      const res = await draftsAPI.getAll();
      setDrafts(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch drafts', err);
      setDrafts([]);
    } finally {
      setLoadingDrafts(false);
    }
  };

  const fetchReceivers = async () => {
    try {
      const res = await receiversAPI.getAll({ limit: 500 });
      setReceivers(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch receivers', err);
      setReceivers([]);
    } finally {
      setLoadingReceivers(false);
    }
  };

  // Single send
  const handleSendSingle = async () => {
    setMessage(null);
    setError(null);

    if (!selectedDraft || !selectedReceiver) {
      setError('Please select a draft and a receiver.');
      return;
    }

    setSendingSingle(true);
    try {
      const payload = { draftId: selectedDraft, receiverId: selectedReceiver };
      const res = await mailAPI.send(payload);
      setMessage('Email sent successfully');
      // show returned info
      setMessage(prev => prev + ` — preview: ${res.data.data.previewUrl || 'n/a'}`);
    } catch (err) {
      console.error('Send single error', err);
      setError(err?.response?.data?.message || err.message || 'Failed to send email');
    } finally {
      setSendingSingle(false);
    }
  };

  // Bulk helpers
  const toggleBulkReceiver = (id) => {
    setSelectedBulkReceivers(prev => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  };

  const handleSendBulk = async () => {
    setMessage(null);
    setError(null);
    setBulkResult(null);

    if (!selectedBulkDraft || selectedBulkReceivers.size === 0) {
      setError('Please select a draft and at least one receiver for bulk send.');
      return;
    }

    setSendingBulk(true);
    try {
      const payload = {
        draftId: selectedBulkDraft,
        receiverIds: Array.from(selectedBulkReceivers),
        batchDelay: Number(batchDelay) || 1000
      };

      const res = await mailAPI.sendBulk(payload);
      setBulkResult(res.data.data || null);
      setMessage(res.data.message || 'Bulk send completed');
    } catch (err) {
      console.error('Bulk send error', err);
      setError(err?.response?.data?.message || err.message || 'Bulk send failed');
    } finally {
      setSendingBulk(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Send className="h-5 w-5 mr-2 text-primary-600" />
            Send Mail
          </h1>
          <p className="mt-1 text-sm text-gray-600">Send a draft to individual receivers or in bulk with tracking.</p>
        </div>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded">{message}</div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Single send card */}
        <div className="card p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Single Send</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Draft</label>
              <select
                value={selectedDraft}
                onChange={(e) => setSelectedDraft(e.target.value)}
                className="input"
              >
                <option value="">-- Select a draft --</option>
                {drafts.map(d => (
                  <option key={d._id} value={d._id}>{d.title} — {d.subject}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Receiver</label>
              <select
                value={selectedReceiver}
                onChange={(e) => setSelectedReceiver(e.target.value)}
                className="input"
              >
                <option value="">-- Select a receiver --</option>
                {receivers.map(r => (
                  <option key={r._id} value={r._id}>{r.name} — {r.email || r.decryptedEmail || r.company}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSendSingle}
                className="btn btn-primary"
                disabled={sendingSingle}
              >
                {sendingSingle ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>

        {/* Bulk send card */}
        <div className="card p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Bulk Send</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Draft</label>
              <select
                value={selectedBulkDraft}
                onChange={(e) => setSelectedBulkDraft(e.target.value)}
                className="input"
              >
                <option value="">-- Select a draft --</option>
                {drafts.map(d => (
                  <option key={d._id} value={d._id}>{d.title} — {d.subject}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Receivers</label>
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded p-2">
                {loadingReceivers ? (
                  <div className="text-sm text-gray-500">Loading receivers...</div>
                ) : receivers.length === 0 ? (
                  <div className="text-sm text-gray-500">No receivers found</div>
                ) : (
                  receivers.map(r => (
                    <label key={r._id} className="flex items-center space-x-3 p-1 rounded hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selectedBulkReceivers.has(r._id)}
                        onChange={() => toggleBulkReceiver(r._id)}
                        className="h-4 w-4"
                      />
                      <div className="text-sm text-gray-700">{r.name} — {r.email || r.company}</div>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delay between emails (ms)</label>
              <input
                type="number"
                value={batchDelay}
                onChange={(e) => setBatchDelay(e.target.value)}
                className="input w-36"
              />
              <p className="mt-1 text-xs text-gray-500">Default 1000ms. Adjust to control sending rate.</p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSendBulk}
                className="btn btn-primary"
                disabled={sendingBulk}
              >
                {sendingBulk ? 'Sending...' : 'Send Bulk'}
              </button>
            </div>

            {bulkResult && (
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <div className="text-sm text-gray-700">Total: {bulkResult.total} — Successful: {bulkResult.successful} — Failed: {bulkResult.failed}</div>
                <details className="mt-2">
                  <summary className="text-sm text-gray-600 cursor-pointer">Details</summary>
                  <ul className="mt-2 list-disc list-inside text-sm text-gray-700">
                    {bulkResult.details && bulkResult.details.map((d, i) => (
                      <li key={i}>{d.email} — {d.status}{d.error ? ` — ${d.error}` : ` — ${d.messageId || ''}`}</li>
                    ))}
                  </ul>
                </details>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default SendMail;
