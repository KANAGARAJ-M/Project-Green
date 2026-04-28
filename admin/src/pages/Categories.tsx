import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import API from '../api';

interface Category { _id: string; name: string; image?: string; createdAt: string; }

const BASE = 'http://localhost:5000';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const imgRef = useRef<HTMLInputElement>(null);

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/admin/categories');
      setCategories(data.categories);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const openAdd = () => { setName(''); setImage(null); setEditing(null); setModal('add'); };
  const openEdit = (cat: Category) => { setEditing(cat); setName(cat.name); setImage(null); setModal('edit'); };

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Name required'); return; }
    setSaving(true);
    const fd = new FormData();
    fd.append('name', name.trim());
    if (image) fd.append('image', image);
    try {
      if (modal === 'add') { await API.post('/admin/categories', fd); toast.success('Category created'); }
      else { await API.put(`/admin/categories/${editing!._id}`, fd); toast.success('Category updated'); }
      setModal(null);
      fetch();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await API.delete(`/admin/categories/${id}`);
      toast.success('Category deleted');
      setDeleteId(null);
      fetch();
    } catch { toast.error('Delete failed'); }
  };

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Categories</div>
          <div className="topbar-subtitle">{categories.length} categories</div>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-primary" onClick={openAdd}><Plus size={16} />Add Category</button>
        </div>
      </div>

      <div className="page-content">
        <div className="card">
          <div className="card-body">
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>Loading...</div>
            ) : categories.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🏷️</div>
                <div className="empty-state-title">No categories yet</div>
                <div className="empty-state-text">Create your first category</div>
                <button className="btn btn-primary" onClick={openAdd}><Plus size={16} />Add Category</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
                {categories.map(cat => (
                  <div key={cat._id} style={{ background: '#FAFAFA', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', transition: 'all 0.15s' }}>
                    <div style={{ height: 100, background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {cat.image ? <img src={`${BASE}${cat.image}`} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 36 }}>🏷️</span>}
                    </div>
                    <div style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>{cat.name}</div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => openEdit(cat)}><Edit2 size={13} />Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(cat._id)}><Trash2 size={13} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{modal === 'add' ? 'Add Category' : 'Edit Category'}</span>
              <button className="modal-close" onClick={() => setModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label required">Category Name</label>
                <input className="form-control" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Vegetables" autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Image (optional)</label>
                <div className="file-drop" onClick={() => imgRef.current?.click()} style={{ padding: 16 }}>
                  {image
                    ? <><img src={URL.createObjectURL(image)} alt="" style={{ height: 60, borderRadius: 8, marginBottom: 4 }} /><div style={{ fontSize: 13, color: '#555' }}>{image.name}</div></>
                    : editing?.image
                      ? <><img src={`${BASE}${editing.image}`} alt="" style={{ height: 60, borderRadius: 8, marginBottom: 4 }} /><div style={{ fontSize: 12, color: '#888' }}>Click to change</div></>
                      : <div style={{ fontSize: 13, color: '#888' }}>Click to upload (optional)</div>
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
            <div className="modal-header"><span className="modal-title">Delete Category</span></div>
            <div className="modal-body">
              <div className="alert alert-warning">This will also delete all sub-categories under this category.</div>
              <p style={{ fontSize: 14, color: '#555' }}>Are you sure you want to delete this category?</p>
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
