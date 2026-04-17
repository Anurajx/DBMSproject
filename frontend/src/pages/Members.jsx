import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Plus, Trash2, Mail, Phone, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_URL } from '../App';

function Members() {
  const [members, setMembers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchMembers(); }, []);

  const fetchMembers = async () => {
    try {
      const response = await axios.get(`${API_URL}/members`);
      setMembers(response.data);
    } catch (error) { toast.error('Failed to load members'); }
  };

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/members`, formData);
      toast.success('Member added successfully!');
      setFormData({ name: '', email: '', phone: '' });
      setShowForm(false);
      fetchMembers();
    } catch (error) { toast.error('Failed to add member.'); }
    finally { setSubmitting(false); }
  };

  const deleteMember = async (id) => {
    if(!window.confirm('Are you sure you want to delete this member?')) return;
    try {
      await axios.delete(`${API_URL}/members/${id}`);
      toast.success('Member deleted!');
      fetchMembers();
    } catch (error) { toast.error('Failed to delete member.'); }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Library Members</h1>
        <button className="btn" onClick={() => setShowForm(!showForm)}>
          <Plus size={20} /> {showForm ? 'Close' : 'Add New Member'}
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="input-group">
                <label>Full Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
              </div>
              <div className="input-group">
                <label>Email Address</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
              </div>
              <div className="input-group">
                <label>Phone Number</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required />
              </div>
            </div>
            <button type="submit" className="btn" disabled={submitting}>
              {submitting ? 'Saving...' : <><Plus size={20} /> Save Member</>}
            </button>
          </form>
        </div>
      )}

      {members.length === 0 ? (
        <div className="empty-state">
          <Users size={64} />
          <h2>No members found</h2>
        </div>
      ) : (
        <div className="data-grid">
          {members.map(member => (
            <div key={member.id} className="data-card">
              <div className="card-actions">
                <button className="icon-btn" onClick={() => deleteMember(member.id)}><Trash2 size={16} /></button>
              </div>
              <h3 className="card-title">{member.name}</h3>
              
              <div className="card-body">
                <p className="card-subtitle"><Mail size={16} /> {member.email}</p>
                <p className="card-subtitle"><Phone size={16} /> {member.phone}</p>
              </div>

              <div className="badges-row">
                <span className="badge">
                  <Calendar size={14} /> Joined: {new Date(member.membership_date).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Members;
