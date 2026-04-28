import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Eye, CheckCircle, XCircle, Search } from 'lucide-react';
import API from '../api';

interface Vendor {
  _id: string;
  name: string;
  email: string;
  phone: string;
  farmName: string;
  farmType: string;
  state: string;
  district: string;
  status: string;
  createdAt: string;
  farmImages: string[];
  farmLogo?: string;
  fullAddress: string;
  city: string;
  pincode: string;
  landmark?: string;
  farmSize: string;
  bankName: string;
  bankAccountHolder: string;
  bankAccountNumber: string;
  bankIFSC: string;
  addressProofType: string;
  addressProofNumber: string;
  addressProofImage?: string;
  pattaChitta?: string;
  landOwnership?: string;
  leaseAgreement?: string;
  farmerIdCard?: string;
  organicCertification?: string;
  gst?: string;
  mapLat?: number;
  mapLng?: number;
  rejectionRemark?: string;
}

const BASE = 'http://localhost:5000';

export default function VerifyVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [activeStatus, setActiveStatus] = useState('pending');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Vendor | null>(null);
  const [rejectRemark, setRejectRemark] = useState('');
  const [rejectModal, setRejectModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const LIMIT = 10;

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/admin/vendors', { params: { status: activeStatus, page, limit: LIMIT, search: search || undefined } });
      setVendors(data.vendors);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [page, activeStatus]);
  useEffect(() => { const t = setTimeout(fetch, 400); return () => clearTimeout(t); }, [search]);

  const approve = async (id: string) => {
    setActionLoading(true);
    try {
      await API.put(`/admin/vendors/${id}/approve`);
      toast.success('Farmer approved! Email sent.');
      setSelected(null);
      fetch();
    } catch { toast.error('Failed'); } finally { setActionLoading(false); }
  };

  const reject = async (id: string) => {
    if (!rejectRemark.trim()) { toast.error('Remark required'); return; }
    setActionLoading(true);
    try {
      await API.put(`/admin/vendors/${id}/reject`, { remark: rejectRemark });
      toast.success('Farmer rejected. Email sent with remarks.');
      setRejectModal(false);
      setSelected(null);
      setRejectRemark('');
      fetch();
    } catch { toast.error('Failed'); } finally { setActionLoading(false); }
  };

  const statusTabs = [
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
  ];

  const pages = Math.ceil(total / LIMIT);

  const InfoLine = ({ label, value }: { label: string; value?: string }) =>
    value ? <div style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: '1px solid #f5f5f5', fontSize: 13 }}>
      <span style={{ color: '#888', minWidth: 150, flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div> : null;

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Verify Farmers</div>
          <div className="topbar-subtitle">{total} farmer(s) in this view</div>
        </div>
      </div>

      <div className="page-content">
        <div className="card">
          <div className="card-header">
            <div className="tabs" style={{ marginBottom: 0, flex: 1 }}>
              {statusTabs.map(t => (
                <button key={t.value} className={`tab-btn ${activeStatus === t.value ? 'active' : ''}`} onClick={() => { setActiveStatus(t.value); setPage(1); }}>{t.label}</button>
              ))}
            </div>
            <div className="search-box" style={{ maxWidth: 260 }}>
              <Search size={15} style={{ color: '#aaa' }} />
              <input placeholder="Search name or email..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="card-body">
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>Loading...</div>
            ) : vendors.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">👨‍🌾</div>
                <div className="empty-state-title">No {activeStatus} farmers</div>
              </div>
            ) : (
              <>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Farmer</th>
                        <th>Farm</th>
                        <th>Location</th>
                        <th>Applied</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendors.map(v => (
                        <tr key={v._id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: 'var(--green-600)', flexShrink: 0, overflow: 'hidden' }}>
                                {v.farmLogo ? <img src={`${BASE}${v.farmLogo}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : v.name[0]}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600 }}>{v.name}</div>
                                <div style={{ fontSize: 12, color: '#888' }}>{v.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{v.farmName}</div>
                            <div style={{ fontSize: 12, color: '#888' }}>{v.farmType} • {v.farmSize}</div>
                          </td>
                          <td style={{ fontSize: 13 }}>{v.district}, {v.state}</td>
                          <td style={{ fontSize: 13, color: '#888' }}>{new Date(v.createdAt).toLocaleDateString()}</td>
                          <td><span className={`badge badge-${v.status}`}>{v.status}</span></td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button className="btn btn-outline btn-sm" onClick={() => setSelected(v)}><Eye size={14} />View</button>
                              {v.status === 'pending' && <>
                                <button className="btn btn-primary btn-sm" onClick={() => approve(v._id)} disabled={actionLoading}><CheckCircle size={14} /></button>
                                <button className="btn btn-danger btn-sm" onClick={() => { setSelected(v); setRejectModal(true); }} disabled={actionLoading}><XCircle size={14} /></button>
                              </>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {pages > 1 && (
                  <div className="pagination">
                    <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹</button>
                    {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                      <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                    ))}
                    <button className="page-btn" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>›</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && !rejectModal && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 780 }}>
            <div className="modal-header">
              <span className="modal-title">Farmer Details — {selected.name}</span>
              <button className="modal-close" onClick={() => setSelected(null)}>×</button>
            </div>
            <div className="modal-body">
              {/* Farm images */}
              {selected.farmImages?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: '#555' }}>Farm Images</div>
                  <div className="img-gallery">
                    {selected.farmImages.map(img => (
                      <img key={img} src={`${BASE}${img}`} alt="" className="img-thumb" onClick={() => window.open(`${BASE}${img}`, '_blank')} />
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--green-600)', marginBottom: 8 }}>👤 Personal</div>
                  <InfoLine label="Name" value={selected.name} />
                  <InfoLine label="Email" value={selected.email} />
                  <InfoLine label="Phone" value={selected.phone} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--green-600)', marginBottom: 8 }}>🌾 Farm</div>
                  <InfoLine label="Farm Name" value={selected.farmName} />
                  <InfoLine label="Farm Type" value={selected.farmType} />
                  <InfoLine label="Farm Size" value={selected.farmSize} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--green-600)', marginBottom: 8 }}>📍 Address</div>
                  <InfoLine label="Full Address" value={selected.fullAddress} />
                  <InfoLine label="City" value={selected.city} />
                  <InfoLine label="District" value={selected.district} />
                  <InfoLine label="State" value={selected.state} />
                  <InfoLine label="Pincode" value={selected.pincode} />
                  {selected.mapLat && <InfoLine label="Coordinates" value={`${selected.mapLat}, ${selected.mapLng}`} />}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--green-600)', marginBottom: 8 }}>🏦 Bank</div>
                  <InfoLine label="Bank" value={selected.bankName} />
                  <InfoLine label="Account Holder" value={selected.bankAccountHolder} />
                  <InfoLine label="Account No." value={selected.bankAccountNumber} />
                  <InfoLine label="IFSC" value={selected.bankIFSC} />
                </div>
              </div>

              <div style={{ marginTop: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--green-600)', marginBottom: 8 }}>📄 Documents</div>
                <div className="doc-grid">
                  {[
                    { label: `${selected.addressProofType} (${selected.addressProofNumber})`, path: selected.addressProofImage },
                    { label: 'Patta / Chitta', path: selected.pattaChitta },
                    { label: 'Land Ownership', path: selected.landOwnership },
                    { label: 'Lease Agreement', path: selected.leaseAgreement },
                    { label: 'Farmer ID Card', path: selected.farmerIdCard },
                    { label: 'Organic Certification', path: selected.organicCertification },
                  ].filter(d => d.path).map(d => (
                    <div key={d.label} className="doc-item">
                      <span>{d.label}</span>
                      <a href={`${BASE}${d.path}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">View</a>
                    </div>
                  ))}
                </div>
                {selected.gst && <InfoLine label="GST Number" value={selected.gst} />}
              </div>

              {selected.rejectionRemark && (
                <div className="alert alert-error" style={{ marginTop: 16 }}>
                  <strong>Rejection Reason:</strong> {selected.rejectionRemark}
                </div>
              )}
            </div>

            {selected.status === 'pending' && (
              <div className="modal-footer">
                <button className="btn btn-danger" onClick={() => setRejectModal(true)} disabled={actionLoading}><XCircle size={15} />Reject</button>
                <button className="btn btn-primary" onClick={() => approve(selected._id)} disabled={actionLoading}>
                  {actionLoading ? <><span className="spinner" />Processing...</> : <><CheckCircle size={15} />Approve</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && selected && (
        <div className="modal-overlay" onClick={() => { setRejectModal(false); setRejectRemark(''); }}>
          <div className="modal-box" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Reject Farmer</span>
              <button className="modal-close" onClick={() => { setRejectModal(false); setRejectRemark(''); }}>×</button>
            </div>
            <div className="modal-body">
              <div className="alert alert-warning">This will notify <strong>{selected.name}</strong> via email with your remarks.</div>
              <div className="form-group">
                <label className="form-label required">Rejection Reason</label>
                <textarea className="form-control" rows={4} value={rejectRemark} onChange={e => setRejectRemark(e.target.value)} placeholder="e.g. Documents are unclear, Land ownership document missing..." />
                <div className="form-hint">Farmer will receive this via email</div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => { setRejectModal(false); setRejectRemark(''); }}>Cancel</button>
              <button className="btn btn-danger" onClick={() => reject(selected._id)} disabled={actionLoading}>
                {actionLoading ? <><span className="spinner" />Rejecting...</> : <><XCircle size={15} />Confirm Reject</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
