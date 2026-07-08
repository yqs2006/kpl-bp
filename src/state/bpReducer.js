export const PHASES = {
  BLUE_BAN1: 'BLUE_BAN1',
  RED_BAN1: 'RED_BAN1',
  BLUE_BAN2: 'BLUE_BAN2',
  RED_BAN2: 'RED_BAN2',
  BLUE_PICK1: 'BLUE_PICK1',
  RED_PICK1: 'RED_PICK1',
  RED_PICK2: 'RED_PICK2',
  BLUE_PICK2: 'BLUE_PICK2',
  BLUE_PICK3: 'BLUE_PICK3',
  RED_PICK3: 'RED_PICK3',
  BLUE_BAN3: 'BLUE_BAN3',
  RED_BAN3: 'RED_BAN3',
  RED_BAN4: 'RED_BAN4',
  BLUE_BAN4: 'BLUE_BAN4',
  BLUE_BAN5: 'BLUE_BAN5',
  RED_BAN5: 'RED_BAN5',
  BLUE_PICK4: 'BLUE_PICK4',
  RED_PICK4: 'RED_PICK4',
  RED_PICK5: 'RED_PICK5',
  BLUE_PICK5: 'BLUE_PICK5',
  COMPLETE: 'COMPLETE',
};

export const phaseOrder = Object.values(PHASES);
export const TIMER_SECONDS = 30;

export const initialState = {
  currentPhaseIndex: 0,
  blueBans: [],
  redBans: [],
  bluePicks: [],
  redPicks: [],
  blueHistory: [],
  redHistory: [],
  currentMatch: 1,
  totalMatches: 5,
  mode: 'normal',
  timer: TIMER_SECONDS,
  isPaused: false,
  pendingPick: null,
  isConfirming: false,
  bluePeakPicks: [],
  redPeakPicks: [],
  bluePeakLocked: false,
  redPeakLocked: false,
  peakRevealed: false,
  blueTeamName: '蓝方',      // 关键修复
  redTeamName: '红方',       // 关键修复
  historySnapshots: [],
};

export function getCurrentSide(phase) {
  if (!phase) return null;
  if (phase.startsWith('BLUE')) return 'blue';
  if (phase.startsWith('RED')) return 'red';
  return null;
}

export function isBanPhase(phase) {
  return phase && phase.includes('BAN');
}

export function isPickPhase(phase) {
  return phase && phase.includes('PICK');
}

function saveSnapshot(state) {
  return {
    currentPhaseIndex: state.currentPhaseIndex,
    blueBans: [...state.blueBans],
    redBans: [...state.redBans],
    bluePicks: [...state.bluePicks],
    redPicks: [...state.redPicks],
    timer: state.timer,
    pendingPick: state.pendingPick,
    isConfirming: state.isConfirming,
  };
}

