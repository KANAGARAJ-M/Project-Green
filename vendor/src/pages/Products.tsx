import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PlusCircle, Edit2, Trash2, Search, AlertCircle } from 'lucide-react';
import API from '../api';

interface Product {
  _id: string;
  name: string;
  price: number;
  discountPrice?: number;
  stock: number;
  unit: string;
  status: string;
  rejectionRemark?: string;
  images: string[];
  category?: { name: string };
  subCategory?: { name: string };
  createdAt: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [params] = useSearchParams();
  const [activeStatus, setActiveStatus] = useState(params.get('status') || '');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const navigate = useNavigate();

  const LIMIT = 10;

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/vendor/products', {
        params: { page, limit: LIMIT, status: activeStatus || undefined }
      });
      setProducts(data.products);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [page, activeStatus]);

  const handleDelete = async (id: string) => {
    try {
      await API.delete(`/vendor/products/${id}`);
      toast.success('Product deleted');
      setDeleteId(null);
      fetchProducts();
    } catch {
      toast.error('Delete failed');
    }
  };

  const statusTabs = [
    { label: 'All', value: '' },
    { label: 'Approved', value: 'approved' },
    { label: 'Pending', value: 'pending' },
    { label: 'Rejected', value: 'rejected' },
  ];

  const pages = Math.ceil(total / LIMIT);

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">My Products</div>
          <div className="topbar-subtitle">{total} product(s) total</div>
        </div>
        <div className="topbar-actions">
          <Link to="/products/add" className="btn btn-primary"><PlusCircle size={16} />Add Product</Link>
        </div>
      </div>

      <div className="page-content">
        <div className="card">
          {/* Filters */}
          <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div className="tabs" style={{ marginBottom: 0, flex: 1 }}>
              {statusTabs.map(t => (
                <button key={t.value} className={`tab-btn ${activeStatus === t.value ? 'active' : ''}`} onClick={() => { setActiveStatus(t.value); setPage(1); }}>{t.label}</button>
              ))}
            </div>
          </div>

          <div className="card-body">
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>Loading...</div>
            ) : products.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📦</div>
                <div className="empty-state-title">No products found</div>
                <div className="empty-state-text">Start by adding your first farm product</div>
                <Link to="/products/add" className="btn btn-primary"><PlusCircle size={16} />Add Product</Link>
              </div>
            ) : (
              <>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p._id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', background: '#f5f5f5', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                                {p.images[0] ? <img src={`http://localhost:5000${p.images[0]}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🌿'}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                                {p.status === 'rejected' && p.rejectionRemark && (
                                  <div style={{ fontSize: 12, color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                    <AlertCircle size={12} />{p.rejectionRemark}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td style={{ fontSize: 13, color: '#666' }}>{p.category?.name || '-'}</td>
                          <td>
                            <div style={{ fontWeight: 700, color: 'var(--green-600)' }}>₹{p.price}</div>
                            {p.discountPrice && <div style={{ fontSize: 12, textDecoration: 'line-through', color: '#aaa' }}>₹{p.discountPrice}</div>}
                          </td>
                          <td style={{ fontSize: 13 }}>{p.stock} {p.unit}</td>
                          <td><span className={`badge badge-${p.status}`}>{p.status}</span></td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/products/edit/${p._id}`)}><Edit2 size={14} /></button>
                              <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(p._id)}><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
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

      {/* Delete confirm modal */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-box" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><span className="modal-title">Delete Product</span></div>
            <div className="modal-body">
              <p style={{ fontSize: 15, color: '#555' }}>Are you sure you want to delete this product? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteId)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
