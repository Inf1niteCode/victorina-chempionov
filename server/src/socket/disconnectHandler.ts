import { Server, Socket } from 'socket.io';
import {
  getRoomBySocket,
  unregisterSocket,
  getRoom,
} from './roomStore';
import { getPlayerList } from './roomHandlers';

export function registerDisconnectHandler(io: Server, socket: Socket): void {
  socket.on('disconnect', () => {
    const room = getRoomBySocket(socket.id);
    if (!room) {
      unregisterSocket(socket.id);
      return;
    }

    // Проверяем: это ведущий или игрок?
    if (room.hostSocketId === socket.id) {
      // Ведущий отключился — уведомляем игроков
      console.log(`[disconnect] Host disconnected from room ${room.code}`);
      socket.to(room.code).emit('room:hostDisconnected', {
        message: 'Ведущий отключился. Ожидаем переподключения...',
      });
    } else {
      // Игрок отключился — находим и помечаем как offline
      let disconnectedPlayer: { id: string; name: string } | null = null;

      for (const [playerId, player] of room.players.entries()) {
        if (player.socketId === socket.id) {
          disconnectedPlayer = { id: playerId, name: player.name };
          // Не удаляем из Map — игрок может переподключиться
          // Просто очищаем socketId
          player.socketId = '';
          break;
        }
      }

      if (disconnectedPlayer) {
        console.log(`[disconnect] Player "${disconnectedPlayer.name}" left room ${room.code}`);
        // Уведомляем всех об обновлённом списке
        io.to(room.code).emit('room:playerList', { players: getPlayerList(room) });
      }
    }

    unregisterSocket(socket.id);
  });
}
