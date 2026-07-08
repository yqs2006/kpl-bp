import { useState, useCallback, useEffect, useRef } from 'react';
import Pusher from 'pusher-js';

// ====== 请替换成你的 Pusher 密钥 ======
const PUSHER_KEY = '8e014da2c0e465306489';
const PUSHER_CLUSTER = 'ap1'; // 或 ap1

export function useMultiplayer(dispatch, currentSide, isPeak) {
  const [connected, setConnected] = useState(false);
  const [roomCode, setRoomCode] = useState(null);
  const [mySide, setMySide] = useState(null);
  const [status, setStatus] = useState('idle');
  const channelRef = useRef(null);
  const mySideRef = useRef(null);
  const roomRef = useRef(null);

  // 生成随机房间码
  const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  // 加入 Pusher 房间频道
  const joinChannel = useCallback((code) => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }
    const pusher = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
      forceTLS: true,
    });
    const channel = pusher.subscribe(`presence-room-${code}`);
    channelRef.current = channel;

    channel.bind('pusher:subscription_succeeded', (members) => {
      setConnected(true);
      if (members.count === 1) {
        // 第一个加入的是蓝方（房主）
        setMySide('blue');
        mySideRef.current = 'blue';
        setStatus('waiting');
      } else if (members.count === 2) {
        // 第二个加入的是红方
        setMySide('red');
        mySideRef.current = 'red';
        setStatus('ready');
        // 通知房主对方已加入
        channel.send('opponent_joined', {});
      }
    });

    // 监听对方离开
    channel.bind('pusher:member_removed', (member) => {
      setStatus('waiting');
      alert('对手已离开房间');
    });

    // 监听自定义事件：bp_action
    channel.bind('client-bp_action', (data) => {
      dispatch(data.action);
    });

    // 监听对方加入事件（房主收到）
    channel.bind('client-opponent_joined', () => {
      setStatus('ready');
    });

    return channel;
  }, [dispatch]);

  // 创建房间
  const createRoom = useCallback(() => {
    const code = generateCode();
    setRoomCode(code);
    roomRef.current = code;
    joinChannel(code);
  }, [joinChannel]);

  // 加入房间
  const joinRoom = useCallback((code) => {
    setRoomCode(code);
    roomRef.current = code;
    joinChannel(code);
  }, [joinChannel]);

  // 离开房间
  const leaveRoom = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    setStatus('idle');
    setRoomCode(null);
    setMySide(null);
    setConnected(false);
  }, []);

  // 发送 BP 操作
  const sendAction = useCallback((action) => {
    if (channelRef.current && channelRef.current.subscribed) {
      // 触发 client-bp_action 事件
      channelRef.current.trigger('client-bp_action', { action });
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