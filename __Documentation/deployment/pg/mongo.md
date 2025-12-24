> #### 1. What is and How does it differ from
```ts

    1. Schema-less
    2. Document Model -> store data as BSON document in stead of table / rows
    3. Horizontal Scaling -> built in sharding for scaling
    4. Denormalization -> it encourage
    5. Query language -> uses MongoDB Query lang vs SQL
    
    
```

> #### 2. Explain the structure of a MongoDB document
```ts

    A mongodb document is a JSON-like structure stored in a BSON format
    
```

> #### 3. What is the purpose of the _id field in MongoDB
```ts

    
    > serves as the primary key for documents
    > must be unique within a collection
    > automatically indexed
    > can be any BSON data type ( usually ObjectId)
    > if not provided, MongoDB generates an ObjectId with
    ... 4 byte timestamp
    ... 5 byte random value
    ... 3 byte incrementing counter
    
```


> #### 4. What are MongoDB indexes and why are they important?
```ts

    Indexes are data structures that improve query performance:

    // create an index
    db.collection.createIndex({ field : 1 }) // 1 -> ascending, -1 -> descending

    // Compound index
    db.collection.createIndex({
        field1 : 1, 
        field2 : -1
    })

    Types :::::
    > Single Field Index
    > Compound Index
    > Multikey Index (for arrays)
    > Text Index ( for text search )
    > Geospatial Index
    > Hashed Index ( for sharding )
    > TTL Index ( for automatic expiration ) 

    
    
```

> #### 5. Explain MongoDB aggregation framework 
```ts

    Aggregation pipeline processes documents through stages


    db.orders.aggregate([
        { $match: { status : "completed" }}, // stage 1: Filter
        { // stage 2 : Group
            $group : {
                _id : "$customerId",
                total : { $sum : "$amount" }
            }
        },
        {
            // stage 3: Sort
            $sort : { total : -1 },
        },
        { // statge 4 : Limit
            $limit: 10
        }
    ])

    // Common stages : $match, $group, $sort, $project, $lookup (join), $facet
    
```

> #### How does MongoDB ensure high availablity 
```ts

    Through Replica Sets

    > A replica set is a group of MongoDB servers (minimum 3 nodes)
    > One primary node (handles all writes)
    > Multiple secondary nodes (replicate from primary, can handle reads)
    > Automatic failover : If primary fails, election chooses new primary
    > Data redundancy across multiple servers.
    
```

> #### What is sharding in MongoDB and when should you use it 
```ts

    Sharding is horizontal scaling by partitioning data across 
    multiple servers(shards)

    
    // Enable sharding
    sh.enableSharding("database")

    // Choose shard key
    sh.shardCollection("database.collection", { shardKey: 1 })

    ##### USE WHEN >>>>>>>>
    > Dataset exceeds single server capacity
    > Write thoughput exceeds single server capability
    > Memory requirements exceed available RAM 
    
    SHARD KEY CONSIDERATIONS : cardinality, frequency, rate of change 

```

> #### Explain MongoDB transactions
```ts

    Multi document ACID transactions (available from v4.0+)

    const session = db.getMongo().startSession();

    session.startTransaction();
    try {
        db.accounts.updateOne(
            {_id : 1},
            { $inc : { balance : -100 }},
            { session }
        )

        db.accounts.updateOne(
            {_id : 2},
            { $inc : { balance : -100 }},
            { session }
        )

        session.commitTransaction()

    }catch(error){
        session.abortTransaction();
    }
    
```

> #### What are MongoDB schema design patterns
```ts

    Common patterns

    ✔️ Embedded Document Pattern : related data in single document ( one to few )
    ✔️ Reference Pattern : store references to other documents ( one to many )
    ✔️ Array of References : For many-to-many relationships
    ✔️ Bucket Pattern : For time-series data (group data into buckets)
    ✔️ Computed Pattern : Store computed values to avoid on-the-fly calculations
    ✔️ Subset Pattern : Store frequently accessed subset of data
    
```

