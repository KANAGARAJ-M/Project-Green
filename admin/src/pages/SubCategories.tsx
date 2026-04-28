import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import API from '../api';

interface SubCat { _id: string; name: string; image?: string; category: { _id: string; name: string }; createdAt: string; }
interface Category { _id: string; name: string; }

const BASE = 'http://localhost:5000';

export default function SubCategories() {
  const [subs, setSubs] = useState<SubCat[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState('');
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<SubCat | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const imgRef = useRef<HTMLInputElement>(null);

  const fetch = async () => {
    setLoading(true);
    try {
      const [subsRes, catsRes] = await Promise.all([
        API.get('/admin/subcategories', { params: filterCat ? { category: filterCat } : undefined }),
        API.get('/admin/categories'),
      ]);
      setSubs(subsRes.data.subcategories);
      setCategories(catsRes.data.categories);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [filterCat]);

  const openAdd = () => { setName(''); setCategory(categories[0]?._id || ''); setImage(null); setEditing(null); setModal('add'); };
  const openEdit = (sub: SubCat) => { setEditing(sub); setName(sub.name); setCategory(sub.category._id); setImage(null); setModal('edit'); };

  const handleSave = async () => {
    if (!name.trim() || !category) { toast.error('Name and category required'); return; }
    setSaving(true);
    const fd = new FormData();
    fd.append('name', name.trim());
    fd.append('category', category);
    if (image) fd.append('image', image);
    try {
      if (modal === 'add') { await API.post('/admin/subcategories', fd); toast.success('Sub-category created'); }
      else { await API.put(`/admin/subcategories/${editing!._id}`, fd); toast.success('Sub-category updated'); }
      setModal(null);
      fetch();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try { await API.delete(`/admin/subcategories/${id}`); toast.success('Deleted'); setDeleteId(null); fetch(); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Sub Categories</div>
          <div className="topbar-subtitle">{subs.length} sub-categories</div>
        </div>
        <div className="topbar-actions">
          <select className="form-control form-select" style={{ width: 200 }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <button className="btn btn-primary" onClick={openAdd} disabled={categories.length === 0}><Plus size={16} />Add Sub Category</button>
        </div>
      </div>

      <div className="page-content">
        {categories.length === 0 && !loading && (
          <div className="alert alert-warning">No categories found. Please create categories first before adding sub-categories.</div>
        )}

        <div className="card">
          <div className="card-body">
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>Loading...</div>
            ) : subs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🗂️</div>
                <div className="empty-state-title">No sub-categories yet</div>
                <div className="empty-state-text">Create sub-categories to better organize products</div>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Sub Category</th>
                      <th>Parent Category</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subs.map(s => (
                      <tr key={s._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#F5F5F5', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {s.image ? <img src={`${BASE}${s.image}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🗂️'}
                            </div>
                            <span style={{ fontWeight: 600 }}>{s.name}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ background: '#E8F5E9', color: 'var(--green-600)', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{s.category?.name}</span>
                        </td>
                        <td style={{ fontSize: 13, color: '#888' }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-outline btn-sm" onClick={() => openEdit(s)}><Edit2 size={13} />Edit</button>
                            <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(s._id)}><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{modal === 'add' ? 'Add Sub Category' : 'Edit Sub Category'}</span>
              <button className="modal-close" onClick={() => setModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label required">Parent Category</label>
                <select className="form-control form-select" value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="">Select...</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label required">Sub Category Name</label>
                <input className="form-control" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Leafy Greens" autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Image (optional)</label>
                <div className="file-drop" onClick={() => imgRef.current?.click()} style={{ padding: 14 }}>
                  {image
                    ? <><img src={URL.createObjectURL(image)} alt="" style={{ height: 50, borderRadius: 6, marginBottom: 4 }} /></>
                    : editing?.image ? <img src={`${BASE}${editing.image}`} alt="" style={{ height: 50, borderRadius: 6 }} /> : <div style={{ fontSize: 13, color: '#888' }}>Click to upload (optional)</div>
                  }
                </div>
                <input ref={imgRef} type="file" accept="image/*" hidden onChange={e => setImage(e.target.files?.[0] || null)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner" />Saving...</> : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-box" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><span className="modal-title">Delete Sub Category</span></div>
            <div className="modal-body"><p style={{ fontSize: 14, color: '#555' }}>Delete this sub-category? This cannot be undone.</p></div>
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
