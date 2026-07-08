import { useRef, useState, useCallback, useEffect } from 'react';

export function useMultiplayer(dispatch, currentSide, isPeak) {
  const [connected, setConnected] = useState(false);
  const [roomCode, setRoomCode] = useState(null);
  const [mySide, setMySide] = useState(null);
  const [status, setStatus] = useState('idle');
  const wsRef = useRef(null);
  const actionQueueRef = useRef([]);

  const connect = useCallback(() => {
    const ws = new WebSocket('ws://localhost:3001');
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => {
      setConnected(false);
      setStatus('idle');
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      switch (msg.type) {
        case 'room_created':
          setRoomCode(msg.code);
          setMySide('blue');
          setStatus('waiting');
          break;
        case 'joined_room':
          setRoomCode(msg.code);
          setMySide('red');
          setStatus('ready');
          break;
        case 'opponent_joined':
          setStatus('ready');
          break;
        case 'opponent_left':
          setStatus('waiting');
          alert('对手已离开房间');
          break;
        case 'bp_action':
          // 放入队列，在下一个微任务中批量 dispatch
          actionQueueRef.current.push(msg.action);
          queueMicrotask(() => {
            const actions = actionQueueRef.current.splice(0);
            actions.forEach(a => dispatch(a));
          });
          break;
        case 'error':
          alert(msg.message);
          break;
      }
    };

    return ws;
  }, [dispatch]);

  const createRoom = () => {
    if (wsRef.current) wsRef.current.close();
    const ws = connect();
    ws.onopen = () => ws.send(JSON.stringify({ type: 'create_room' }));
  };

  const joinRoom = (code) => {
    if (wsRef.current) wsRef.current.close();
    const ws = connect();
    ws.onopen = () => ws.send(JSON.stringify({ type: 'join_room', code }));
  };

  const leaveRoom = () => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'leave_room' }));
      wsRef.current.close();
    }
    setStatus('idle');
    setRoomCode(null);
    setMySide(null);
  };

  const sendAction = useCallback((action) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      if (action.type !== 'TICK_TIMER') {
        wsRef.current.send(JSON.stringify({ type: 'bp_action', action }));
      }
    }
  }, []);

  const isMyTurn = mySide === currentSide;

  return {
    connected,
    roomCode,
    mySide,
    status,
    isMyTurn,
    createRoom,
    joinRoom,
    leaveRoom,
    sendAction,
  };
}