> #### How do you handle relationship in MongoDB
```ts

    ✔️ Embedding : For one-to-few, data accessed together
    ✔️ Referencing : For one-to-many, many-to-many or large documents    

```

> #### Difference between find() amd aggregate() ?
```ts

    ✔️ find() : Simple queries, returns cursor, limited to filtering and projection
    ✔️ aggregate() : Complex data processomg, uses pipeline stages, can transform, group, join data
    
```

> #### Explain MongoDB write concern 
```ts

    Write concern controls acknowledgement level for write operations

    // Different write concern levels
    db.collection.insertOne(doc, { w : 1}) // acknowledged by primary
    db.collection.insertOne(doc, { w : "majority" }) // majority of replica set
    db.collection.insertOne(doc, { w : 2 }) // at least 2 members
    db.collection.insertOne(doc, {w : 0}) // fire and forget .. unacknowledged

    Journaling : j : true ensures write to journal before acknowledgment.
    
```

> #### 13. What is covered query in MongoDB ?
```ts

    A query that can be satisfied entirely using an index

    // Create index
    db.users.createIndex({ name : 1, age: 1 })

    // Covered query ( only uses index )
    db.users.find(
        { name : "john" },
        { _id : 0, name : 1, age : 1 } // projection matches index fields .. 
    ).explain("execution) // check if it's covered
    
    BENEFITS : Faster ( no document fetch), less I/O

```
> #### How does MongoDB handle concurrency ? 
```ts

    Uses WiredTiger storage engine features : 

    ✔️ Document-level locking : Fine grained concurrency control
    ✔️ Optimistic concurrency control for transaction
    ✔️ MVCC ( multi version concurrency control) : Readers don't block writers, writers don't block readers
    ✔️ Intent locks at global, database, and collection levels
    
```

> #### What are MongoDB TTL indexes ? 
```ts

    Time-To-Live indexes automatically remove documents after expiration

    // create TTL index on createdAt field ( expire after 3600 seconds )
    db.logs.createIndex(
        { createdAt : 1 },
        { expireAfterSeconds : 3600 }
    )

    // Or ona specific date field
    db.events.createIndex(
        { expireAt : 1 },
        { expireAfterSeconds : 0 } // Expire at exact time in expireAt field
    )
    
```

> #### Explain the $lookup operator
```ts

    Performs left outer join between collections

    db.orders.aggregate([
        {
            $lookup: {
                from : "customers", // collection to join
                localField : "customerId" // field from input 
                foreignField : "_id" // feild from 'from' collection
                as : "customerInfo" // output array field
            }
        },
        {
            $unwind : "$customerInfo" // Deconstruct array
        }
    ])
    
    // Enhanced in v3.6+: Supports uncorrelated subqueries, multiple join conditions

```

> #### 17. What is mongoDB atlas 
```ts

    fully managed cloud database service

    ✔️ Fully managed : Automatic backups, patches, monitoring
    ✔️ Global clusters : Data distributed across regions
    ✔️ Automated scaling : Both vertical and horizontal
    ✔️ Security : Encryption at rest and in transit, VPC peering, IP whitelisting

    
```

> #### 18. How do you optimize MongoDB performance ? 
```ts

    ✔️ Indexing : Automatic backups, patches, monitoring
    ✔️ Query Optimization : Use explain() to analize queries
    ✔️ Connection pooling : Reuse connections
    ✔️ Sharding : for large datasets
    ✔️ Write Concern : Adjust based on durability requirements

    
```

> #### 19. Diff between MongoDB and Mongoose ? 
```ts

    ✔️ MongoDb : The database itself, driver provides low-level access

    ✔️ Mongoose : ORM (Object Data Modeling) library for node js

    > schema definition and validation
    > middleware ( hooks )
    > population ( joins )
    > businees logic methods  

    
```

> #### 20. How do you implement pagination in MongoDb ?
```ts

    
```


> #### 
```ts

    1. Create migration after schema changes
    > npx prisma migrate dev --name add_user_profile

    /*-------------------
        
        ✔️ Deploy migrations to production with 🎯prisma migrate deploy🚦     
        
    -------------------*/
    
```




