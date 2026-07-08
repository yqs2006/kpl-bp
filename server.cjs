const { WebSocketServer } = require('ws');

const wss = new WebSocketServer({ port: 3001 });
const rooms = new Map();

wss.on('connection', (ws) => {
  let myRoom = null;
  let playerIndex = -1;

  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());

    switch (msg.type) {
      case 'create_room': {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        rooms.set(code, { players: [ws], ready: false });
        myRoom = code;
        playerIndex = 0;
        ws.send(JSON.stringify({ type: 'room_created', code }));
        break;
      }
      case 'join_room': {
        const room = rooms.get(msg.code);
        if (!room) {
          ws.send(JSON.stringify({ type: 'error', message: '房间不存在' }));
          return;
        }
        if (room.players.length >= 2) {
          ws.send(JSON.stringify({ type: 'error', message: '房间已满' }));
          return;
        }
        room.players.push(ws);
        room.ready = true;
        myRoom = msg.code;
        playerIndex = 1;
        ws.send(JSON.stringify({ type: 'joined_room', code: msg.code, side: 'red' }));
        room.players[0].send(JSON.stringify({ type: 'opponent_joined' }));
        break;
      }
      case 'bp_action': {
        if (!myRoom) return;
        const room = rooms.get(myRoom);
        if (!room) return;
        room.players.forEach((player, idx) => {
          if (idx !== playerIndex) {
            player.send(JSON.stringify({ type: 'bp_action', action: msg.action }));
          }
        });
        break;
      }
      case 'leave_room': {
        if (myRoom) {
          const room = rooms.get(myRoom);
          if (room) {
            room.players.forEach(p => {
              if (p !== ws) p.send(JSON.stringify({ type: 'opponent_left' }));
            });
            rooms.delete(myRoom);
          }
        }
        break;
      }
    }
  });

  ws.on('close', () => {
    if (myRoom) {
      const room = rooms.get(myRoom);
      if (room) {
        room.players.forEach(p => {
          if (p !== ws) p.send(JSON.stringify({ type: 'opponent_left' }));
        });
        rooms.delete(myRoom);
      }
    }
  });
});

console.log('WebSocket 服务器运行在 ws://localhost:3001');