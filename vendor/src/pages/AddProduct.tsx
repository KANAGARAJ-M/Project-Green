import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronLeft } from 'lucide-react';
import API from '../api';

const UNITS = ['g', 'kg', 'ml', 'l', 'pcs', 'pack', 'ton', 'dozen', 'bundle'];

interface Category { _id: string; name: string; }
interface SubCat { _id: string; name: string; category: string; }

export default function AddProduct() {
  const [form, setForm] = useState({
    name: '', description: '', highlights: '',
    unit: 'kg', price: '', mrp: '', stock: '',
    category: '', subCategory: '',
  });
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCats, setSubCats] = useState<SubCat[]>([]);
  
  // Derived state to avoid setState-in-effect lint
  const filteredSubs = useMemo(() => {
    if (!form.category) return [];
    return subCats.filter(s => {
      // Handle populated category object
      const catId = typeof s.category === 'object' ? (s.category as { _id: string })._id : s.category;
      return catId === form.category;
    });
  }, [form.category, subCats]);

  const [loading, setLoading] = useState(false);
  const imgRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const setField = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    API.get('/shared/categories').then(r => setCategories(r.data.categories));
    API.get('/shared/subcategories').then(r => setSubCats(r.data.subcategories));
  }, []);

  // Remove old useEffect since we use useMemo now

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t) && tags.length < 10) { setTags(prev => [...prev, t]); setTagInput(''); }
  };

  const handleTagKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); }
    if (e.key === 'Backspace' && !tagInput && tags.length) setTags(prev => prev.slice(0, -1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.stock || !form.category) {
      toast.error('Fill all required fields'); return;
    }
    if (images.length === 0) { toast.error('Add at least 1 product image'); return; }

    setLoading(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    tags.forEach(t => fd.append('tags', t));
    images.forEach(f => fd.append('images', f));

    try {
      await API.post('/vendor/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Product submitted for admin review!');
      navigate('/products');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to submit product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}><ChevronLeft size={16} />Back</button>
          <div>
            <div className="topbar-title">Add New Product</div>
            <div className="topbar-subtitle">Fill in product details (will be reviewed by admin)</div>
          </div>
        </div>
      </div>

      <div className="page-content">
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
            {/* Left col */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="card">
                <div className="card-header"><div className="card-title">Basic Information</div></div>
                <div className="card-body">
                  <div className="form-group">
                    <label className="form-label required">Product Name</label>
                    <input className="form-control" value={form.name} onChange={e => setField('name', e.target.value)} placeholder="e.g. Organic Tomatoes" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label required">Description</label>
                    <textarea className="form-control" rows={4} value={form.description} onChange={e => setField('description', e.target.value)} placeholder="Describe your product in detail..." required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Key Highlights</label>
                    <textarea className="form-control" rows={2} value={form.highlights} onChange={e => setField('highlights', e.target.value)} placeholder="e.g. No pesticides, Hand-picked, Sun-dried..." />
                    <div className="form-hint">Comma-separated highlights that make this product special</div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header"><div className="card-title">Pricing & Stock</div></div>
                <div className="card-body">
                  <div className="form-grid-3">
                    <div className="form-group">
                      <label className="form-label">MRP (₹)</label>
                      <input className="form-control" type="number" min="0" step="0.01" value={form.mrp} onChange={e => setField('mrp', e.target.value)} placeholder="0.00" />
                    </div>
                    <div className="form-group">
                      <label className="form-label required">Selling Price (₹)</label>
                      <input className="form-control" type="number" min="0" step="0.01" value={form.price} onChange={e => setField('price', e.target.value)} placeholder="0.00" required />
                    </div>
                    <div className="form-group">
                      <label className="form-label required">Unit</label>
                      <select className="form-control form-select" value={form.unit} onChange={e => setField('unit', e.target.value)}>
                        {UNITS.map(u => <option key={u}>{u}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label required">Stock Quantity</label>
                      <input className="form-control" type="number" min="0" value={form.stock} onChange={e => setField('stock', e.target.value)} placeholder="e.g. 100" required />
                      <div className="form-hint">In units of {form.unit}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header"><div className="card-title">Tags</div></div>
                <div className="card-body">
                  <div className="form-group">
                    <label className="form-label">Product Tags</label>
                    <div className="tag-field">
                      {tags.map(t => (
                        <span key={t} className="tag">{t}<button type="button" className="tag-remove" onClick={() => setTags(prev => prev.filter(x => x !== t))}>×</button></span>
                      ))}
                      <input className="tag-input" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleTagKey} placeholder={tags.length === 0 ? 'Type and press Enter or comma...' : ''} />
                    </div>
                    <div className="form-hint">Press Enter or comma to add tag. Max 10 tags.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right col */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="card">
                <div className="card-header"><div className="card-title">Product Images</div></div>
                <div className="card-body">
                  <div className="file-drop" onClick={() => imgRef.current?.click()}>
                    <div className="file-drop-icon">📷</div>
                    <div className="file-drop-text">Click to add images</div>
                    <div className="file-drop-hint">Up to 10 images • First image should be on white background</div>
                  </div>
                  <input ref={imgRef} type="file" accept="image/*" multiple hidden onChange={e => {
                    const files = Array.from(e.target.files || []);
                    setImages(prev => [...prev, ...files].slice(0, 10));
                    e.target.value = '';
                  }} />
                  {images.length > 0 && (
                    <div className="file-preview-grid" style={{ marginTop: 12 }}>
                      {images.map((f, i) => (
                        <div key={i} className="file-preview">
                          <img src={URL.createObjectURL(f)} alt="" />
                          <button type="button" className="file-preview-remove" onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}>×</button>
                          {i === 0 && <div style={{ position: 'absolute', bottom: 2, left: 2, background: 'var(--green-600)', color: '#fff', fontSize: 9, padding: '1px 4px', borderRadius: 4 }}>Main</div>}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="form-hint" style={{ marginTop: 8 }}>{images.length}/10 images added</div>
                </div>
              </div>

              <div className="card">
                <div className="card-header"><div className="card-title">Category</div></div>
                <div className="card-body">
                  <div className="form-group">
                    <label className="form-label required">Category</label>
                    <select className="form-control form-select" value={form.category} onChange={e => { setField('category', e.target.value); setField('subCategory', ''); }} required>
                      <option value="">Select category</option>
                      {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                  {filteredSubs.length > 0 && (
                    <div className="form-group">
                      <label className="form-label">Sub Category</label>
                      <select className="form-control form-select" value={form.subCategory} onChange={e => setField('subCategory', e.target.value)}>
                        <option value="">None</option>
                        {filteredSubs.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                  {loading ? <><span className="spinner" />Submitting...</> : '🌿 Submit for Review'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => navigate('/products')}>Cancel</button>
              </div>

              <div className="alert alert-info" style={{ fontSize: 13 }}>
                ℹ️ Your product will be reviewed by admin before becoming visible to customers.
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
