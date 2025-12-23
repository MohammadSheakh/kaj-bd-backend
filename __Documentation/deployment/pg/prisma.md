> #### Prisma ?
```
    Object Relational Mapper

    Prisma Client: Auto-generated and type-safe database client
    Prisma Migrate: Database migration system
    Prisma Studio: GUI to view and edit data

```

> #### Explain the Prisma schema file structure
```ts
    // schema.prisma file has three main sections:
    
    datasouce db{
        provider = "postgresql",
        url = env("DATABASE_URL")
    }

    // 2. Generators
    generator client {
        provider = "prisma-client-js"
        previewFeature = [] // optional preview features
    }

    // 3. Data models
    model User {
        id Int @id @default(autoincrement())
        email String @unique
        name String?
        posts Post[]
        createdAt DateTime @default(now())
        updatedAt DateTime @updatedAt
    }

    /*----------------
    key components:
    1. Models : Represent database tables/collections
    2. Fields : Model properties with types and attribute
    3. Attribute : Decorators like @id, @unique, @default 
    4. Relations : Defined via field types and @relation attribute
    5. Enums : Reusable enumerated types
    6. Composite types (MongoDB) : For nested document structures
    -----------------*/
```

> #### How do you define relationships in Prisma ? 
```ts

    // 1. One-to-One
    model User {
        id      Int @id @default(autoincrement())
        profile Profile?
    }

    model Profile{
        id      Int @id @default(autoincrement())
        userId  Int @unique // -- this is important 
        user    User @relations(
                        fields: [userId],
                        referentialActions: [onDelete : Cascade]
                    )
    }

    // 1. One-to-Many
    model User {
        id      Int @id @default(autoincrement())
        posts Post[]
    }

    model Post {
        id      Int @id @default(autoincrement())
        userId  Int
        user    User @relation(
                    fields : [userId],
                    reference : [id]
                )
    }
    
    // 3. Many-to-Many (explicit)
    model Post {
        id      Int @id @default(autoincrement())
        categories PostCategory[]
    }

    model Category {
        id      Int @id @default(autoincrement())
        posts   PostCategory[]
    }

    model PostCategory {
        postId      Int
        categoryId  Int
        post        Post @relations(
                            fields :[postId],
                            reference: [id]
                        )
        category        Category @relations(
                            fields :[categoryId],
                            reference: [id]
                        )
        @@id([postId, categoryId])
    }

    // 4. Many-to-Many (implicit - Prisma handles join table)
    model Post {
        id      Int @id @default(autoincrement())
        categories Category[]
    }

    model Category {
        id      Int @id @default(autoincrement())
        posts Post[]
    }
```

> #### What are Prisma's referential actions and how are they used ?

```ts

    /*-------
        referential actions define what happens when a referenced
        record is updated or deleted
    ---------*/
    model User {
        id      Int @id @default(autoincrement())
        posts   Post[]
    }

    model Post {
        id      Int @id @default(autoincrement())
        userId  Int
        user    User @relation(
                    fields : [userId],
                    references : [id],
                    onDelete : Cascade, // Delete post when user is deleted
                    onUpdate : Cascade // Update userId when user.id changes
                )
    }

    /*---------------
        Available actions

        Cascade : Delete / update related records
        Restrict : Prevent parent deletion if chidren exist
        NoAction : Similar to Restrict but check timing differs
        SetNull : Set foreign key to NULL
        SetDefault : Set Foreign key to default value 
    ----------------*/

```

> #### Explain Prisma Client's query API with examples

```ts

    // prisma client provides a fluent API for CRUD operations.

    // CREATE
    const user = await prisma.user.create({
        data: {
            email : "ss@gmail.com,
            name: "ss",
            posts: {
                create : [{
                    title: "title",
                }]
            }
        },
        include : { posts : true }
    })

    // READ (with filtering, pagination, sorting)
    const users = await prisma.user.findMany({
        where : {
            email : {contains : "@gmail.com"},
            posts : {some : {published : true}}
        },
        select : { id : true, email : true, posts : true},
        orderBy : { createdAt : "desc" },
        skip : 20, // pagination
        take : 10
    })

    // UPDATE
    const updatedUser = await prisma.user.update({
        where : {id : 1},
        data : {
            name : "SS",
            posts : {
                updateMany : {
                    where : { published : false},
                    data : { published : true }
                }
            }
        }
    })

    // DELETE 
    await prisma.user.delete({
        where : { id : 1}
    })

    // TRANSACTIOn 
    const result = await prisma.$transaction([
        prisma.user.create({ data  : { email : "dsdsdsds"}})
        prisma.post.create({ data  : { title : "dsdsdsds", authorId : 1 }})
    ])

```

