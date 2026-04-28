import { useState, useEffect, useRef, useCallback } from 'react';
import API from '../api';

interface City { city: string; pincode: string; }

interface Props {
  state: string;
  district: string;
  city: string;
  pincode: string;
  onChange: (field: string, value: string) => void;
}

export default function AddressSelect({ state, district, city, pincode, onChange }: Props) {
  const [states, setStates] = useState<string[]>([]);
  const [districtMap, setDistrictMap] = useState<Record<string, string[]>>({});
  const [cityMap, setCityMap] = useState<Record<string, City[]>>({});

  // Derived lists from maps (no extra setState needed)
  const districts = state ? (districtMap[state] ?? []) : [];
  const cities = state && district ? (cityMap[`${state}|${district}`] ?? []) : [];

  const [stateSearch, setStateSearch] = useState('');
  const [districtSearch, setDistrictSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [showStateDD, setShowStateDD] = useState(false);
  const [showDistrictDD, setShowDistrictDD] = useState(false);
  const [showCityDD, setShowCityDD] = useState(false);

  const stateRef = useRef<HTMLDivElement>(null);
  const districtRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);

  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  // Fetch states once
  useEffect(() => {
    API.get('/location/states').then(r => setStates(r.data.states));
  }, []);

  // Fetch districts for selected state (cached)
  useEffect(() => {
    if (!state || districtMap[state]) return;
    let cancelled = false;
    API.get('/location/districts', { params: { state } }).then(r => {
      if (!cancelled) setDistrictMap(prev => ({ ...prev, [state]: r.data.districts }));
    });
    return () => { cancelled = true; };
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch cities for selected state+district (cached)
  useEffect(() => {
    if (!state || !district) return;
    const key = `${state}|${district}`;
    if (cityMap[key]) return;
    let cancelled = false;
    API.get('/location/cities', { params: { state, district } }).then(r => {
      if (!cancelled) setCityMap(prev => ({ ...prev, [key]: r.data.cities }));
    });
    return () => { cancelled = true; };
  }, [state, district]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (stateRef.current && !stateRef.current.contains(e.target as Node)) setShowStateDD(false);
      if (districtRef.current && !districtRef.current.contains(e.target as Node)) setShowDistrictDD(false);
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) setShowCityDD(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredStates = states.filter(s => s.toLowerCase().includes(stateSearch.toLowerCase()));
  const filteredDistricts = districts.filter(d => d.toLowerCase().includes(districtSearch.toLowerCase()));
  const filteredCities = cities.filter(c => c.city.toLowerCase().includes(citySearch.toLowerCase()));

  const selectState = useCallback((s: string) => {
    onChangeRef.current('state', s);
    onChangeRef.current('district', '');
    onChangeRef.current('city', '');
    onChangeRef.current('pincode', '');
    setStateSearch(''); setDistrictSearch(''); setCitySearch('');
    setShowStateDD(false);
  }, []);

  const selectDistrict = useCallback((d: string) => {
    onChangeRef.current('district', d);
    onChangeRef.current('city', '');
    onChangeRef.current('pincode', '');
    setDistrictSearch(''); setCitySearch('');
    setShowDistrictDD(false);
  }, []);

  const selectCity = useCallback((c: City) => {
    onChangeRef.current('city', c.city);
    onChangeRef.current('pincode', c.pincode);
    setCitySearch('');
    setShowCityDD(false);
  }, []);

  // Styles
  const ddListStyle: React.CSSProperties = {
    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
    background: '#fff', border: '1.5px solid var(--green-500)', borderTop: 'none',
    borderRadius: '0 0 4px 4px', maxHeight: 200, overflowY: 'auto',
    boxShadow: '0 8px 24px rgba(0,0,0,0.13)',
  };
  const itemBase: React.CSSProperties = {
    padding: '9px 14px', fontSize: 13, cursor: 'pointer', borderBottom: '1px solid #f5f5f5',
  };

  const Face = ({ value, placeholder, disabled, onClick }: { value: string; placeholder: string; disabled?: boolean; onClick: () => void }) => (
    <div
      className="form-control"
      style={{ borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 42, userSelect: 'none', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.55 : 1 }}
      onClick={disabled ? undefined : onClick}
    >
      <span style={{ color: value ? 'var(--text-dark)' : '#bbb', fontSize: 13.5, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: value ? 500 : 400 }}>
        {value || placeholder}
      </span>
      <span style={{ fontSize: 10, marginLeft: 6, flexShrink: 0 }}>▾</span>
    </div>
  );

  const SearchInput = ({ value, onChange: onSearch, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => (
    <div style={{ padding: '8px 10px', position: 'sticky', top: 0, background: '#fff', borderBottom: '1px solid #eee' }}>
      <input autoFocus className="form-control" style={{ fontSize: 13, padding: '6px 10px', borderRadius: 4 }} placeholder={placeholder} value={value} onChange={e => onSearch(e.target.value)} onClick={e => e.stopPropagation()} />
    </div>
  );

  const Item = ({ label, sub, active, onClick }: { label: string; sub?: string; active: boolean; onClick: () => void }) => (
    <div
      style={{ ...itemBase, background: active ? '#E8F5E9' : undefined, fontWeight: active ? 600 : 400 }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#f5f5f5'; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = ''; }}
      onClick={onClick}
    >
      {label}{sub && <span style={{ fontSize: 11, color: '#aaa', marginLeft: 8 }}>{sub}</span>}
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
      {/* ─ State ─ */}
      <div style={{ position: 'relative' }} ref={stateRef}>
        <label className="form-label required">State</label>
        <Face value={state} placeholder="Select state" onClick={() => setShowStateDD(v => !v)} />
        {showStateDD && (
          <div style={ddListStyle}>
            <SearchInput value={stateSearch} onChange={setStateSearch} placeholder="Search state..." />
            {filteredStates.length === 0
              ? <div style={{ ...itemBase, color: '#aaa' }}>No results</div>
              : filteredStates.map(s => <Item key={s} label={s} active={s === state} onClick={() => selectState(s)} />)
            }
          </div>
        )}
      </div>

      {/* ─ District ─ */}
      <div style={{ position: 'relative' }} ref={districtRef}>
        <label className="form-label required">District</label>
        <Face value={district} placeholder={state ? 'Select district' : 'Pick state first'} disabled={!state} onClick={() => setShowDistrictDD(v => !v)} />
        {showDistrictDD && state && (
          <div style={ddListStyle}>
            <SearchInput value={districtSearch} onChange={setDistrictSearch} placeholder="Search district..." />
            {filteredDistricts.length === 0
              ? <div style={{ ...itemBase, color: '#aaa' }}>No results</div>
              : filteredDistricts.map(d => <Item key={d} label={d} active={d === district} onClick={() => selectDistrict(d)} />)
            }
          </div>
        )}
      </div>

      {/* ─ City ─ */}
      <div style={{ position: 'relative' }} ref={cityRef}>
        <label className="form-label required">City / Village</label>
        <Face value={city} placeholder={district ? 'Select city' : 'Pick district first'} disabled={!district} onClick={() => setShowCityDD(v => !v)} />
        {showCityDD && district && (
          <div style={ddListStyle}>
            <SearchInput value={citySearch} onChange={setCitySearch} placeholder="Search city/village..." />
            {filteredCities.length === 0
              ? <div style={{ ...itemBase, color: '#aaa' }}>No results</div>
              : filteredCities.map((c, i) => <Item key={`${c.city}-${i}`} label={c.city} sub={c.pincode} active={c.city === city} onClick={() => selectCity(c)} />)
            }
          </div>
        )}
      </div>

      {/* Pincode confirmed */}
      {pincode && (
        <div style={{ gridColumn: 'span 3', fontSize: 12, color: 'var(--green-600)', fontWeight: 600, marginTop: -6 }}>
          ✓ Pincode auto-filled: <strong>{pincode}</strong>
        </div>
      )}
    </div>
  );
}
