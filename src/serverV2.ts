//@ts-ignore
import colors from 'colors';
//@ts-ignore
import { Server } from 'socket.io';
import app from './app';
import { errorLogger, logger } from './shared/logger';
import { config } from './config';
//@ts-ignore
import os from 'os';
//@ts-ignore
import cluster from 'cluster';
//@ts-ignore
import { createAdapter } from '@socket.io/redis-adapter';
//@ts-ignore
import http from "http";
import { startNotificationWorker, startScheduleWorker } from './helpers/bullmq/bullmq'; // ⬅️ ADD THIS
import connectToDb from './config/mongoDbConfig';
import { initializeRedis, redisClient, redisPubClient, redisSubClient } from './helpers/redis/redis';
import { socketHelperForKafka } from './helpers/socket/socketForChatV1WithKafka';
import { socketService } from './helpers/socket/socketForChatV3WithFirebase';

// in production, use all cores, but in development, limit to 2-4 cores
const numCPUs = config.environment === 'production' ? os.cpus().length : Math.max(0, Math.min(1, os.cpus().length));

//uncaught exception
process.on('uncaughtException', error => {
  errorLogger.error('UnhandleException Detected', error);
  process.exit(1);
});

if (cluster.isPrimary) { // isMaster (deprecated)
  // Fork workers for each CPU core
  logger.info(colors.green(`Master process started, forking ${numCPUs} workers...`));

  // Fork workers for each core
  for (let i = 0; i < numCPUs; i++) {
    console.log("num of CPUs forking 🍴 numCPUs i", i);
    cluster.fork();
  }

  // When a worker dies, log it and fork a new worker
  cluster.on('exit', (worker, code, signal) => {
    logger.error(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });

} else {
let server: any;

async function main() {
  try {

    // startMessageConsumer();

    // await mongoose.connect(config.database.mongoUrl as string, {
    //   serverSelectionTimeoutMS: 30000, // increase server selection timeout
    //   socketTimeoutMS: 45000, // increase socket timeout
    // });

    await connectToDb();

    logger.info(colors.green('🎯 Database connected successfully'));
    const port =
      typeof config.port === 'number' ? config.port : Number(config.port);
    server = app.listen(port, config.backend.ip as string, () => {
      logger.info(
        colors.yellow(
          `♻️  Application listening on port ${config.backend.baseUrl}/v1`
        )
      );

      logger.info(
          colors.yellow(
            `♻️  Shobhoy port ${config.backend.shobhoyUrl}`,
          ),
        );
    });

  
    // Initialize Redis
    await initializeRedis();

    //socket
    // const io = new Server(server, {
    //   pingTimeout: 60000,
    //   cors: {
    //     origin: '*',
    //   },
    // });


    // const redisStateClient = createRedisClient(); // New Redis client for state management

    // --- SOCKET.IO ON DIFFERENT PORT --- go to postman and connect  newsheakh3000.sobhoy.com   for socket
    const socketPort = 6738; // 👈 choose your socket port
    const socketServer = http.createServer(); // independent HTTP server only for socket.io


    // Initialize Socket.IO with Redis state management
    await socketService.initialize(
      // server,
      socketPort,
      socketServer,
      redisPubClient,
      redisSubClient,
      redisPubClient
    );



    // 🔥 CRITICAL: Use Redis adapter for cross-worker communication //we move this to socketService.initialize
    // io.adapter(createAdapter(redisPubClient, redisSubClient));

    // Setup socket helper
    // socketHelper.socketForChat_V2_Claude(io);
    // socketHelperForKafka.socketForChat_With_Kafka(io);

    // @ts-ignore
    // global.io = io;

    // 🔥 Start BullMQ Worker (listens for schedule jobs)
    startScheduleWorker(); 
    startNotificationWorker();

  } catch (error) {
    errorLogger.error(colors.red('🤢 Issue from server.ts => ', error));
  }

  //handle unhandledRejection
  process.on('unhandledRejection', error => {
    if (server) {
      server.close(() => {
        errorLogger.error('UnhandledRejection Detected', error);
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
  });
} 

main();

//SIGTERM
// process.on('SIGTERM', () => {
//   logger.info('SIGTERM IS RECEIVE');
//   if (server) {
//     server.close();
//   }
// });

}