> #### How does Prisma handle database migrations ?
```ts

    // prisma migrate is a declarative database migration tool.

    1. Create migration after schema changes
    > npx prisma migrate dev --name add_user_profile

    2. Apply migrations in production
    > npx prisma migrate deploy

    3. Rollback (development only) 
    > npx prisma migrate reset

    4. Check migration status
    > npx prisma migrate status 

    
    /*-------------------
        Migration Workflow
        ✔️ modify *schema.prisma*
        ✔️ run prisma migrate dev
        ✔️ run 🎯prisma migrate dev🚦 to: 
            1. create migration SQL files in /prisma/migrations
            2. apply migration to dev database
            3. regenerate Prisma Client
        ✔️ Deploy migrations to production with 🎯prisma migrate deploy🚦     
        ✔️ Use 🎯prisma db push🚦 for prototyping (bypasses migrations history)

    -------------------*/
    
```

> #### What are prisma middleware and how are they used?

```ts

    Middleware intercepts Prisma Client queries for logging, 
    validation, or modification.

    // Logging middleware
    prisma.$use(async (params, next) => {
        
    })

    // Field encryption middleware

    // Soft delete middleware

    
```

> #### How do you handle raw SQL queries in Prisma
```ts

    // Prisma provides two approaches for raw SQL
    // 1. Raw queries with template literals (Safe from SQL injection)

    const users = await prisma.$queryRaw`
        SELECT * FROM "User"
        WHERE "email" = ${emial} AND "createdAt" > ${date}
    `;

    // With type safety using Prisma validator
    import { Prisma } from '@prisma/client';

    const result = await prisma.$queryRaw<User[]>(
        Prisma.sql`SELECT * FROM User WHERE active = ${true}`
    );

    // 2. Raw query with arguments
    await prisma.$executeRaw(
        'UPDATE User SET name = $1 WHERE id = $2', 'John Doe', 1
    )

    // 3 Raw query for complex operations
    const aggregated = await prisma.$queryRaw`
        SELECT 
            DATE("createdAt") as date,
            COUNT(*) as count,
            AVG("amount") as average
        FROM "Order"
        GROUP BY DATE("createdAt")
        ORDER BY date DESC
    `;

    // 4. Transaction with raw SQL

    await prisma.$transaction([
        prisma.$executeRaw`DELETE FROM Log WHERE date < NOW() - INTERVAL '30 days'`,

        prisma.user.deleteMany({
            where : {
                inactive : true,
            }
        })
    ])

```

> #### Explain Prisma's connection pooling and performance optimization
```ts

    prisma uses connection pooling to manage database connections efficiently.

    // 1. Reuse Prisma Client instance (singleton pattern)

    // 2. Use query optimization techniques

    const optimizedQuery = await prisma.user.findMany({
        where : { /* conditions */ }
        select : { //only select needed fields 
            id : true,
            email : true,
            // Avoid posts : true (unless needed)
        },
        take : 100, // Limit results
        skip : 0
    })


    // 3. Use transactions for bulk operations
    await prisma.$transaction(async (tx) => {
        for(const user of users) {
            await tx.user.create({data : user})
        }
    })

    // 4. Use Prisma's built in batching
    const [ users, count ] = await Promise.all([
        prisma.user.findMany(),
        prisma.user.count({where : { }})
    ])

    // 5. Indexing in schema
    model User {
        id    Int    @id @default(autoincrement())
        email String @unique
        name  String
        
        @@index([name]) // Composite index
        @@index([createdAt]) // Single field index
    }

```

> #### How do you handle transactions in Prisma?
```ts

    Prisma supports three transaction pattern

    // 1. Interactive transactions (most common)
    const result = await prisma.$transaction(async(tx) => {
        // 1. Debit account
        const sender = await tx.account.update({
            where : {id : 1},
            data : { balance : { decrement : 100 }}
        });

        if(sender.balance < 0 ){
            throw new Error('Insufficient funds')
        }

        // 2. Credit account
        const receiver = await tx.account.update({
            where: { id: 2 },
            data: { balance: { increment: 100 } }
        });

         // 3. Create transaction record
        const transaction = await tx.transaction.create({
            data: {
            amount: 100,
            from: 1,
            to: 2,
            status: 'COMPLETED'
            }
        });
        
        return { sender, receiver, transaction };
        
    })


    // 2. Batch/Sequential transactions
    const [user, post] = await prisma.$transaction([
        prisma.user.create({ data: { email: 'test@example.com' } }),
        prisma.post.create({ data: { title: 'Hello', authorId: 1 } })
    ]);


    // 3. Optimistic concurrency control
    const product = await prisma.product.findUnique({
    where: { id: 1 }
    });

    // Update with version check
    const updated = await prisma.product.update({
    where: { 
        id: 1,
        version: product.version // Ensures no concurrent updates
    },
    data: {
        quantity: product.quantity - 1,
        version: product.version + 1
    }
    });

    if (!updated) {
    throw new Error('Product was modified concurrently');
    }


```



`dsd`
- [✔️]




