import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserCog, Plus, Trash2, Mail, Phone, Calendar, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_URL } from '../App';

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', role: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API_URL}/employees`);
      setEmployees(response.data);
    } catch (error) { toast.error('Failed to load employees'); }
  };

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/employees`, formData);
      toast.success('Employee added successfully!');
      setFormData({ name: '', role: '', email: '', phone: '' });
      setShowForm(false);
      fetchEmployees();
    } catch (error) { toast.error('Failed to add employee.'); }
    finally { setSubmitting(false); }
  };

  const deleteEmployee = async (id) => {
    if(!window.confirm('Are you sure you want to completely end employment and remove this employee?')) return;
    try {
      await axios.delete(`${API_URL}/employees/${id}`);
      toast.success('Employee removed!');
      fetchEmployees();
    } catch (error) { toast.error('Failed to delete employee.'); }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Staff & Employees</h1>
        <button className="btn" onClick={() => setShowForm(!showForm)}>
          <Plus size={20} /> {showForm ? 'Close' : 'Hire Employee'}
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
                <label>Job Role</label>
                <input type="text" name="role" value={formData.role} onChange={handleInputChange} placeholder="e.g. Librarian, IT Admin" required />
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
              {submitting ? 'Processing...' : <><Plus size={20} /> Save Employee</>}
            </button>
          </form>
        </div>
      )}

      {employees.length === 0 ? (
        <div className="empty-state">
          <UserCog size={64} />
          <h2>No staff members found</h2>
        </div>
      ) : (
        <div className="data-grid">
          {employees.map(employee => (
            <div key={employee.id} className="data-card">
              <div className="card-actions">
                <button className="icon-btn" onClick={() => deleteEmployee(employee.id)} title="End Employment"><Trash2 size={16} /></button>
              </div>
              <h3 className="card-title">{employee.name}</h3>
              <p className="card-subtitle" style={{fontSize: "0.85rem", color: "var(--primary)", marginTop: "0.25rem", marginBottom: "1rem"}}>ID: <strong>{employee.unique_id}</strong></p>
              
              <div className="card-body">
                <p className="card-subtitle"><Briefcase size={16} /> <strong style={{color: "var(--primary)"}}>{employee.role}</strong></p>
                <p className="card-subtitle"><Mail size={16} /> {employee.email}</p>
                <p className="card-subtitle"><Phone size={16} /> {employee.phone}</p>
              </div>

              <div className="badges-row">
                <span className="badge">
                  <Calendar size={14} /> Hired: {new Date(employee.hire_date).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Employees;
