import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Store, Save } from 'lucide-react';
import API from '../api';

interface VendorProfile {
  farmName?: string;
  shopDescription?: string;
  farmLogo?: string;
  city?: string;
  state?: string;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  unit: string;
  images: string[];
}

export default function ShopProfile() {
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    farmName: '',
    shopDescription: '',
  });

  useEffect(() => {
    Promise.all([
      API.get('/vendor/profile'),
      API.get('/vendor/products?status=approved&limit=100')
    ]).then(([profileRes, productsRes]) => {
      const v = profileRes.data.vendor;
      setVendor(v);
      setForm({
        farmName: v.farmName || '',
        shopDescription: v.shopDescription || '',
      });
      setProducts(productsRes.data.products);
    }).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await API.put('/vendor/shop-profile', form);
      toast.success('Shop profile updated!');
      setVendor(res.data.vendor);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to update shop profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <>
      <div className="topbar"><div className="topbar-title">Public Shop Profile</div></div>
      <div className="page-content" style={{ textAlign: 'center', padding: 80, color: '#aaa' }}>Loading...</div>
    </>
  );

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Public Shop Profile</div>
          <div className="topbar-subtitle">Customize how customers see your farm on GreenMarket</div>
        </div>
      </div>

      <div className="page-content">
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) 450px', gap: 24, alignItems: 'start' }}>
          
          {/* Settings Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card">
              <div className="card-header" style={{ paddingBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Store size={18} color="var(--green-600)" /><div className="card-title">Profile Settings</div>
                </div>
              </div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label required">Shop / Farm Name</label>
                  <input className="form-control" value={form.farmName} onChange={e => setForm(f => ({ ...f, farmName: e.target.value }))} required />
                  <div className="form-hint">This is the display name on your public storefront.</div>
                </div>

                <div className="form-group">
                  <label className="form-label">Shop Description / About Us</label>
                  <textarea className="form-control" rows={6} value={form.shopDescription} onChange={e => setForm(f => ({ ...f, shopDescription: e.target.value }))} placeholder="Tell customers about your farming practices, history, and values..." />
                </div>

                {/* Logo hint (We'll assume logo update is via another route or pending future implementation) */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Shop Logo</label>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    {vendor.farmLogo ? (
                      <img src={`http://localhost:5000${vendor.farmLogo}`} alt="Current Logo" style={{ height: 60, width: 60, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }} />
                    ) : (
                      <div style={{ height: 60, width: 60, borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 12 }}>No Logo</div>
                    )}
                    <div className="form-hint" style={{ margin: 0 }}>To update your logo, please contact admin support.</div>
                  </div>
                </div>
              </div>
              <div className="card-footer" style={{ borderTop: '1px solid var(--border)', padding: '16px 20px', background: '#fafafa', borderRadius: '0 0 8px 8px', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>

          {/* Preview Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card" style={{ background: '#fcfcfc', border: '2px dashed var(--border)' }}>
              <div className="card-header" style={{ paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                <div className="card-title" style={{ fontSize: 13, color: '#888' }}>Live Storefront Preview</div>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {/* Banner / Header Sim */}
                <div style={{ background: 'var(--green-50)', padding: '32px 20px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
                  {vendor.farmLogo ? (
                     <img src={`http://localhost:5000${vendor.farmLogo}`} alt="" style={{ height: 80, width: 80, borderRadius: '50%', border: '4px solid #fff', margin: '0 auto 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', objectFit: 'cover' }} />
                  ) : (
                     <div style={{ height: 80, width: 80, borderRadius: '50%', background: 'var(--green-600)', color: '#fff', border: '4px solid #fff', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700 }}>
                        {form.farmName.charAt(0).toUpperCase() || 'F'}
                     </div>
                  )}
                  <h2 style={{ margin: 0, color: 'var(--text-dark)', fontSize: 20, fontWeight: 800 }}>{form.farmName || 'Your Farm Name'}</h2>
                  <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>📍 {vendor.city}, {vendor.state}</div>
                </div>
                
                {/* About section sim */}
                {form.shopDescription && (
                  <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>About the Farm</div>
                    <div style={{ fontSize: 14, color: '#555', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{form.shopDescription}</div>
                  </div>
                )}

                {/* Products Grid sim */}
                <div style={{ padding: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#888', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Live Products ({products.length})</div>
                  {products.length === 0 ? (
                    <div style={{ fontSize: 13, color: '#aaa', fontStyle: 'italic' }}>No approved products yet.</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {products.slice(0, 4).map(p => (
                        <div key={p._id} style={{ border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden', padding: 8, background: '#fff' }}>
                          <img src={`http://localhost:5000${p.images[0]}`} style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 4 }} alt="" />
                          <div style={{ fontSize: 12, fontWeight: 600, marginTop: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--green-600)', fontWeight: 700, marginTop: 2 }}>₹{p.price} / {p.unit}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {products.length > 4 && <div style={{ fontSize: 12, color: 'var(--green-600)', textAlign: 'center', marginTop: 12, fontWeight: 600 }}>+ {products.length - 4} more products</div>}
                </div>
              </div>
            </div>
          </div>

        </form>
      </div>
    </>
  );
}
