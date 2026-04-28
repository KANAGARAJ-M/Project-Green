import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronLeft } from 'lucide-react';
import API from '../api';

const UNITS = ['g', 'kg', 'ml', 'l', 'pcs', 'pack', 'ton', 'dozen', 'bundle'];

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState({ name: '', description: '', highlights: '', unit: 'kg', price: '', discountPrice: '', stock: '', category: '', subCategory: '' });
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subCats, setSubCats] = useState<any[]>([]);
  const [filteredSubs, setFilteredSubs] = useState<any[]>([]);
  const imgRef = useRef<HTMLInputElement>(null);
  const setField = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    Promise.all([
      API.get(`/vendor/products/${id}`),
      API.get('/shared/categories'),
      API.get('/shared/subcategories'),
    ]).then(([prod, cats, subs]) => {
      const p = prod.data.product;
      setForm({ name: p.name, description: p.description, highlights: p.highlights || '', unit: p.unit, price: String(p.price), discountPrice: p.discountPrice ? String(p.discountPrice) : '', stock: String(p.stock), category: p.category?._id || '', subCategory: p.subCategory?._id || '' });
      setTags(p.tags || []);
      setExistingImages(p.images || []);
      setCategories(cats.data.categories);
      setSubCats(subs.data.subcategories);
    }).finally(() => setFetching(false));
  }, [id]);

  useEffect(() => {
    if (form.category) setFilteredSubs(subCats.filter((s: any) => s.category === form.category || s.category?._id === form.category));
    else setFilteredSubs([]);
  }, [form.category, subCats]);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t) && tags.length < 10) { setTags(prev => [...prev, t]); setTagInput(''); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    tags.forEach(t => fd.append('tags', t));
    existingImages.forEach(img => fd.append('existingImages', img));
    newImages.forEach(f => fd.append('images', f));

    try {
      await API.put(`/vendor/products/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Product updated and resubmitted for review!');
      navigate('/products');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <>
      <div className="topbar"><div className="topbar-title">Edit Product</div></div>
      <div className="page-content" style={{ textAlign: 'center', padding: 80, color: '#aaa' }}>Loading product...</div>
    </>
  );

  return (
    <>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}><ChevronLeft size={16} />Back</button>
          <div>
            <div className="topbar-title">Edit Product</div>
            <div className="topbar-subtitle">Editing will resubmit for admin review</div>
          </div>
        </div>
      </div>

      <div className="page-content">
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="card">
                <div className="card-header"><div className="card-title">Basic Information</div></div>
                <div className="card-body">
                  <div className="form-group">
                    <label className="form-label required">Product Name</label>
                    <input className="form-control" value={form.name} onChange={e => setField('name', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label required">Description</label>
                    <textarea className="form-control" rows={4} value={form.description} onChange={e => setField('description', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Key Highlights</label>
                    <textarea className="form-control" rows={2} value={form.highlights} onChange={e => setField('highlights', e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header"><div className="card-title">Pricing & Stock</div></div>
                <div className="card-body">
                  <div className="form-grid-3">
                    <div className="form-group">
                      <label className="form-label required">Price (₹)</label>
                      <input className="form-control" type="number" min="0" value={form.price} onChange={e => setField('price', e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Discount Price (₹)</label>
                      <input className="form-control" type="number" min="0" value={form.discountPrice} onChange={e => setField('discountPrice', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label required">Unit</label>
                      <select className="form-control form-select" value={form.unit} onChange={e => setField('unit', e.target.value)}>
                        {UNITS.map(u => <option key={u}>{u}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label required">Stock</label>
                      <input className="form-control" type="number" min="0" value={form.stock} onChange={e => setField('stock', e.target.value)} required />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header"><div className="card-title">Tags</div></div>
                <div className="card-body">
                  <div className="tag-field">
                    {tags.map(t => (
                      <span key={t} className="tag">{t}<button type="button" className="tag-remove" onClick={() => setTags(prev => prev.filter(x => x !== t))}>×</button></span>
                    ))}
                    <input className="tag-input" value={tagInput} onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); }
                        if (e.key === 'Backspace' && !tagInput && tags.length) setTags(prev => prev.slice(0, -1));
                      }}
                      placeholder={tags.length === 0 ? 'Add tags...' : ''} />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="card">
                <div className="card-header"><div className="card-title">Images</div></div>
                <div className="card-body">
                  {existingImages.length > 0 && (
                    <>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#555' }}>Current Images</div>
                      <div className="file-preview-grid">
                        {existingImages.map((img, i) => (
                          <div key={img} className="file-preview">
                            <img src={`http://localhost:5000${img}`} alt="" />
                            <button type="button" className="file-preview-remove" onClick={() => setExistingImages(prev => prev.filter((_, idx) => idx !== i))}>×</button>
                          </div>
                        ))}
                      </div>
                      <div style={{ height: 1, background: 'var(--border)', margin: '12px 0' }} />
                    </>
                  )}
                  <div className="file-drop" onClick={() => imgRef.current?.click()} style={{ padding: 16 }}>
                    <div style={{ fontSize: 13, color: '#888' }}>+ Add more images</div>
                  </div>
                  <input ref={imgRef} type="file" accept="image/*" multiple hidden onChange={e => {
                    const files = Array.from(e.target.files || []);
                    setNewImages(prev => [...prev, ...files].slice(0, 10 - existingImages.length));
                    e.target.value = '';
                  }} />
                  {newImages.length > 0 && (
                    <div className="file-preview-grid" style={{ marginTop: 8 }}>
                      {newImages.map((f, i) => (
                        <div key={i} className="file-preview">
                          <img src={URL.createObjectURL(f)} alt="" />
                          <button type="button" className="file-preview-remove" onClick={() => setNewImages(p => p.filter((_, idx) => idx !== i))}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="form-hint" style={{ marginTop: 8 }}>{existingImages.length + newImages.length}/10 images</div>
                </div>
              </div>

              <div className="card">
                <div className="card-header"><div className="card-title">Category</div></div>
                <div className="card-body">
                  <div className="form-group">
                    <label className="form-label required">Category</label>
                    <select className="form-control form-select" value={form.category} onChange={e => { setField('category', e.target.value); setField('subCategory', ''); }} required>
                      <option value="">Select category</option>
                      {categories.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                  {filteredSubs.length > 0 && (
                    <div className="form-group">
                      <label className="form-label">Sub Category</label>
                      <select className="form-control form-select" value={form.subCategory} onChange={e => setField('subCategory', e.target.value)}>
                        <option value="">None</option>
                        {filteredSubs.map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                {loading ? <><span className="spinner" />Saving...</> : '💾 Save Changes'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => navigate('/products')}>Cancel</button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
