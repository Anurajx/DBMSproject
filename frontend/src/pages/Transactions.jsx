import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowRightLeft, BookDown, CheckCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_URL } from '../App';

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [formData, setFormData] = useState({ book_id: '', member_id: '', due_date: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [txRes, bookRes, memRes] = await Promise.all([
        axios.get(`${API_URL}/transactions`),
        axios.get(`${API_URL}/books`),
        axios.get(`${API_URL}/members`)
      ]);
      setTransactions(txRes.data);
      setBooks(bookRes.data.filter(b => b.available_quantity > 0)); // Only show available books
      setMembers(memRes.data);
    } catch (error) { toast.error('Failed to load transaction data'); }
  };

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleIssue = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/transactions/issue`, formData);
      toast.success('Book issued successfully!');
      setFormData({ book_id: '', member_id: '', due_date: '' });
      setShowIssueForm(false);
      fetchData();
    } catch (error) { 
      toast.error(error.response?.data?.error || 'Failed to issue book'); 
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturn = async (txId) => {
    if(!window.confirm('Confirm book return?')) return;
    try {
      await axios.post(`${API_URL}/transactions/return/${txId}`);
      toast.success('Book marked as returned!');
      fetchData();
    } catch (error) { 
      toast.error('Failed to return book'); 
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Issues & Returns</h1>
        <button className="btn" onClick={() => setShowIssueForm(!showIssueForm)}>
          <BookDown size={20} /> {showIssueForm ? 'Cancel' : 'Issue Book'}
        </button>
      </div>

      {showIssueForm && (
        <div className="form-card">
          <form onSubmit={handleIssue}>
            <div className="form-grid">
              <div className="input-group">
                <label>Select Book</label>
                <select name="book_id" value={formData.book_id} onChange={handleInputChange} required>
                  <option value="">-- Choose an available book --</option>
                  {books.map(b => (
                    <option key={b.id} value={b.id}>{b.title} (Available: {b.available_quantity})</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label>Select Member</label>
                <select name="member_id" value={formData.member_id} onChange={handleInputChange} required>
                  <option value="">-- Choose member --</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label>Due Date</label>
                <input type="date" name="due_date" value={formData.due_date} onChange={handleInputChange} required />
              </div>
            </div>
            <button type="submit" className="btn" disabled={submitting}>
              {submitting ? 'Issuing...' : <><BookDown size={20} /> Confirm Issue</>}
            </button>
          </form>
        </div>
      )}

      {transactions.length === 0 ? (
        <div className="empty-state">
          <ArrowRightLeft size={64} />
          <h2>No transactions history</h2>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Book Title</th>
                <th>Member Name</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id}>
                  <td>#{tx.id}</td>
                  <td><strong>{tx.book_title}</strong></td>
                  <td>{tx.member_name}</td>
                  <td>{new Date(tx.issue_date).toLocaleDateString()}</td>
                  <td>{new Date(tx.due_date).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge status-${tx.status}`}>
                      {tx.status === 'issued' ? 'Issued' : 'Returned'}
                    </span>
                  </td>
                  <td>
                    {tx.status === 'issued' ? (
                      <button className="btn success" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem'}} onClick={() => handleReturn(tx.id)}>
                        <RefreshCw size={14} /> Return
                      </button>
                    ) : (
                      <span className="badge" style={{ border: 'none', background: 'transparent' }}>
                        <CheckCircle size={16} className="logo-icon" /> Done
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Transactions;
