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
        const start = Date.now();
        const result = await next()
    })

```




`dsd`
- [✔️]




