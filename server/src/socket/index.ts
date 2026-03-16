import { Server } from 'socket.io';
import { registerRoomHandlers } from './roomHandlers';
import { registerGameHandlers } from './gameHandlers';
import { registerTourHandlers } from './tourHandlers';
import { registerBuzzHandlers } from './buzzHandlers';
import { registerTimerHandlers } from './timerHandlers';
import { registerDisconnectHandler } from './disconnectHandler';

export function initSocket(io: Server): void {
  io.on('connection', (socket) => {
    console.log(`[socket] connected: ${socket.id}`);

    registerRoomHandlers(io, socket);
    registerGameHandlers(io, socket);
    registerTourHandlers(io, socket);
    registerBuzzHandlers(io, socket);
    registerTimerHandlers(io, socket);
    registerDisconnectHandler(io, socket);

    socket.on('ping', (cb) => {
      if (typeof cb === 'function') cb({ time: Date.now() });
    });
  });
}