export function bpReducer(state, action) {
  switch (action.type) {
case 'BAN_HERO': {
  const snapshot = saveSnapshot(state);
  const { team, heroId } = action;
  if (team === 'blue') {
    return { ...state, blueBans: [...state.blueBans, heroId], historySnapshots: [...state.historySnapshots, snapshot] };
  } else {
    return { ...state, redBans: [...state.redBans, heroId], historySnapshots: [...state.historySnapshots, snapshot] };
  }
}

    case 'SELECT_FOR_PICK': {
      return { ...state, pendingPick: action.heroId, isConfirming: true };
    }
    case 'CANCEL_PICK': {
      return { ...state, pendingPick: null, isConfirming: false };
    }
    case 'CONFIRM_PICK': {
      const snapshot = saveSnapshot(state);
      const { team, heroId } = action;
      const newBluePicks = team === 'blue' ? [...state.bluePicks, heroId] : state.bluePicks;
      const newRedPicks = team === 'red' ? [...state.redPicks, heroId] : state.redPicks;
      const nextIndex = state.currentPhaseIndex + 1;
      const nextPhase = phaseOrder[nextIndex];
      return {
        ...state,
        bluePicks: newBluePicks,
        redPicks: newRedPicks,
        pendingPick: null,
        isConfirming: false,
        currentPhaseIndex: nextIndex,
        timer: nextPhase === 'COMPLETE' ? 0 : TIMER_SECONDS,
        historySnapshots: [...state.historySnapshots, snapshot],
      };
    }
    case 'NEXT_PHASE': {
      const snapshot = saveSnapshot(state);
      const nextIndex = state.currentPhaseIndex + 1;
      const nextPhase = phaseOrder[nextIndex];
      return {
        ...state,
        currentPhaseIndex: nextIndex,
        timer: nextPhase === 'COMPLETE' ? 0 : TIMER_SECONDS,
        pendingPick: null,
        isConfirming: false,
        historySnapshots: [...state.historySnapshots, snapshot],
      };
    }
    case 'UNDO': {
      if (state.historySnapshots.length === 0) return state;
      const snapshots = [...state.historySnapshots];
      const prev = snapshots.pop();
      return {
        ...state,
        ...prev,
        historySnapshots: snapshots,
        blueHistory: state.blueHistory,
        redHistory: state.redHistory,
        currentMatch: state.currentMatch,
        totalMatches: state.totalMatches,
        mode: state.mode,
        isPaused: false,
      };
    }
    case 'BAN_AND_NEXT': {
  const snapshot = saveSnapshot(state);
  const { team, heroId } = action;
  let newState = { ...state, historySnapshots: [...state.historySnapshots, snapshot] };
  if (team === 'blue') {
    newState.blueBans = [...state.blueBans, heroId];
  } else {
    newState.redBans = [...state.redBans, heroId];
  }
  const nextIndex = state.currentPhaseIndex + 1;
  const nextPhase = phaseOrder[nextIndex];
  newState.currentPhaseIndex = nextIndex;
  newState.timer = nextPhase === 'COMPLETE' ? 0 : TIMER_SECONDS;
  newState.pendingPick = null;
  newState.isConfirming = false;
  return newState;
}
    case 'SWAP_PICKS': {
      const { team, indexA, indexB } = action;
      const picks = team === 'blue' ? [...state.bluePicks] : [...state.redPicks];
      if (indexA < 0 || indexA >= picks.length || indexB < 0 || indexB >= picks.length) return state;
      [picks[indexA], picks[indexB]] = [picks[indexB], picks[indexA]];
      return team === 'blue' ? { ...state, bluePicks: picks } : { ...state, redPicks: picks };
    }
    case 'TICK_TIMER':
      if (state.isPaused) return state;
      if (state.timer <= 0) return state;
      if (phaseOrder[state.currentPhaseIndex] === 'COMPLETE') return state;
      if (state.mode === 'peak' && !state.peakRevealed) return state;
      return { ...state, timer: state.timer - 1 };
    case 'PAUSE_TIMER':
      return { ...state, isPaused: true };
    case 'RESUME_TIMER':
      return { ...state, isPaused: false };
    case 'NEXT_MATCH':
      return {
        ...state,
        blueHistory: [...state.blueHistory, { match: state.currentMatch, bans: [...state.blueBans], picks: [...state.bluePicks] }],
        redHistory: [...state.redHistory, { match: state.currentMatch, bans: [...state.redBans], picks: [...state.redPicks] }],
        blueBans: [],
        redBans: [],
        bluePicks: [],
        redPicks: [],
        currentPhaseIndex: 0,
        currentMatch: state.currentMatch + 1,
        timer: TIMER_SECONDS,
        pendingPick: null,
        isConfirming: false,
        historySnapshots: [],
      };
    case 'PEAK_SELECT_BLUE': {
      const id = action.heroId;
      if (state.bluePeakPicks.includes(id)) return { ...state, bluePeakPicks: state.bluePeakPicks.filter(h => h !== id) };
      if (state.bluePeakPicks.length >= 5) return state;
      return { ...state, bluePeakPicks: [...state.bluePeakPicks, id] };
    }
    case 'PEAK_SELECT_RED': {
      const id = action.heroId;
      if (state.redPeakPicks.includes(id)) return { ...state, redPeakPicks: state.redPeakPicks.filter(h => h !== id) };
      if (state.redPeakPicks.length >= 5) return state;
      return { ...state, redPeakPicks: [...state.redPeakPicks, id] };
    }
    case 'PEAK_LOCK_BLUE':
      return { ...state, bluePeakLocked: true };
    case 'PEAK_LOCK_RED':
      return { ...state, redPeakLocked: true };
    case 'PEAK_REVEAL':
      return { ...state, peakRevealed: true };
    case 'PEAK_NEXT_MATCH':
      return {
        ...state,
        blueHistory: [...state.blueHistory, { match: state.currentMatch, bans: [], picks: [...state.bluePeakPicks] }],
        redHistory: [...state.redHistory, { match: state.currentMatch, bans: [], picks: [...state.redPeakPicks] }],
        blueBans: [], redBans: [], bluePicks: [], redPicks: [],
        bluePeakPicks: [], redPeakPicks: [],
        bluePeakLocked: false, redPeakLocked: false, peakRevealed: false,
        currentPhaseIndex: 0, currentMatch: state.currentMatch + 1, timer: TIMER_SECONDS, mode: 'normal',
        historySnapshots: [],
      };
    case 'SET_MODE':
      return { ...state, mode: action.mode, timer: TIMER_SECONDS, bluePeakPicks: [], redPeakPicks: [], bluePeakLocked: false, redPeakLocked: false, peakRevealed: false };
    case 'SET_TEAM_NAME':
      return action.side === 'blue' ? { ...state, blueTeamName: action.name } : { ...state, redTeamName: action.name };
    case 'SET_TOTAL_MATCHES':
      return { ...state, totalMatches: action.count };
    case 'RESET':
      return {
        ...initialState,
        totalMatches: state.totalMatches, // 保留赛制
        blueTeamName: '蓝方',
        redTeamName: '红方',
      };
    default:
      return state;
  }
}