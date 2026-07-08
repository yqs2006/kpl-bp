import { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { bpReducer, initialState, phaseOrder, getCurrentSide, isBanPhase } from './state/bpReducer';
import HeroSelector from './components/HeroSelector';
import { playSound, handleTimerSound, resetTimerSound, playPeakBGM, stopPeakBGM } from './utils/sound';
import html2canvas from 'html2canvas';
import { useMultiplayer } from './hooks/useMultiplayer';

function HeroAvatar({ hero, size = 48, dimmed = false, onClick, selected }) {
  if (!hero) return <div style={{ width: size, height: size, background: '#1a1a2e', borderRadius: 8, border: '1px dashed #333', flexShrink: 0 }} />;
  return (
    <div style={{ textAlign: 'center', flexShrink: 0, width: size + 6, cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick} title={onClick ? '点击交换位置' : hero.cname}>
      <img src={`https://game.gtimg.cn/images/yxzj/img201606/heroimg/${hero.ename}/${hero.ename}.jpg`}
        alt={hero.cname} width={size} height={size}
        style={{ borderRadius: 8, display: 'block', opacity: dimmed ? 0.35 : 1,
          border: selected ? '2px solid #ffd700' : dimmed ? '1px solid #444' : '1px solid #888' }} />
      <span style={{ fontSize: 9, color: dimmed ? '#555' : '#ccc', display: 'block', marginTop: 2 }}>{hero.cname}</span>
    </div>
  );
}

function TeamPanel({ side, bans, picks, history, heroes, banMax = 5, pickMax = 5, pendingHero, isConfirming, teamName, teamColor, onSwapPick, swapMode, selectedSwapIndex, onSelectSwap, onEditName, onChangeTeam }) {
  const isBlue = side === 'blue';
  const getHero = (id) => heroes.find(h => h.ename === id);
  return (
    <div style={{
      flex: 1, borderRadius: 12, padding: 16,
      background: isBlue ? 'linear-gradient(180deg, #0a1628, #061020)' : 'linear-gradient(180deg, #280a0a, #1a0505)',
      border: `2px solid ${teamColor || (isBlue ? '#2563eb' : '#dc2626')}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: teamColor || (isBlue ? '#2563eb' : '#dc2626'),
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold', color: '#fff', flexShrink: 0 }}>
            {teamName?.charAt(0) || '队'}
          </div>
          <h3 onClick={onEditName} style={{ margin: 0, color: '#fff', fontSize: 16, cursor: 'pointer', borderBottom: '1px dashed transparent', paddingBottom: 2 }}
            onMouseEnter={e => e.currentTarget.style.borderBottom = '1px dashed #888'}
            onMouseLeave={e => e.currentTarget.style.borderBottom = '1px dashed transparent'} title="点击修改队名">
            {teamName || '未命名'}
          </h3>
          <button onClick={onChangeTeam} style={{ padding: '2px 8px', fontSize: 10, background: '#1a1a3e', color: '#888', border: '1px solid #333', borderRadius: 8, cursor: 'pointer' }} title="更换战队">换队</button>
        </div>
        {picks.length >= 2 && (
          <button onClick={onSwapPick} style={{ padding: '3px 10px', fontSize: 11, background: swapMode ? '#ffd700' : '#333',
            color: swapMode ? '#000' : '#888', border: 'none', borderRadius: 10, cursor: 'pointer' }}>
            {swapMode ? '交换中' : '交换'}
          </button>
        )}
      </div>
      {history.length > 0 && (
        <div style={{ marginBottom: 12, padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: '#555', marginBottom: 6 }}>历史对局</div>
          {history.map(h => (
            <div key={h.match} style={{ marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: '#777' }}>第{h.match}局</span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
                <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                  <span style={{ fontSize: 9, color: '#555' }}>禁</span>
                  {h.bans.map(id => <img key={id} src={`https://game.gtimg.cn/images/yxzj/img201606/heroimg/${id}/${id}.jpg`}
                    width="22" height="22" style={{ borderRadius: 4, opacity: 0.4 }} title={getHero(id)?.cname} />)}
                </div>
                <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                  <span style={{ fontSize: 9, color: '#555' }}>选</span>
                  {h.picks.map(id => <img key={id} src={`https://game.gtimg.cn/images/yxzj/img201606/heroimg/${id}/${id}.jpg`}
                    width="22" height="22" style={{ borderRadius: 4 }} title={getHero(id)?.cname} />)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>禁用 ({bans.length}/{banMax})</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {bans.map(id => <HeroAvatar key={id} hero={getHero(id)} dimmed />)}
          {[...Array(Math.max(0, banMax - bans.length))].map((_, i) => <HeroAvatar key={`eb-${i}`} />)}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>选择 ({picks.length}/{pickMax})</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {picks.map((id, idx) => (
            <HeroAvatar key={id} hero={getHero(id)}
              selected={swapMode && selectedSwapIndex === idx}
              onClick={swapMode ? () => onSelectSwap(idx) : undefined} />
          ))}
          {isConfirming && pendingHero && (
            <div style={{ flexShrink: 0, textAlign: 'center', animation: 'popIn 0.3s ease-out' }}>
              <img src={`https://game.gtimg.cn/images/yxzj/img201606/heroimg/${pendingHero.ename}/${pendingHero.ename}.jpg`}
                alt={pendingHero.cname} width="80" height="80"
                style={{ borderRadius: 12, border: '3px solid #ffd700', boxShadow: '0 0 20px rgba(255,215,0,0.4)', animation: 'pulse 0.8s infinite' }} />
              <span style={{ fontSize: 11, color: '#ffd700', display: 'block', marginTop: 4, fontWeight: 'bold' }}>{pendingHero.cname}</span>
            </div>
          )}
          {[...Array(Math.max(0, pickMax - picks.length - (isConfirming && pendingHero ? 1 : 0)))].map((_, i) => <HeroAvatar key={`ep-${i}`} />)}
        </div>
      </div>
    </div>
  );
}

function PeakPanel({ side, picks, heroes, locked, onToggleHero, onLock, disabledIds, isRevealed, teamName, teamColor }) {
  const isBlue = side === 'blue';
  const getHero = (id) => heroes.find(h => h.ename === id);
  return (
    <div style={{
      flex: 1, borderRadius: 12, padding: 16,
      background: isBlue ? 'linear-gradient(180deg, #0a1628, #061020)' : 'linear-gradient(180deg, #280a0a, #1a0505)',
      border: `2px solid ${teamColor || (isBlue ? '#2563eb' : '#dc2626')}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: teamColor || (isBlue ? '#2563eb' : '#dc2626'),
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold', color: '#fff' }}>
          {teamName?.charAt(0) || '队'}
        </div>
        <h3 style={{ margin: 0, color: '#fff', fontSize: 16 }}>{teamName || '未命名'} {locked ? '已锁定' : '选择中'}</h3>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {picks.map(id => <HeroAvatar key={id} hero={getHero(id)} />)}
        {[...Array(Math.max(0, 5 - picks.length))].map((_, i) => <HeroAvatar key={`pk-${i}`} />)}
      </div>
      {!isRevealed && (
        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {heroes.map(hero => {
              const sel = picks.includes(hero.ename);
              const banned = disabledIds.includes(hero.ename) && !sel;
              return (
                <div key={hero.ename} onClick={() => !locked && !banned && onToggleHero(hero.ename)}
                  style={{ width: 48, textAlign: 'center', cursor: locked || banned ? 'not-allowed' : 'pointer',
                    opacity: banned ? 0.2 : sel ? 1 : 0.7, padding: 2, borderRadius: 6,
                    background: sel ? 'rgba(255,215,0,0.2)' : 'transparent', border: sel ? '2px solid #ffd700' : '1px solid transparent' }}>
                  <img src={`https://game.gtimg.cn/images/yxzj/img201606/heroimg/${hero.ename}/${hero.ename}.jpg`}
                    alt={hero.cname} width="44" height="44" style={{ borderRadius: 6, display: 'block', margin: '0 auto' }} />
                  <span style={{ fontSize: 9, color: '#bbb' }}>{hero.cname}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {!locked && !isRevealed && (
        <button onClick={onLock} disabled={picks.length !== 5}
          style={{ marginTop: 12, padding: '10px 30px', fontSize: 16, fontWeight: 'bold', cursor: picks.length === 5 ? 'pointer' : 'not-allowed',
            background: picks.length === 5 ? '#ffd700' : '#333', color: picks.length === 5 ? '#000' : '#666', border: 'none', borderRadius: 8, width: '100%' }}>
          锁定阵容
        </button>
      )}
    </div>
  );
}

function App() {
  const [heroes, setHeroes] = useState([]);
  const [teams, setTeams] = useState([]);
  const [state, dispatch] = useReducer(bpReducer, initialState);
  const timerRef = useRef(null);
  const [swapMode, setSwapMode] = useState({ blue: false, red: false });
  const [swapIndex, setSwapIndex] = useState({ blue: null, red: null });
  const [editingTeam, setEditingTeam] = useState(null);
  const [editName, setEditName] = useState('');
  const [showTeamSelect, setShowTeamSelect] = useState(false);
  const [selectingSide, setSelectingSide] = useState(null);
  const [blueTeamColor, setBlueTeamColor] = useState(null);
  const [redTeamColor, setRedTeamColor] = useState(null);
  const captureRef = useRef(null);
  
  const [multiMode, setMultiMode] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  const currentPhase = phaseOrder[state.currentPhaseIndex];
  const currentSide = getCurrentSide(currentPhase);
  const banNow = isBanPhase(currentPhase);
  const pendingHero = state.pendingPick ? heroes.find(h => h.ename === state.pendingPick) : null;
  const isComplete = currentPhase === 'COMPLETE';
  const isPeak = state.mode === 'peak';

  const { connected, roomCode, mySide, status, isMyTurn, createRoom, joinRoom, leaveRoom, sendAction } = useMultiplayer(dispatch, currentSide, isPeak);

  const multiplayerDispatch = useCallback((action) => {
    dispatch(action);
    if (multiMode && mySide && action.type !== 'TICK_TIMER') {
      sendAction(action);
    }
  }, [dispatch, multiMode, mySide, sendAction]);

  useEffect(() => {
    fetch('/data/herolist.json').then(res => res.json()).then(data => setHeroes(data));
    fetch('/data/teams.json').then(res => res.json()).then(data => setTeams(data));
  }, []);

  useEffect(() => {
    const shouldRun = !isComplete && !isPeak && (!multiMode || isMyTurn);
    if (!shouldRun) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      return;
    }
    timerRef.current = setInterval(() => multiplayerDispatch({ type: 'TICK_TIMER' }), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isComplete, isPeak, multiMode, isMyTurn, multiplayerDispatch]);

  useEffect(() => { handleTimerSound(state.timer, isComplete || isPeak); }, [state.timer]);

  useEffect(() => {
    if (state.timer <= 0 && !isComplete && !isPeak && !state.isPaused) {
      // 多人模式下完全禁用自动推进，双方必须手动操作
      if (multiMode) return;
      if (state.isConfirming && state.pendingPick) {
        multiplayerDispatch({ type: 'CONFIRM_PICK', team: currentSide, heroId: state.pendingPick });
      } else {
        multiplayerDispatch({ type: 'NEXT_PHASE' });
      }
    }
  }, [state.timer, multiMode]);

  useEffect(() => {
    const handleKey = (e) => {
      if (editingTeam || showTeamSelect) return;
      if (e.key === 'Enter' && state.isConfirming && state.pendingPick) {
        playSound('confirm');
        multiplayerDispatch({ type: 'CONFIRM_PICK', team: currentSide, heroId: state.pendingPick });
      }
      if (e.key === 'Escape' && state.isConfirming) {
        multiplayerDispatch({ type: 'CANCEL_PICK' });
      }
      if (e.ctrlKey && e.key === 'z' && !isPeak && !multiMode) {
        e.preventDefault();
        dispatch({ type: 'UNDO' });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [state.isConfirming, state.pendingPick, currentSide, isPeak, editingTeam, showTeamSelect, multiMode, multiplayerDispatch]);

  const allBanned = [...state.blueBans, ...state.redBans];
  const allPicked = [...state.bluePicks, ...state.redPicks];
  const currentTeamUsed = currentSide === 'blue' ? state.blueHistory.flatMap(h => h.picks) : state.redHistory.flatMap(h => h.picks);
  const allUsed = [...state.blueHistory.flatMap(h => h.picks), ...state.redHistory.flatMap(h => h.picks)];
  const disabledIds = [...allBanned, ...allPicked, ...currentTeamUsed, ...allUsed];
  if (state.pendingPick) disabledIds.push(state.pendingPick);

const handleBan = (heroId) => {
  if (!currentPhase || isComplete || state.timer <= 0) return;
  if (multiMode && !isMyTurn) return;
  playSound('switch');
  if (multiMode) {
    multiplayerDispatch({ type: 'BAN_AND_NEXT', team: currentSide, heroId });
  } else {
    multiplayerDispatch({ type: 'BAN_HERO', team: currentSide, heroId });
    multiplayerDispatch({ type: 'NEXT_PHASE' });
  }
};
  const handlePickSelect = (heroId) => {
    if (!currentPhase || isComplete || state.timer <= 0) return;
    if (multiMode && !isMyTurn) return;
    multiplayerDispatch({ type: 'SELECT_FOR_PICK', heroId });
  };

  const handleConfirm = () => {
    if (!state.pendingPick) return;
    if (multiMode && !isMyTurn) return;
    playSound('confirm');
    multiplayerDispatch({ type: 'CONFIRM_PICK', team: currentSide, heroId: state.pendingPick });
  };

  const handleCancel = () => multiplayerDispatch({ type: 'CANCEL_PICK' });

  const handleUndo = () => {
    if (multiMode) return;
    dispatch({ type: 'UNDO' });
  };

  const handleSwapPick = (side) => {
    setSwapMode(prev => ({ ...prev, [side]: !prev[side] }));
    setSwapIndex(prev => ({ ...prev, [side]: null }));
  };

  const handleSelectSwap = (side, idx) => {
    const cur = swapIndex[side];
    if (cur === null) {
      setSwapIndex(prev => ({ ...prev, [side]: idx }));
    } else {
      dispatch({ type: 'SWAP_PICKS', team: side, indexA: cur, indexB: idx });
      setSwapMode(prev => ({ ...prev, [side]: false }));
      setSwapIndex(prev => ({ ...prev, [side]: null }));
    }
  };

  const openEditTeam = (side) => {
    setEditingTeam(side);
    setEditName(side === 'blue' ? state.blueTeamName : state.redTeamName);
  };
  const confirmEditTeam = () => {
    if (editName.trim()) {
      dispatch({ type: 'SET_TEAM_NAME', side: editingTeam, name: editName.trim() });
    }
    setEditingTeam(null);
  };

  const openTeamSelect = (side) => {
    setSelectingSide(side);
    setShowTeamSelect(true);
  };
  const selectTeam = (team) => {
    dispatch({ type: 'SET_TEAM_NAME', side: selectingSide, name: team.name });
    if (selectingSide === 'blue') setBlueTeamColor(team.color);
    else setRedTeamColor(team.color);
    setShowTeamSelect(false);
  };

  const handleScreenshot = async () => {
    if (captureRef.current) {
      const canvas = await html2canvas(captureRef.current, { backgroundColor: '#020208' });
      const link = document.createElement('a');
      link.download = `KPL_BP_第${state.currentMatch}局.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const handlePeakToggleBlue = (id) => {
    if (multiMode && mySide !== 'blue') return;
    multiplayerDispatch({ type: 'PEAK_SELECT_BLUE', heroId: id });
  };
  const handlePeakToggleRed = (id) => {
    if (multiMode && mySide !== 'red') return;
    multiplayerDispatch({ type: 'PEAK_SELECT_RED', heroId: id });
  };
  const handlePeakLockBlue = () => {
    if (multiMode && mySide !== 'blue') return;
    multiplayerDispatch({ type: 'PEAK_LOCK_BLUE' });
  };
  const handlePeakLockRed = () => {
    if (multiMode && mySide !== 'red') return;
    multiplayerDispatch({ type: 'PEAK_LOCK_RED' });
  };
  const bothLocked = state.bluePeakLocked && state.redPeakLocked;

  useEffect(() => {
    if (bothLocked && !state.peakRevealed) {
      playPeakBGM();
      const t = setTimeout(() => { dispatch({ type: 'PEAK_REVEAL' }); playSound('peak_reveal'); }, 2000);
      return () => clearTimeout(t);
    }
  }, [bothLocked]);
  useEffect(() => {
    if (state.peakRevealed) { const t = setTimeout(() => stopPeakBGM(), 5000); return () => clearTimeout(t); }
  }, [state.peakRevealed]);

  const timerColor = state.timer <= 5 ? '#ff4444' : state.timer <= 10 ? '#ffaa00' : '#fff';
  const phaseBg = isComplete ? '#ffd70020' : currentSide === 'blue' ? '#3b82f620' : currentSide === 'red' ? '#dc262620' : '#333';

  return (
    <div style={{ background: 'radial-gradient(ellipse at center, #0a0a20 0%, #020208 100%)', minHeight: '100vh', color: '#fff', fontFamily: 'Arial, sans-serif', padding: 20 }}>
      <style>{`
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
        @keyframes popIn { from{opacity:0;transform:scale(0.5)} to{opacity:1;transform:scale(1)} }
        @keyframes reveal { 0%{opacity:0;transform:scale(1.2)} 50%{opacity:1;transform:scale(0.95)} 100%{opacity:1;transform:scale(1)} }
        @keyframes glow { 0%,100%{box-shadow:0 0 5px rgba(255,215,0,0.3)} 50%{box-shadow:0 0 20px rgba(255,215,0,0.6)} }
      `}</style>

      <div style={{ maxWidth: 1400, margin: '0 auto' }} ref={captureRef}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ color: '#888', fontSize: 13 }}>赛制</span>
            {[1, 3, 5, 7].map(n => (
              <button key={n} onClick={() => dispatch({ type: 'SET_TOTAL_MATCHES', count: n })}
                style={{ padding: '4px 12px', borderRadius: 14, cursor: 'pointer', fontSize: 12,
                  background: state.totalMatches === n ? '#ffd700' : '#1a1a3e',
                  color: state.totalMatches === n ? '#000' : '#aaa',
                  border: state.totalMatches === n ? '2px solid #ffd700' : '1px solid #333' }}>BO{n}</button>
            ))}
            {!multiMode ? (
              <button onClick={() => setMultiMode(true)}
                style={{ padding: '6px 14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, marginLeft: 8 }}>
                👥 双人对战
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginLeft: 8 }}>
                {status === 'idle' && (
                  <>
                    <button onClick={createRoom} style={{ padding: '5px 12px', background: '#4caf50', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>创建房间</button>
                    <input placeholder="房间码" value={joinCode} onChange={e => setJoinCode(e.target.value)}
                      style={{ padding: '5px 10px', width: 90, background: '#1a1a3e', border: '1px solid #444', borderRadius: 6, color: '#fff', fontSize: 12 }} />
                    <button onClick={() => joinRoom(joinCode)} style={{ padding: '5px 12px', background: '#2196f3', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>加入</button>
                  </>
                )}
                {status === 'waiting' && (
                  <span style={{ color: '#ffd700', fontSize: 13 }}>⏳ 等待对手... 房间码: <b>{roomCode}</b></span>
                )}
                {status === 'ready' && (
                  <span style={{ color: '#4caf50', fontSize: 13 }}>
                    ✅ 已连接 ({mySide === 'blue' ? '蓝方' : '红方'})
                    <button onClick={leaveRoom} style={{ marginLeft: 6, padding: '3px 8px', background: '#333', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>退出</button>
                  </span>
                )}
                <button onClick={() => { leaveRoom(); setMultiMode(false); }}
                  style={{ padding: '5px 10px', background: '#555', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>关闭</button>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => dispatch({ type: 'SET_MODE', mode: isPeak ? 'normal' : 'peak' })}
              style={{ padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 14,
                background: isPeak ? '#dc2626' : 'linear-gradient(135deg, #ffd700, #ffaa00)',
                color: isPeak ? '#fff' : '#000', border: 'none' }}>{isPeak ? '退出巅峰对决' : '⚡ 巅峰对决'}</button>
            <button onClick={handleScreenshot}
              style={{ padding: '8px 16px', background: '#1a1a3e', color: '#aaa', border: '1px solid #333', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>📷 截图</button>
            <button onClick={() => { dispatch({ type: 'RESET' }); resetTimerSound(); stopPeakBGM(); setBlueTeamColor(null); setRedTeamColor(null); }}
              style={{ padding: '8px 16px', background: '#1a1a3e', color: '#aaa', border: '1px solid #333', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>🔄 重置</button>
          </div>
        </div>

        {editingTeam && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
            <div style={{ background: '#1a1a3e', padding: 30, borderRadius: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 18, marginBottom: 16 }}>修改{editingTeam === 'blue' ? '蓝方' : '红方'}队名</div>
              <input autoFocus value={editName} onChange={e => setEditName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') confirmEditTeam(); if (e.key === 'Escape') setEditingTeam(null); }}
                style={{ padding: '10px 16px', fontSize: 16, borderRadius: 8, border: '1px solid #444', background: '#0d0d28', color: '#fff', outline: 'none', width: 250 }} />
              <div style={{ marginTop: 16, display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button onClick={() => setEditingTeam(null)} style={{ padding: '8px 24px', background: '#333', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>取消</button>
                <button onClick={confirmEditTeam} style={{ padding: '8px 24px', background: '#ffd700', color: '#000', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}>确认</button>
              </div>
            </div>
          </div>
        )}

        {showTeamSelect && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
            <div style={{ background: '#0a0a24', padding: 24, borderRadius: 16, maxWidth: 600, width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#ffd700', textAlign: 'center' }}>
                选择{selectingSide === 'blue' ? '蓝方' : '红方'}战队
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {teams.map(team => (
                  <div key={team.id} onClick={() => selectTeam(team)}
                    style={{ padding: '14px 18px', borderRadius: 10, cursor: 'pointer', background: '#111133', border: '1px solid #222',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#1a1a4e'; e.currentTarget.style.borderColor = team.color; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#111133'; e.currentTarget.style.borderColor = '#222'; }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 'bold' }}>{team.name}</div>
                      <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                        {team.players.map(p => p.name).join(' / ')}
                      </div>
                    </div>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: team.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 'bold', color: '#fff' }}>
                      {team.name.charAt(0)}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowTeamSelect(false)}
                style={{ marginTop: 16, width: '100%', padding: '12px', background: '#333', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 15 }}>取消</button>
            </div>
          </div>
        )}

        {!isPeak && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0a0a24', padding: '14px 24px', borderRadius: 12, marginBottom: 16,
              border: `2px solid ${isComplete ? '#ffd700' : currentSide === 'blue' ? '#2563eb' : currentSide === 'red' ? '#dc2626' : '#333'}`, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 'bold' }}>第 {state.currentMatch}/{state.totalMatches} 局</div>
              <div style={{ fontSize: 14, padding: '4px 16px', borderRadius: 20, background: phaseBg, color: '#ffd700', fontWeight: 'bold' }}>{isComplete ? '已完成' : currentPhase}</div>
              <div style={{ fontSize: 18, fontWeight: 'bold' }}>
                {isComplete ? '' : currentSide === 'blue' ? state.blueTeamName : state.redTeamName}
                {!isComplete && <span style={{ marginLeft: 8, color: banNow ? '#ff6b6b' : '#4ecdc4' }}>{banNow ? '禁用' : '选择'}</span>}
              </div>
              <div style={{ fontSize: 36, fontWeight: 'bold', color: isComplete ? '#888' : timerColor, fontFamily: 'Arial, monospace' }}>{isComplete ? '--' : state.timer}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {!isComplete && (
                  <>
                    <button onClick={handleUndo} title="撤销 (Ctrl+Z)" style={{ padding: '6px 14px', background: '#1a1a3e', color: '#aaa', border: '1px solid #333', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>↩ 撤销</button>
                    <button onClick={() => dispatch({ type: state.isPaused ? 'RESUME_TIMER' : 'PAUSE_TIMER' })} style={{ padding: '6px 14px', background: '#1a1a3e', color: '#aaa', border: '1px solid #333', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>{state.isPaused ? '▶ 继续' : '⏸ 暂停'}</button>
                  </>
                )}
                {isComplete && state.currentMatch < state.totalMatches && (!multiMode || mySide === 'blue') && (
                  <button onClick={() => multiplayerDispatch({ type: 'NEXT_MATCH' })}
                    style={{ padding: '8px 20px', background: '#ffd700', color: '#000', border: 'none', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer', fontSize: 15 }}>
                    下一局 ▶
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
              <TeamPanel side="blue" bans={state.blueBans} picks={state.bluePicks} history={state.blueHistory} heroes={heroes}
                teamName={state.blueTeamName} teamColor={blueTeamColor}
                pendingHero={currentSide === 'blue' && state.isConfirming ? pendingHero : null}
                isConfirming={currentSide === 'blue' && state.isConfirming}
                onSwapPick={() => handleSwapPick('blue')} swapMode={swapMode.blue} selectedSwapIndex={swapIndex.blue}
                onSelectSwap={(idx) => handleSelectSwap('blue', idx)}
                onEditName={() => openEditTeam('blue')} onChangeTeam={() => openTeamSelect('blue')} />
              <TeamPanel side="red" bans={state.redBans} picks={state.redPicks} history={state.redHistory} heroes={heroes}
                teamName={state.redTeamName} teamColor={redTeamColor}
                pendingHero={currentSide === 'red' && state.isConfirming ? pendingHero : null}
                isConfirming={currentSide === 'red' && state.isConfirming}
                onSwapPick={() => handleSwapPick('red')} swapMode={swapMode.red} selectedSwapIndex={swapIndex.red}
                onSelectSwap={(idx) => handleSelectSwap('red', idx)}
                onEditName={() => openEditTeam('red')} onChangeTeam={() => openTeamSelect('red')} />
            </div>

            {state.isConfirming && pendingHero && (
              <div style={{ textAlign: 'center', padding: '8px 0', display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button onClick={handleConfirm} style={{ padding: '14px 50px', background: 'linear-gradient(135deg, #ffd700, #ffaa00)', color: '#000', border: 'none', borderRadius: 10, fontWeight: 'bold', fontSize: 18, cursor: 'pointer', boxShadow: '0 0 20px rgba(255,215,0,0.4)', animation: 'glow 1.5s infinite' }}>确认选择 {pendingHero.cname} (Enter)</button>
                <button onClick={handleCancel} style={{ padding: '14px 40px', background: '#1a1a3e', color: '#aaa', border: '1px solid #333', borderRadius: 10, fontSize: 17, cursor: 'pointer' }}>取消 (Esc)</button>
              </div>
            )}

            {!isComplete && (
              <div style={{ background: '#0a0a24', borderRadius: 12, padding: 16, maxHeight: 400, overflowY: 'auto', border: '1px solid #1a1a3e' }}>
                <HeroSelector heroes={heroes} onSelect={banNow ? handleBan : handlePickSelect} disabledIds={disabledIds} />
              </div>
            )}

            {isComplete && state.currentMatch >= state.totalMatches && (
              <div style={{ textAlign: 'center', padding: 60, fontSize: 28, color: '#ffd700', fontWeight: 'bold', animation: 'glow 1.5s infinite' }}>🏆 比赛结束！</div>
            )}
            {isComplete && state.currentMatch < state.totalMatches && (
              <div style={{ textAlign: 'center', padding: 40, fontSize: 20, color: '#ffd700', fontWeight: 'bold' }}>
                {multiMode ? '等待蓝方点击下一局' : '本局BP完成！点击"下一局"继续'}
              </div>
            )}
          </>
        )}

        {isPeak && (
          <>
            <div style={{ textAlign: 'center', padding: '14px 24px', background: '#0a0a24', borderRadius: 12, marginBottom: 16, border: '2px solid #ffd700', fontSize: 22, fontWeight: 'bold', color: '#ffd700', animation: 'glow 1.5s infinite' }}>
              ⚡ 巅峰对决 — 第 {state.currentMatch} 局
            </div>
            <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
              <PeakPanel side="blue" picks={state.bluePeakPicks} heroes={heroes} locked={state.bluePeakLocked}
                onToggleHero={handlePeakToggleBlue} onLock={handlePeakLockBlue} disabledIds={state.redPeakPicks}
                isRevealed={state.peakRevealed} teamName={state.blueTeamName} teamColor={blueTeamColor} />
              <PeakPanel side="red" picks={state.redPeakPicks} heroes={heroes} locked={state.redPeakLocked}
                onToggleHero={handlePeakToggleRed} onLock={handlePeakLockRed} disabledIds={state.bluePeakPicks}
                isRevealed={state.peakRevealed} teamName={state.redTeamName} teamColor={redTeamColor} />
            </div>
            {state.peakRevealed && (
              <div style={{ textAlign: 'center', animation: 'reveal 0.5s ease-out' }}>
                <div style={{ fontSize: 28, fontWeight: 'bold', color: '#ffd700', marginBottom: 20, animation: 'glow 1.5s infinite' }}>阵容揭晓！</div>
                <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {[state.bluePeakPicks, state.redPeakPicks].map((picks, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 10 }}>
                      {picks.map(id => <img key={id} src={`https://game.gtimg.cn/images/yxzj/img201606/heroimg/${id}/${id}.jpg`} width="80" height="80" style={{ borderRadius: 12, border: '2px solid #ffd700' }} alt={heroes.find(h => h.ename === id)?.cname} />)}
                    </div>
                  ))}
                </div>
                {state.currentMatch < state.totalMatches && (!multiMode || mySide === 'blue') && (
                  <button onClick={() => multiplayerDispatch({ type: 'PEAK_NEXT_MATCH' })} style={{ marginTop: 20, padding: '12px 30px', background: '#ffd700', color: '#000', border: 'none', borderRadius: 8, fontWeight: 'bold', fontSize: 16, cursor: 'pointer' }}>下一局</button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;