> #### Explain the testing pyramid in Node.js How do you implement it?
```ts

    The testing pyramid consists of three layers: 
    
    > Unit Tests (70-80%) : Test individual function / modules in isolation using mocks
    > Integration Tests (10-20%) : Test interactions between multiple components
    > E2E Tests (5-10%) : Test complete user flows in a production-like environment
    

    Node js Implementation

    // Unit Test Example (Jest)
    const { calculateTotal } = require('./cartService');
    test('Calculates total correctly', () => {
        expect(calculateTotal([
            {
                price : 10
            },
            {
                price: 20
            }
        ])).toBe(30)
    })

    // Integration Test Example
    const request = require('supertest');

    test('POST /api/orders creates order', async () => {
        const response = await request(app)
            .post('/api/orders')
            .send({ items : [ ... ]});
        
        expect(response.status).toBe(201);
    })

    // E2E with Cypress / Puppeteer

```

> #### How do you mock external dependencies in Node.js tests ? 
```ts

    // Using Jest for mocking
    jest.mock('axios');
    const axios = require('axios');

    // Mock implementation
    axios.get.mockResolvedValue({ data : { id : 1 }})

    ....
    ...
    ....
    ...
    ...
    
```


> #### What's the difference between Jest, Mocha and Vitest
```ts

    Jest : All in one solution ( test runner, assertion library, mocking ). Great
        for batteries included approach

    Mocha : Flexible test runner that needs additional libraries ( Chai for assertions,
        Sinon for mocks
    )

    Vitest : Jest-compatible but faster, built for Vite, excellent for modern
        Node/Typescript

    
    COMPARISON

    //Jest
    test('example', () => {
        expect(sum(1, 2)).toBe(3);
    })

    // Mocha + Chai
    describe('suite', ()=> {
        it('example', () => {
            expect(sum(1, 2).to.equal(3);)
        })
    })

    // Vitest (similar to Jest)
    import {test, expect} from 'vitest';
    
```

> #### How do you test asynchronous code in Node.js? 
```ts

    // 1. Promises
    test('async with promises', () => {
        return fetchData().then(data => {
            expect(data).toBe('expected');
        })
    })
    
    // 2. Async/Await
    test('async with await', async () => {
        const data = await fetchData();
        expect(data).toBe('expected');
    });

    //3. Callbacks
    test('async with callback', done => {
        fetchData((error, data) => {
            if(error) return done(error);

            expect(data).toBe('expected');
            done();
        })
    })

    // 4. Testing async errors
    test('throws error', async () => {
        await expect(asyncFunction()).rejects.toThrow('Error message');
    })

```


> #### What are snapshot tests and when should you use them?
```ts

    Snapshot tests capture the output of a component/function and compare it to a 
    stored snapshot

    // Component snapshot
    ....
    ....
    ....
    ...
    
```

> #### 6. How do you handle environment variables in tests ?
```ts

    // Using dotenv for different environments
    require('dotenv').config({
        path: '.env.test'
    })

    // Settings env vars before tests

    beforeAll(() => {
        process.env.NODE_ENV = 'test';
        process.env.DATABASE_URL = 'test-db-url';
    })

    // Resetting after tests
    afterAll(() => {
        delete process.env.SECRET_KEY;
    })

    // Using a test setup file
    // jest.config.js
    module.exports = {
        setupFiles: ['<rootDir>/tests/setup.js'],
        setupFilesAfterEnv: ['<rootDir>/tests/setupAfterEnv.js']
    }

    // Mocking environment-dependent modules
    jest.mock('../config', () => ({
        get config() {
            return process.env.NODE_ENV === 'test' ? testConfig : prodConfig;
        }
    }));
    
```

> #### What strategies do you use for database testing ?
```ts

    // 1. Transaction-based tests
    test('user creation', async () => {
        const transaction = await db.transaction();
        try {
            await User.create({name : 'Test'}, { transaction });

            const user = await User.findOne({ transaction})

            expect(user.name).toBe('Test');

            await transaction.rollback(); // Never persists
        }catch(error) {
            await transaction.rollback();
            throw error
        }
    })

    // 2. Test database
    beforeAll(async() => {
        await createTestDatabase();
        await runMigrations();
    })

    // 3. Docker containers for integration tests
    ....
    ....
    ...
    ....
    
```

> #### How do you measure and maintain test coverage?

> #### Whats the difference between stubs, mocks, spies ? 

> #### How do you test Express.js middleware?
```ts

    const request = require('supertest');
    const express = require('express')

    // Testing middleware in isolation
    test('auth middleware', async () => {
        const app = express();
        const mockNext = jest.fn();
        const mockReq = { headers : {}};
        const mockRes = {}

        // Test unauthorized
        mockReq.headers.authorization = 'invalid';
        await authMiddleware(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalledWith(expect.any(Error));

        // Test authorized
        mockReq.headers.authorization = 'Bearer valid-token';

        await authMiddleware(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalledWith(); // No Error
    })


    // Testing middleware in route context
    test('protected route', async () => {
        const app = express();
        app.use(authMiddleware);

        app.get('/protected', (req, res) => res.send('OK'));

        const response = await request(app)
            .get('/protected')
            .set('Authorization', 'Bearer token');

        expect(response.status).toBe(200)
    })
    
```

> #### How do you test WebSocket connections ?


> #### What's property-based testing and how do you implement it ?


> #### 
```ts

    1. Create migration after schema changes
    > npx prisma migrate dev --name add_user_profile

    /*-------------------
        
        ✔️ Deploy migrations to production with 🎯prisma migrate deploy🚦     
        
    -------------------*/
    
```


