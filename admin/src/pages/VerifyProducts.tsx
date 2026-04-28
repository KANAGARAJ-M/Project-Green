import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Eye, Search } from 'lucide-react';
import API from '../api';

interface Product {
  _id: string;
  name: string;
  description: string;
  highlights?: string;
  images: string[];
  price: number;
  discountPrice?: number;
  stock: number;
  unit: string;
  status: string;
  tags: string[];
  rejectionRemark?: string;
  createdAt: string;
  vendor?: { name: string; farmName: string; email: string; phone: string; };
  category?: { name: string };
  subCategory?: { name: string };
}

const BASE = 'http://localhost:5000';

export default function VerifyProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [activeStatus, setActiveStatus] = useState('pending');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Product | null>(null);
  const [rejectRemark, setRejectRemark] = useState('');
  const [rejectModal, setRejectModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const LIMIT = 10;

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/admin/products', { params: { status: activeStatus, page, limit: LIMIT, search: search || undefined } });
      setProducts(data.products);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [page, activeStatus]);
  useEffect(() => { const t = setTimeout(fetchProducts, 400); return () => clearTimeout(t); }, [search]);

  const approve = async (id: string) => {
    setActionLoading(true);
    try {
      await API.put(`/admin/products/${id}/approve`);
      toast.success('Product approved! Vendor notified by email.');
      setSelected(null);
      fetchProducts();
    } catch { toast.error('Failed'); } finally { setActionLoading(false); }
  };

  const reject = async (id: string) => {
    if (!rejectRemark.trim()) { toast.error('Remark required'); return; }
    setActionLoading(true);
    try {
      await API.put(`/admin/products/${id}/reject`, { remark: rejectRemark });
      toast.success('Product rejected. Vendor notified via email.');
      setRejectModal(false);
      setSelected(null);
      setRejectRemark('');
      fetchProducts();
    } catch { toast.error('Failed'); } finally { setActionLoading(false); }
  };

  const statusTabs = [
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
  ];

  const pages = Math.ceil(total / LIMIT);

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Verify Products</div>
          <div className="topbar-subtitle">{total} product(s) in this view</div>
        </div>
      </div>

      <div className="page-content">
        <div className="card">
          <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div className="tabs" style={{ marginBottom: 0, flex: 1 }}>
              {statusTabs.map(t => (
                <button key={t.value} className={`tab-btn ${activeStatus === t.value ? 'active' : ''}`}
                  onClick={() => { setActiveStatus(t.value); setPage(1); }}>{t.label}</button>
              ))}
            </div>
            <div className="search-box" style={{ maxWidth: 260 }}>
              <Search size={15} style={{ color: '#aaa' }} />
              <input placeholder="Search product name..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="card-body">
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>Loading...</div>
            ) : products.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📦</div>
                <div className="empty-state-title">No {activeStatus} products</div>
              </div>
            ) : (
              <>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Farmer</th>
                        <th>Price / Stock</th>
                        <th>Category</th>
                        <th>Submitted</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p._id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', background: '#f5f5f5', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                                {p.images[0] ? <img src={`${BASE}${p.images[0]}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📦'}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                                <div style={{ fontSize: 11, color: '#888' }}>{p.images.length} image(s)</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 500 }}>{p.vendor?.name || '-'}</div>
                            <div style={{ fontSize: 12, color: '#888' }}>{p.vendor?.farmName}</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, color: 'var(--green-600)' }}>₹{p.price}</div>
                            <div style={{ fontSize: 12, color: '#888' }}>{p.stock} {p.unit}</div>
                          </td>
                          <td style={{ fontSize: 13 }}>
                            {p.category?.name || '-'}
                            {p.subCategory && <><br /><span style={{ fontSize: 12, color: '#888' }}>{p.subCategory.name}</span></>}
                          </td>
                          <td style={{ fontSize: 13, color: '#888' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                          <td><span className={`badge badge-${p.status}`}>{p.status}</span></td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button className="btn btn-outline btn-sm" onClick={() => setSelected(p)}><Eye size={13} />View</button>
                              {p.status === 'pending' && <>
                                <button className="btn btn-primary btn-sm" onClick={() => approve(p._id)} disabled={actionLoading}><CheckCircle size={13} /></button>
                                <button className="btn btn-danger btn-sm" onClick={() => { setSelected(p); setRejectModal(true); }} disabled={actionLoading}><XCircle size={13} /></button>
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
          <div className="modal-box" style={{ maxWidth: 720 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Product — {selected.name}</span>
              <button className="modal-close" onClick={() => setSelected(null)}>×</button>
            </div>
            <div className="modal-body">
              {/* Images */}
              {selected.images.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div className="img-gallery">
                    {selected.images.map((img, i) => (
                      <div key={img} style={{ position: 'relative' }}>
                        <img src={`${BASE}${img}`} alt="" className="img-thumb" onClick={() => setLightbox(`${BASE}${img}`)} />
                        {i === 0 && <div style={{ position: 'absolute', bottom: 2, left: 2, background: 'var(--green-600)', color: '#fff', fontSize: 9, padding: '1px 4px', borderRadius: 3 }}>Main</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--green-600)', marginBottom: 8 }}>📦 Product Details</div>
                  <div style={{ fontSize: 14, marginBottom: 8 }}><strong>Description:</strong><br /><span style={{ color: '#555' }}>{selected.description}</span></div>
                  {selected.highlights && <div style={{ fontSize: 14, marginBottom: 8 }}><strong>Highlights:</strong><br /><span style={{ color: '#555' }}>{selected.highlights}</span></div>}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                    <span style={{ background: '#E8F5E9', color: 'var(--green-600)', padding: '4px 10px', borderRadius: 6, fontSize: 13, fontWeight: 600 }}>₹{selected.price}</span>
                    {selected.discountPrice && <span style={{ background: '#FFF3E0', color: 'var(--orange-dark)', padding: '4px 10px', borderRadius: 6, fontSize: 13, fontWeight: 600 }}>Discount: ₹{selected.discountPrice}</span>}
                    <span style={{ background: '#F5F5F5', color: '#555', padding: '4px 10px', borderRadius: 6, fontSize: 13 }}>{selected.stock} {selected.unit}</span>
                  </div>
                  {selected.tags?.length > 0 && (
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 10 }}>
                      {selected.tags.map(t => <span key={t} style={{ background: '#E3F2FD', color: '#1565C0', padding: '2px 8px', borderRadius: 20, fontSize: 12 }}>{t}</span>)}
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--green-600)', marginBottom: 8 }}>👨‍🌾 Farmer Info</div>
                  <div style={{ fontSize: 14, color: '#555' }}>
                    <div><strong>{selected.vendor?.name}</strong></div>
                    <div>{selected.vendor?.farmName}</div>
                    <div style={{ marginTop: 4 }}>{selected.vendor?.email}</div>
                    <div>{selected.vendor?.phone}</div>
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--green-600)', marginBottom: 6 }}>🏷️ Category</div>
                    <div style={{ fontSize: 14 }}>{selected.category?.name || '-'} {selected.subCategory ? `› ${selected.subCategory.name}` : ''}</div>
                  </div>
                </div>
              </div>

              {selected.rejectionRemark && (
                <div className="alert alert-error" style={{ marginTop: 16 }}>
                  <strong>Previous Rejection:</strong> {selected.rejectionRemark}
                </div>
              )}
            </div>

            {selected.status === 'pending' && (
              <div className="modal-footer">
                <button className="btn btn-danger" onClick={() => setRejectModal(true)} disabled={actionLoading}><XCircle size={15} />Reject</button>
                <button className="btn btn-primary" onClick={() => approve(selected._id)} disabled={actionLoading}>
                  {actionLoading ? <><span className="spinner" />Processing...</> : <><CheckCircle size={15} />Approve Product</>}
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
              <span className="modal-title">Reject Product</span>
              <button className="modal-close" onClick={() => { setRejectModal(false); setRejectRemark(''); }}>×</button>
            </div>
            <div className="modal-body">
              <div className="alert alert-warning">The vendor will be notified via email with your reason.</div>
              <div className="form-group">
                <label className="form-label required">Rejection Reason</label>
                <textarea className="form-control" rows={4} value={rejectRemark} onChange={e => setRejectRemark(e.target.value)} placeholder="e.g. Image quality is poor, Description is insufficient..." autoFocus />
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

      {/* Lightbox */}
      {lightbox && (
        <div className="modal-overlay" onClick={() => setLightbox(null)} style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img src={lightbox} alt="" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 12, objectFit: 'contain' }} />
            <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: -12, right: -12, width: 32, height: 32, borderRadius: '50%', background: '#fff', border: 'none', cursor: 'pointer', fontSize: 18, fontWeight: 700 }}>×</button>
          </div>
        </div>
      )}
    </>
  );
}
