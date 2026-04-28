import { useEffect, useState } from 'react';
import API from '../api';
import { User, MapPin, Building2, CreditCard, FileText, CheckCircle, Clock, XCircle } from 'lucide-react';

export default function Profile() {
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/vendor/profile').then(r => setVendor(r.data.vendor)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <>
      <div className="topbar"><div className="topbar-title">My Profile</div></div>
      <div className="page-content" style={{ textAlign: 'center', padding: 80, color: '#aaa' }}>Loading...</div>
    </>
  );

  if (!vendor) return null;

  const statusIcon = vendor.status === 'approved' ? <CheckCircle size={16} className="text-green-500" /> : vendor.status === 'pending' ? <Clock size={16} /> : <XCircle size={16} />;

  const InfoRow = ({ label, value }: { label: string; value?: string }) =>
    value ? <div style={{ display: 'flex', gap: 8, padding: '8px 0', borderBottom: '1px solid #f5f5f5', fontSize: 14 }}>
      <span style={{ color: '#888', minWidth: 160, flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div> : null;

  const DocLink = ({ label, path }: { label: string; path?: string }) =>
    path ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5', fontSize: 14 }}>
      <span style={{ color: '#555' }}>{label}</span>
      <a href={`http://localhost:5000${path}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">View</a>
    </div> : null;

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">My Profile</div>
          <div className="topbar-subtitle">Your farm account details</div>
        </div>
        <div className="topbar-actions">
          <span className={`badge badge-${vendor.status}`}>{statusIcon} {vendor.status}</span>
        </div>
      </div>

      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Personal */}
          <div className="card">
            <div className="card-header" style={{ paddingBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={18} color="var(--green-600)" /><div className="card-title">Personal Info</div>
              </div>
            </div>
            <div className="card-body">
              <InfoRow label="Name" value={vendor.name} />
              <InfoRow label="Email" value={vendor.email} />
              <InfoRow label="Phone" value={vendor.phone} />
              <InfoRow label="ID Proof Type" value={vendor.addressProofType} />
              <InfoRow label="ID Number" value={vendor.addressProofNumber} />
              {vendor.gst && <InfoRow label="GST Number" value={vendor.gst} />}
            </div>
          </div>

          {/* Address */}
          <div className="card">
            <div className="card-header" style={{ paddingBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={18} color="var(--green-600)" /><div className="card-title">Address</div>
              </div>
            </div>
            <div className="card-body">
              <InfoRow label="Full Address" value={vendor.fullAddress} />
              <InfoRow label="City" value={vendor.city} />
              <InfoRow label="District" value={vendor.district} />
              <InfoRow label="State" value={vendor.state} />
              <InfoRow label="Country" value={vendor.country} />
              <InfoRow label="Pincode" value={vendor.pincode} />
              <InfoRow label="Landmark" value={vendor.landmark} />
              {vendor.mapLat && <InfoRow label="Coordinates" value={`${vendor.mapLat}, ${vendor.mapLng}`} />}
            </div>
          </div>

          {/* Farm */}
          <div className="card">
            <div className="card-header" style={{ paddingBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={18} color="var(--green-600)" /><div className="card-title">Farm Details</div>
              </div>
            </div>
            <div className="card-body">
              {vendor.farmLogo && (
                <div style={{ marginBottom: 16 }}>
                  <img src={`http://localhost:5000${vendor.farmLogo}`} alt="Farm Logo" style={{ height: 64, borderRadius: 10, border: '1px solid var(--border)' }} />
                </div>
              )}
              <InfoRow label="Farm Name" value={vendor.farmName} />
              <InfoRow label="Farm Size" value={vendor.farmSize} />
              <InfoRow label="Farm Type" value={vendor.farmType} />
              {vendor.farmImages?.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>Farm Images</div>
                  <div className="img-gallery">
                    {vendor.farmImages.map((img: string) => (
                      <img key={img} src={`http://localhost:5000${img}`} alt="" className="img-thumb" onClick={() => window.open(`http://localhost:5000${img}`, '_blank')} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bank */}
          <div className="card">
            <div className="card-header" style={{ paddingBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CreditCard size={18} color="var(--green-600)" /><div className="card-title">Bank Details</div>
              </div>
            </div>
            <div className="card-body">
              <InfoRow label="Bank Name" value={vendor.bankName} />
              <InfoRow label="Account Holder" value={vendor.bankAccountHolder} />
              <InfoRow label="Account No." value={`****${vendor.bankAccountNumber?.slice(-4)}`} />
              <InfoRow label="IFSC Code" value={vendor.bankIFSC} />
            </div>
          </div>

          {/* Documents */}
          <div className="card" style={{ gridColumn: 'span 2' }}>
            <div className="card-header" style={{ paddingBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={18} color="var(--green-600)" /><div className="card-title">Documents</div>
              </div>
            </div>
            <div className="card-body">
              <DocLink label={`${vendor.addressProofType} (Address Proof)`} path={vendor.addressProofImage} />
              <DocLink label="Patta / Chitta / Adangal" path={vendor.pattaChitta} />
              <DocLink label="Land Ownership Document" path={vendor.landOwnership} />
              <DocLink label="Lease Agreement" path={vendor.leaseAgreement} />
              <DocLink label="Farmer ID Card" path={vendor.farmerIdCard} />
              <DocLink label="Organic Certification" path={vendor.organicCertification} />
            </div>
          </div>
        </div>

        {vendor.status === 'rejected' && vendor.rejectionRemark && (
          <div className="alert alert-error" style={{ marginTop: 20 }}>
            ❌ <strong>Rejection Reason:</strong> {vendor.rejectionRemark}. Please contact support to resolve this.
          </div>
        )}
        {vendor.status === 'pending' && (
          <div className="alert alert-warning" style={{ marginTop: 20 }}>
            ⏳ Your account is pending admin verification. You'll receive an email once approved.
          </div>
        )}
      </div>
    </>
  );
}
