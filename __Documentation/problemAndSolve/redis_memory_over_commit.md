suplify-redis | 1:C 28 Aug 2025 15:43:32.856 # WARNING Memory overcommit must be enabled! Without it, a background save or replication may fail under low memory condition. Being disabled, it can also cause failures without low memory condition, see https://github.com/jemalloc/jemalloc/issues/1328. To fix this issue add 'vm.overcommit_memory = 1' to /etc/sysctl.conf and then reboot or run the command 'sysctl vm.overcommit_memory=1' for this to take effect.

---------------------------

Run this on your host machine (not inside the container):

sudo sysctl vm.overcommit_memory=1

You can confirm the change with:

sysctl vm.overcommit_memory
