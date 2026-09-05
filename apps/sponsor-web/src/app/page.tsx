import React from 'react';
import {
  BarChart3,
  Eye,
  Users,
  Target,
  Gift,
  ExternalLink,
  Award,
  Sparkles,
} from 'lucide-react';

export default function SponsorDashboardPage() {
  return (
    <div className="sponsor-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand-logo">
          ⚡ <span>TechKart</span> Partner
        </div>
        <ul className="nav-links">
          <li>
            <a href="#" className="nav-item active">
              <BarChart3 size={18} /> Campaign Performance
            </a>
          </li>
          <li>
            <a href="#" className="nav-item">
              <Target size={18} /> Sponsored Quizzes
            </a>
          </li>
          <li>
            <a href="#" className="nav-item">
              <Gift size={18} /> Prize Catalogue
            </a>
          </li>
          <li>
            <a href="#" className="nav-item">
              <Users size={18} /> Audience Engagement
            </a>
          </li>
        </ul>
      </aside>

      {/* Main Campaign Performance Workbench */}
      <main className="main-content">
        <header className="header">
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Brand Campaign Analytics</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
              TechKart Summer Knowledge Fest 2026 • 100% Sponsor-Funded Prize Model
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="badge badge-success">Campaign Active</span>
          </div>
        </header>

        {/* Campaign ROI Metrics */}
        <section className="stats-grid">
          <div className="stat-card">
            <span className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Eye size={16} color="#10b981" /> Brand Impressions
            </span>
            <span className="stat-value">1,498,680</span>
            <span className="badge badge-success">High-Recall Ad Placements</span>
          </div>

          <div className="stat-card">
            <span className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Users size={16} color="#3b82f6" /> Quiz Participants
            </span>
            <span className="stat-value">124,890</span>
            <span className="badge badge-blue">100% Free Entry Users</span>
          </div>

          <div className="stat-card">
            <span className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Target size={16} color="#8b5cf6" /> Quiz Completion Rate
            </span>
            <span className="stat-value">94.2%</span>
            <span className="badge badge-success">High Intent Engagement</span>
          </div>

          <div className="stat-card">
            <span className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ExternalLink size={16} color="#10b981" /> Sponsor CTA Clicks
            </span>
            <span className="stat-value">18,450</span>
            <span className="badge badge-blue">Direct Store Traffic</span>
          </div>
        </section>

        {/* Active Sponsored Competitions */}
        <section className="card-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Active Sponsored Competitions</h2>
            <span className="badge badge-blue">Verified Non-Monetary Rewards</span>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>Competition Title</th>
                <th>Category</th>
                <th>Participants</th>
                <th>Completion Rate</th>
                <th>Sponsored Prize</th>
                <th>CTR</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>India Tech & Science Challenge #1</strong></td>
                <td>Technology</td>
                <td>45,210</td>
                <td><span className="badge badge-success">96.1%</span></td>
                <td>Smartwatch Pro 5G (Physical)</td>
                <td><strong>14.8%</strong></td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Brand Prize Fulfillment Tracker */}
        <section className="card-panel">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12 }}>
            <Award size={18} color="#10b981" /> Sponsor Prize Fulfillment Status
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 20 }}>
            Winners receive non-cash sponsor rewards directly delivered via verified courier partners.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div style={{ padding: 16, border: '1px solid var(--bg-surface-border)', borderRadius: 8, background: '#19202f' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Prizes Dispatched</p>
              <h3 style={{ fontSize: '1.5rem', marginTop: 4 }}>100%</h3>
              <span className="badge badge-success" style={{ marginTop: 8 }}>Courier Integrated</span>
            </div>
            <div style={{ padding: 16, border: '1px solid var(--bg-surface-border)', borderRadius: 8, background: '#19202f' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>User Rating / Sentiment</p>
              <h3 style={{ fontSize: '1.5rem', marginTop: 4 }}>4.9 ★</h3>
              <span className="badge badge-blue" style={{ marginTop: 8 }}>High Brand Trust</span>
            </div>
            <div style={{ padding: 16, border: '1px solid var(--bg-surface-border)', borderRadius: 8, background: '#19202f' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Campaign Budget ROI</p>
              <h3 style={{ fontSize: '1.5rem', marginTop: 4 }}>3.8x</h3>
              <span className="badge badge-success" style={{ marginTop: 8 }}>Measured Recall</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
