# Embed Generator Service

Re-implementation of the Embed Generator backend as a single service. It connects to the Discord gateway itself and keeps no guild cache in memory: reads go through the REST API behind a short lived cache.

Run several instances by giving each one a disjoint `shard_ids` out of the same `shard_count`. They don't talk to each other. Work that has to happen once per guild is gated on the shard the guild lands on; work that has to happen once per deployment runs on the instance holding shard 0.
