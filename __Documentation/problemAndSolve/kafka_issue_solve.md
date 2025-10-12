The error shows that your application is trying to connect to Kafka at 172.20.0.2:9092 but getting connection refused.

> ###### Check if Kafka container is running
> docker ps

> ###### Check  Kafka logs
> docker logs suplify-kafka

Step 2: Test network connectivity to Kafka

> ###### From your backend container, test Kafka connectivity
> docker exec -it suplify-backend sh


> ###### Inside the container:
> ping kafka


Issue 1: Kafka takes time to start
Kafka often takes 30-60 seconds to fully start. Check the logs:

> docker logs suplify-kafka -f

We can also add health check in docker compose file 



```makefile
rk.Processor.run(SocketServer.scala:1011)
        at java.base/java.lang.Thread.run(Thread.java:840)
[2025-08-27 03:16:52,242] WARN [SocketServer listenerType=BROKER, nodeId=1] Unexpected error from /172.20.0.4 (channelId=172.20.0.3:9092-172.20.0.4:43226-35); closing connection (org.apache.kafka.common.network.Selector)
org.apache.kafka.common.network.InvalidReceiveException: Invalid receive (size = 369295617 larger than 104857600)

```
```ts

This Kafka error indicates that your Kafka client is sending a message that's too large (369MB vs the 100MB limit). This suggests there might be an issue with how your Kafka client is configured or what data it's trying to send.

```

> ###### increase Kafka message size limits
>  Add these message size limits ..
    under environment: in docker-compose.yml
    - KAFKA_CFG_MESSAGE_MAX_BYTES=10485760          # 10MB max message size
    - KAFKA_CFG_REPLICA_FETCH_MAX_BYTES=10485760    # 10MB max fetch size
    - KAFKA_CFG_SOCKET_REQUEST_MAX_BYTES=10485760   # 10MB max request size
    - KAFKA_CFG_AUTO_CREATE_TOPICS_ENABLE=true




> ###### Quick fix - restart with new config:
>   #Stop everything
    docker compose down
    # Remove volumes to reset Kafka state
    docker system prune -f
    # Start with new configuration
    docker compose up --build



```
Key changes made:

Removed SSL configuration - You don't need SSL for local Docker development
Reduced maxRequestSize to 10MB - Much more reasonable than 369MB
Added proper error handling and logging
Added message size validation - Prevents sending oversized messages
Added compression - Reduces message size automatically
Proper connection management - Better error handling

Important Questions:

What data are you trying to send through Kafka that's 369MB? This is extremely large for a message queue. Consider:

Sending only metadata/IDs instead of full data
Breaking large data into smaller chunks
Using file storage with Kafka carrying only file references


Are you sending Message objects? If so, make sure you're not accidentally including large attachments or binary data.

```












































