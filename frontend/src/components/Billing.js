import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { billingAPI } from '../services/api';

function Billing({ user, onLogout }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await billingAPI.getInvoices();
      setInvoices(response.data.invoices || []);
    } catch (err) {
      setError('Failed to load invoices');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (invoiceId) => {
    try {
      const response = await billingAPI.downloadInvoice(invoiceId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to download invoice');
      console.error(err);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      paid: 'badge-success',
      pending: 'badge-warning',
      overdue: 'badge-danger',
    };
    return badges[status] || 'badge-info';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const totalAmount = invoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
  const paidAmount = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
  const pendingAmount = invoices
    .filter(inv => inv.status === 'pending' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

  return (
    <div>
      <Navbar user={user} onLogout={onLogout} />
      
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Billing & Invoices</h1>
          <p className="page-subtitle">Manage your payments and invoices</p>
        </div>

        {!loading && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Billed</div>
              <div className="stat-value">{formatCurrency(totalAmount)}</div>
            </div>

            <div className="stat-card success">
              <div className="stat-label">Paid</div>
              <div className="stat-value">{formatCurrency(paidAmount)}</div>
            </div>

            <div className="stat-card warning">
              <div className="stat-label">Pending</div>
              <div className="stat-value">{formatCurrency(pendingAmount)}</div>
            </div>
          </div>
        )}

        {error && <div className="error">{error}</div>}

        {loading ? (
          <div className="loading">Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💳</div>
            <div className="empty-state-text">No invoices found</div>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Date</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>#{invoice.invoice_number}</td>
                    <td>{formatDate(invoice.invoice_date)}</td>
                    <td>{formatDate(invoice.due_date)}</td>
                    <td>{formatCurrency(invoice.amount)}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(invoice.status)}`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleDownloadInvoice(invoice.id)}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        Download
                      </button>
                    </td>
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

export default Billing;

// Made with Bob
