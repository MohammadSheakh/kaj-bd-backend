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

    
    > serves as the primary key for documents
    > must be unique within a collection
    > automatically indexed
    > can be any BSON data type ( usually ObjectId)
    > if not provided, MongoDB generates an ObjectId with
    ... 4 byte timestamp
    ... 5 byte random value
    ... 3 byte incrementing counter
    
```


> #### 
```ts

    1. Create migration after schema changes
    > npx prisma migrate dev --name add_user_profile

    /*-------------------
        
        ✔️ Deploy migrations to production with 🎯prisma migrate deploy🚦     
        
    -------------------*/
    
```