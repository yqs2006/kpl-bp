import { useState, useMemo } from 'react';

const TYPE_MAP = { 1: '战士', 2: '法师', 3: '坦克', 4: '刺客', 5: '射手', 6: '辅助' };
const CATEGORIES = ['全部', '坦克', '战士', '刺客', '法师', '射手', '辅助'];
const MANUAL_FIX = { 583: '刺客' };

function getHeroCategory(hero) {
  if (MANUAL_FIX[hero.ename]) return MANUAL_FIX[hero.ename];
  if (hero.hero_type && TYPE_MAP[hero.hero_type]) return TYPE_MAP[hero.hero_type];
  if (hero.hero_type2 && TYPE_MAP[hero.hero_type2]) return TYPE_MAP[hero.hero_type2];
  return '战士';
}

export default function HeroSelector({ heroes, onSelect, disabledIds = [] }) {
  const [activeTab, setActiveTab] = useState('全部');
  const [search, setSearch] = useState('');

  const filteredHeroes = useMemo(() => {
    return heroes.filter(hero => {
      const matchSearch = !search || hero.cname.includes(search);
      const matchTab = activeTab === '全部' || getHeroCategory(hero) === activeTab;
      return matchSearch && matchTab;
    });
  }, [heroes, activeTab, search]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveTab(cat)}
            style={{
              padding: '5px 14px', borderRadius: 14, cursor: 'pointer', fontSize: 12,
              border: activeTab === cat ? '2px solid #ffd700' : '1px solid #444',
              background: activeTab === cat ? 'rgba(255,215,0,0.1)' : 'transparent',
              color: activeTab === cat ? '#ffd700' : '#aaa',
              fontWeight: activeTab === cat ? 'bold' : 'normal',
            }}>
            {cat}
          </button>
        ))}
      </div>
      <input type="text" placeholder="搜索英雄..." value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%', padding: '8px 14px', borderRadius: 8, border: '1px solid #444',
          background: '#1a1a3e', color: '#fff', fontSize: 14, marginBottom: 12, outline: 'none', boxSizing: 'border-box',
        }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {filteredHeroes.map(hero => {
          const isDisabled = disabledIds.includes(hero.ename);
          return (
            <div key={hero.ename} onClick={() => !isDisabled && onSelect(hero.ename)}
              title={`${hero.cname} - ${getHeroCategory(hero)}`}
              style={{
                width: 58, textAlign: 'center', opacity: isDisabled ? 0.25 : 1,
                cursor: isDisabled ? 'not-allowed' : 'pointer', padding: 3, borderRadius: 6, transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!isDisabled) e.currentTarget.style.background = '#ffffff10'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
              <img
                src={`https://game.gtimg.cn/images/yxzj/img201606/heroimg/${hero.ename}/${hero.ename}.jpg`}
                alt={hero.cname} width="52" height="52"
                style={{ borderRadius: 8, display: 'block', margin: '0 auto', border: isDisabled ? '1px solid #333' : '1px solid #555' }} />
              <span style={{ fontSize: 10, color: '#bbb', display: 'block', marginTop: 2 }}>{hero.cname}</span>
            </div>
          );
        })}
      </div>
      {filteredHeroes.length === 0 && <div style={{ textAlign: 'center', padding: 30, color: '#666' }}>没有找到英雄</div>}
    </div>
  );
}