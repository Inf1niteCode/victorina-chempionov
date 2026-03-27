import { Server, Socket } from 'socket.io';
import { getRoom } from './roomStore';

export function registerBuzzHandlers(io: Server, socket: Socket): void {
  socket.on(
    'buzz:press',
    ({ code, playerId, playerName }: { code: string; playerId: string; playerName: string }) => {
      const room = getRoom(code);
      if (!room?.activeQuestion) return;

      // КРИТИЧНО: Set гарантирует только один победитель
      if (room.buzzed.size === 0) {
        // Первый нажавший — победитель
        room.buzzed.add(playerId);
        room.activeBuzzWinner = { playerId, playerName };
        io.to(code).emit('buzz:winner', { playerId, playerName });
        console.log(`[buzz:winner] "${playerName}" in room ${code}`);
      } else {
        // Опоздал — только этому игроку
        socket.emit('buzz:blocked');
      }
    }
  );
}
