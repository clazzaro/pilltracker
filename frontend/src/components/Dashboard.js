import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { ordersAPI, ticketsAPI } from '../services/api';

function Dashboard({ user, onLogout }) {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    openTickets: 0,
    resolvedTickets: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [ordersResponse, ticketsResponse] = await Promise.all([
        ordersAPI.getAll(),
        ticketsAPI.getAll(),
      ]);

      const orders = ordersResponse.data.orders || [];
      const tickets = ticketsResponse.data.tickets || [];

      setStats({
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        openTickets: tickets.filter(t => t.status === 'open').length,
        resolvedTickets: tickets.filter(t => t.status === 'resolved').length,
      });
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar user={user} onLogout={onLogout} />
      
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.name || user?.email}!</p>
        </div>

        {error && <div className="error">{error}</div>}

        {loading ? (
          <div className="loading">Loading dashboard...</div>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Total Orders</div>
                <div className="stat-value">{stats.totalOrders}</div>
              </div>

              <div className="stat-card warning">
                <div className="stat-label">Pending Orders</div>
                <div className="stat-value">{stats.pendingOrders}</div>
              </div>

              <div className="stat-card danger">
                <div className="stat-label">Open Tickets</div>
                <div className="stat-value">{stats.openTickets}</div>
              </div>

              <div className="stat-card success">
                <div className="stat-label">Resolved Tickets</div>
                <div className="stat-value">{stats.resolvedTickets}</div>
              </div>
            </div>

            <div className="card">
              <h2 style={{ marginBottom: '16px' }}>Quick Actions</h2>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button 
                  className="btn btn-primary"
                  onClick={() => window.location.href = '/orders'}
                >
                  View Orders
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => window.location.href = '/tickets'}
                >
                  Create Support Ticket
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => window.location.href = '/billing'}
                >
                  View Invoices
                </button>
              </div>
            </div>

            <div className="card">
              <h2 style={{ marginBottom: '16px' }}>Account Information</h2>
              <div style={{ lineHeight: '1.8' }}>
                <p><strong>Name:</strong> {user?.name}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Customer ID:</strong> {user?.id}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;

// Made with Bob
