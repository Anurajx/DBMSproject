import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Book, Plus, Trash2, Library, Hash, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_URL } from '../App';

function Books() {
  const [books, setBooks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', author: '', published_year: '', quantity: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchBooks(); }, []);

  const fetchBooks = async () => {
    try {
      const response = await axios.get(`${API_URL}/books`);
      setBooks(response.data);
    } catch (error) {
      toast.error('Failed to load books');
    }
  };

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/books`, {
        ...formData,
        published_year: parseInt(formData.published_year),
        quantity: parseInt(formData.quantity)
      });
      toast.success('Book added successfully!');
      setFormData({ title: '', author: '', published_year: '', quantity: '' });
      setShowForm(false);
      fetchBooks();
    } catch (error) { toast.error('Failed to add book.'); }
    finally { setSubmitting(false); }
  };

  const deleteBook = async (id) => {
    if(!window.confirm('Are you sure you want to delete this book?')) return;
    try {
      await axios.delete(`${API_URL}/books/${id}`);
      toast.success('Book deleted!');
      fetchBooks();
    } catch (error) { toast.error('Failed to delete book.'); }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Books Catalog</h1>
        <button className="btn" onClick={() => setShowForm(!showForm)}>
          <Plus size={20} /> {showForm ? 'Close' : 'Add New Book'}
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="input-group">
                <label>Book Title</label>
                <input type="text" name="title" value={formData.title} onChange={handleInputChange} required />
              </div>
              <div className="input-group">
                <label>Author</label>
                <input type="text" name="author" value={formData.author} onChange={handleInputChange} required />
              </div>
              <div className="input-group">
                <label>Published Year</label>
                <input type="number" name="published_year" value={formData.published_year} onChange={handleInputChange} required />
              </div>
              <div className="input-group">
                <label>Total Quantity</label>
                <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} required min="1" />
              </div>
            </div>
            <button type="submit" className="btn" disabled={submitting}>
              {submitting ? 'Saving...' : <><Plus size={20} /> Save Book</>}
            </button>
          </form>
        </div>
      )}

      {books.length === 0 ? (
        <div className="empty-state">
          <Book size={64} />
          <h2>No books found</h2>
        </div>
      ) : (
        <div className="data-grid">
          {books.map(book => (
            <div key={book.id} className="data-card">
              <div className="card-actions">
                <button className="icon-btn" onClick={() => deleteBook(book.id)}><Trash2 size={16} /></button>
              </div>
              <h3 className="card-title">{book.title}</h3>
              <p className="card-subtitle"><Book size={16} /> {book.author}</p>
              
              <div className="badges-row">
                <span className="badge"><Calendar size={14} /> {book.published_year}</span>
                <span className="badge"><Hash size={14} /> Total: {book.quantity}</span>
                <span className="badge primary-badge">Available: {book.available_quantity}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Books;
