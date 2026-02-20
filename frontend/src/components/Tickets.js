import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { ticketsAPI } from '../services/api';

function Tickets({ user, onLogout }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    priority: 'medium',
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await ticketsAPI.getAll();
      setTickets(response.data.tickets || []);
    } catch (err) {
      setError('Failed to load tickets');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      await ticketsAPI.create(newTicket);
      setNewTicket({ subject: '', description: '', priority: 'medium' });
      setShowCreateForm(false);
      fetchTickets();
    } catch (err) {
      setError('Failed to create ticket');
      console.error(err);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      open: 'badge-warning',
      'in-progress': 'badge-info',
      resolved: 'badge-success',
      closed: 'badge-secondary',
    };
    return badges[status] || 'badge-info';
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      low: 'badge-info',
      medium: 'badge-warning',
      high: 'badge-danger',
    };
    return badges[priority] || 'badge-info';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div>
      <Navbar user={user} onLogout={onLogout} />
      
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Support Tickets</h1>
          <p className="page-subtitle">Manage your support requests</p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? 'Cancel' : 'Create New Ticket'}
          </button>
        </div>

        {showCreateForm && (
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '20px' }}>Create Support Ticket</h3>
            <form onSubmit={handleCreateTicket}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Subject
                </label>
                <input
                  type="text"
                  className="input"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  required
                  placeholder="Brief description of the issue"
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Description
                </label>
                <textarea
                  className="input"
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  required
                  rows="4"
                  placeholder="Detailed description of the issue"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Priority
                </label>
                <select
                  className="input"
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary">
                Submit Ticket
              </button>
            </form>
          </div>
        )}

        {error && <div className="error">{error}</div>}

        {loading ? (
          <div className="loading">Loading tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎫</div>
            <div className="empty-state-text">No support tickets found</div>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Subject</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>#{ticket.ticket_number}</td>
                    <td>{ticket.subject}</td>
                    <td>
                      <span className={`badge ${getPriorityBadge(ticket.priority)}`}>
                        {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(ticket.status)}`}>
                        {ticket.status.split('-').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </span>
                    </td>
                    <td>{formatDate(ticket.created_at)}</td>
                    <td>{formatDate(ticket.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Tickets;

// Made with Bob
