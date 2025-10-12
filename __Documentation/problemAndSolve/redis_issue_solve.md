Start And Stop Local Redis
=============================
Test Redis connection:
> redis-cli ping

> sudo apt install net-tools

Check if Redis is listening on its default port:
> netstat -tlnp | grep 6379

Stop Redis ( we also can use systemctl )
> sudo service redis-server stop

Check Redis: redis-server -v


For Restart 
> sudo service redis restart

For Start
> sudo service redis-server start

> sudo systemctl start redis
> sudo systemctl start redis-server

> sudo lsof -i :6379

> sudo systemctl stop redis

```
Actual Error

suplify-backend  | Wed Aug 27 2025 2:51:6 [SERVER-NAME] error: Redis Sub Client Error: connect ECONNREFUSED ::1:6379

```

> Solve ::: Use Newer Redis Syntax

```
lets verify the container can communicate

```

> ###### Get into the backend container
> docker exec -it suplify-backend sh

> ###### Test if Redis container is reachable
>ping redis

> ###### Check Redis container logs
> docker logs suplify-redis

> ###### Check if Redis is responding
> docker exec -it suplify-redis redis-cli ping

















