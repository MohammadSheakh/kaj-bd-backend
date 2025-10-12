/**
  * @NEW_TOPIC <!--  -->
    tabular data 
    document related data 

    @Next <!--    -->
    
 */

/**
  * @NEW_TOPIC <!-- What is buffer in node js  -->
  
    temporary storage area in memory that holds data while it is being transferred between two locations, such as between
    a file and a program or between a network and a program. Buffers are used to improve performance by reducing the
    number of read/write operations.

    Buffers are particularly useful when dealing with streams of data, such as reading from a file or receiving data over
    a network connection. They allow for efficient handling of data by storing it in memory before processing it, which can
    help reduce latency and improve overall performance.

    In Node.js, buffers are implemented using the `Buffer` class, which provides methods for reading and writing binary 
    data. Buffers can be created from strings, arrays, or other buffers, and they can be manipulated using various methods 
    provided by the `Buffer` class.

    Buffers are particularly useful when dealing with binary data, such as images, audio files, or network protocols,
    where efficient handling of data is crucial for performance.
    Buffers are used to handle binary data in Node.js, such as reading files, processing network requests, or
    manipulating binary streams. They provide a way to work with raw binary data efficiently.
    
    @Next <!--    -->
    
 */

/**
  * @NEW_TOPIC <!-- Middleware in node js -->

    They are used heavily in Express.js applications to handle requests and responses.
    Middleware functions are functions that have access to the request object (req), the response object (
    res), and the next middleware function in the application’s request-response cycle.
    They can perform various tasks such as logging, authentication, error handling, and modifying the request
    or response objects.
    Middleware functions can be added to the application using the app.use() method in Express.js.

    Middleware functions can be used to perform tasks such as logging, authentication, error handling, and
    modifying the request or response objects. They can also be used to handle specific routes or HTTP
    methods by passing a route path as the first argument to the app.use() method.


    /***** 
     * it comes in between request and business logic .. 
    mainly used to capture logs, enable rate limiting, authentication .. basically whatever is not part of business logic 
    there are third party middlewares also available like cors, helmet, body-parser, morgan etc ..

    we can write own middleware for specific use case .. 

    @Next <!--    -->
    
 */

/**
  * @NEW_TOPIC <!-- If you want to do middleware in express and node js .. what we need to do -->

    we can start with a async function that takes three parameters: req, res, and next.
    The req parameter represents the incoming request object, the res parameter represents the outgoing response object,
    and the next parameter is a function that is called to pass control to the next middleware function

    @Next <!--    -->
    
 */

/**
  * @NEW_TOPIC <!-- What is the event loop? What do you understand about event loop in node js  -->

    this is heart of v8 engine ..
    it is a single threaded loop that handles asynchronous operations in Node.js.
    The event loop allows Node.js to perform non-blocking I/O operations by offloading operations
    to the system kernel whenever possible. It continuously checks for events and executes
    the associated callbacks in a single thread, allowing Node.js to handle multiple requests concurrently
    without blocking the execution of other code. The event loop is responsible for managing the execution of
    callbacks, timers, and I/O operations in Node.js applications.
    The event loop is a core component of Node.js that allows it to handle asynchronous operations efficiently.
    It is responsible for executing callbacks, processing events, and managing the execution of asynchronous code.

    /***** 
     * asynchronous is managed by event loop

    @Next <!--    -->
    
 */

/**
  * @NEW_TOPIC <!-- The concept of Stub in node js  -->

    it use in writing test which is important part of development .. it replace the whole function which is getting tested .. 

    if an external call is done which takes too much time and its running slow .. we can use stub to replace that function
    with a fake function that returns a predefined value or behavior. This allows us to test the
    rest of the code without waiting for the external call to complete, making the tests faster and
    more reliable. Stubs are commonly used in unit testing to isolate the code being tested from
    external dependencies, such as databases, APIs, or other services.

    @Next <!--    -->
    
 */

/**
  * @NEW_TOPIC <!-- How could you enhance the nodejs performance through clustering -->

    just because node js application are on a single processor .. we can use clustering to enhance the performance of nodejs 
    application
    Clustering allows you to create multiple instances of your Node.js application, each running on a separate core of the CPU.
    This allows you to take advantage of multi-core processors and improve the performance of your application by distributing
    the workload across multiple processes.
    Each instance of the application can handle incoming requests independently, allowing for better utilization of system
    resources and improved scalability.
    Clustering is particularly useful for applications that require high concurrency or handle a large number of requests 
    simultaneously.
    It can help improve the overall performance and responsiveness of Node.js applications by allowing them to handle more
    requests concurrently.

    /****** *
     * the cluster module is used to start up multiple node js processes that can share the same server port.
     * this allows us to take advantage of multi-core processors and improve the performance of our node js applications.
     

    but theres also a parent process called the cluster manager which is responsible for monitoring 
    and managing the worker processes. The cluster manager can spawn new worker processes,
    handle worker crashes, and distribute incoming requests to the worker processes.


    but theres also a drawback of clustering ..
    * the drawback is that each process has its own memory space, so they cannot share data
    * directly. This means that if you need to share data between processes, you will need
    * to use some form of inter-process communication (IPC) such as message passing or shared memory.
    * This can add complexity to your application and may require additional libraries or frameworks to handle
    * the communication between processes.

    @Next <!--    -->
    
 */

/**
  * @NEW_TOPIC <!-- Why Cluster are different from worker thread vice versa -->

    Clustering in Node.js allows you to create multiple instances of your application, each running on a separate core of the CPU.
    Each instance is a separate process, and they can share the same server port to handle incoming
    requests. Clustering is primarily used to improve the performance and scalability of Node.js applications by
    distributing the workload across multiple processes.

    Worker threads, on the other hand, allow you to run JavaScript code in parallel threads within a single Node.js process.
    This is useful for CPU-intensive tasks that can block the event loop, as it allows you to offload those tasks to separate threads
    without blocking the main event loop. Worker threads are particularly useful for tasks that require heavy computation or processing,
    such as image processing, data analysis, or other CPU-bound operations. 

    In summary, clustering is used to improve performance and scalability by creating multiple processes,
    while worker threads are used to offload CPU-intensive tasks to separate threads within a single process
    without blocking the event loop. Clustering is more suitable for handling high concurrency and scaling applications
    across multiple cores, while worker threads are more suitable for offloading CPU-bound tasks to separate threads
    to prevent blocking the event loop.

    /*************** 
     * Cluster : In cluster mode, there is one process on each cpu.. with an enter process communication protocol 
      communicate and in case we want to have multiple servers accepting http requests whereas single port clusters can be helpful
      . this is an advantage of clustering .. and the processes are spawned in each cpu and thus will have separate memory
      and no distance which further will lead to some memory issue. this one can be count as disadvantage of clustering
        
    * Worker Thread : In worker thread mode, there is one process on each cpu.. with 
        an enter process communication protocol communicate and in case we want to have multiple servers accepting http requests
         whereas single port clusters can be helpful.

    here we have one process in total with multiple threads.. each thread has one more distance , one event loop, one js engine,
    and it can access most of the api and it shares memory with other threads without need of any inter process communication
    and this can be used for cpu intensive task like processing data or accessing the file system. since node js is single threaded
    . synchronous tasks can be more efficient by leveraging the local threads 

    @Next <!--    -->
    
 */

/**
  * @NEW_TOPIC <!-- Could you please explain me what is a range axia search pattern  -->
    Range Axis Search Pattern is a search pattern used in databases and data structures to efficiently search for
    a specific range of values within a dataset. It is particularly useful when dealing with large datasets
    where searching for a specific value may not be efficient. The range axis search pattern allows for
    searching for a range of values by dividing the dataset into smaller segments and searching within those segments
    to find the desired range. This pattern can be implemented using various data structures such as trees
    or hash tables, and it can significantly improve the performance of search operations in large datasets.
    
    ************* 
     * range axis search is a great way to structure test cases. It Prescribe an order of operation
     * Steps Are ...
      1. first step is to arrange inputs and targets 
       set up the test case 
       if test require any object or special settings . if needs to prepare database or if it needs to log in a web app
        you should handle all of these operations at the start of the test 
        and this is done in a range step
      2. to act on the target behavior, x steps should cover the main thing to test it . this could be calling a function 
       or a method, calling a rest api or interacting with a web page.  this can one of these..
       and we are keeping these actions focused on the target behavior
      3. to assert expected outcomes
      4. next step is some sort of response .. research steps verify the goodness or badness of their response 

      sometimes assertions are as simple as checking numerical other time they may require checking multiple facets
      of a system 

      5. assertions will ultimately determine if the test passes or fail

    @Next <!--    -->
    
 */

/**
  * @NEW_TOPIC <!-- Node js also has a couple timing features, timing functions that allow us to schedule processing ..
                  what are the timing functions available in node js  -->
  *  -->

    timer module is an essential part of node js and it has some function for some different purposes. 
    1. set timeout : 

    2. clear timeout : 

    they can be used to schedule code execution after a designated amount of milliseconds. and of course set timeout does this
    and clear timeout clear the timeout 

    we have 3. set interval : 4. clear interval :

    they can be used to execute a block of code multiple times like bouncing and 
    
    we have 5. set immediate : and 6.  clear immediate : 

    thy will execute code at the end of the current event loop cycle, allowing other code to run first.

    we have 7. next tick : 

    it is a special function that allows us to schedule code execution at the end of the current event loop cycle,
    similar to set immediate, but with a higher priority. It is often used to ensure that
    certain code runs before any other code in the event loop, allowing for immediate execution of critical
    tasks without waiting for the next event loop cycle.

    //// i have these .. if there are more please tell me .... 

    @Next <!--    -->
    
 */

/**
  * @NEW_TOPIC <!-- what is EPC in node js -->


    @Next <!--    -->
    
 */

/**
  * @NEW_TOPIC <!-- What is the difference between child process spawn and execute function in node js .. and when to use
  *  each one  -->
  
    spawn child or execute child are two methods provided by the child_process module in Node.js to create child processes.
    The main difference between the two is how they handle the input and output of the child process.
    The spawn method is used to create a new child process and execute a command in it. It returns a ChildProcess object
    that can be used to interact with the child process. The spawn method is typically used for
    long-running processes or when you need to handle large amounts of data from the child process.

    The exec method, on the other hand, is used to execute a command in a child process and buffer the output.
    It returns a ChildProcess object that can be used to interact with the child process, but
    it buffers the output of the command and returns it as a string when the command completes.
    The exec method is typically used for short-lived processes or when you only need to capture the output of the command
    without needing to interact with it in real-time.

    ****** 
      for spawn, it doesnt spawn a shell  and exec spawns a shell and executes the command in it.

      spawn streams the data returned by the child process and data flow is constant.
      in exact it buffers the data and waits till the process closes and transfers the data in one chunk. 
    
      spawn has no data transfer size limit. because its like a stream. it has a maximum transfer size limit of 1MB.
      spawn is a command designated to run system commands, spawn is more suitable for long-running processes
      with huge output

      we use exec if we need such features as shell pipes, redirects, even we need exec for more than one program

     
    @Next <!--    -->
    
 */

/**
  * @NEW_TOPIC <!-- Why should we separate the express app in the server -->

    this is because actually the server is responsible for initializing the routes, middlewares and other application logic.
    express app has all the business logic, which will be solved by the rules initiated by the server. Why we are separating ,
    because separating them ensures that the business logic is encapsulated and decoupled from the application logic .
    which makes the project more maintainable and readable. also good for testing . because you just need to load the express
    and you can run any server you can test your application there


    

    /////////////////////
    By separating the express app from the server, we can keep the server code clean and focused
    on handling the server-related tasks, such as starting the server, handling requests, and managing
    the application lifecycle. This separation also allows for better organization of the codebase,
    making it easier to maintain and test the application. Additionally, separating the express app from the
    server allows for better scalability and flexibility, as we can easily swap out the express app with
    a different framework or library if needed, without affecting the server code. Overall, separating the
    express app from the server is a best practice in Node.js development that helps improve code organization
    and maintainability.


    @Next <!--    -->
    
 */

/**
  * @NEW_TOPIC <!-- What is the reactor pattern in node js -->

    reactor pattern is a design pattern used in event-driven programming to handle events and
    callbacks in a non-blocking manner. It is commonly used in Node.js applications to manage
    asynchronous operations and handle events efficiently.

    The reactor pattern works by using an event loop to listen for events and callbacks, and then
    dispatching those events to the appropriate handlers. When an event occurs, the reactor pattern
    invokes the corresponding callback function to handle the event. This allows for efficient handling
    of multiple events and callbacks without blocking the execution of the program.

    *********** 
     * 
     Reactor pattern is a pattern for non-blocking io operations.. but in general this is used in any event driven architecture. 

     there are two component here named reactor and handler. 

     reactor dispatches the io event to appropriate handler. and handler actually works on those events. 
     we have couple design part which is you can work with as a event emitter right, so in one hand subscriber 

     in one hand you have the event and your other hand you have the handler .. when you fire event .. handler will be 
     notified 


    @Next <!--    -->
    
 */

/**
  * @NEW_TOPIC <!-- Whats the difference between read file and create read stream in node js -->
    
    read file process actually is a fully buffered process that returns the response only one ..
    the complete file is push into the buffer and its completely read and as you can guess this is a memory 
    intensive process .. because it has all the data in a file .. and if we are working with a large file ..
    this can not be preferred actually.. 


    Create Read Stream is a partially buffered process that threats entire process as an event series .. 
    so, the entire file is a bit into chunks and then processed and then sent back the response one by one 

    after completing this step they are finally removed from the buffer unlike it is done in read file .. 

    so the create read stream process is more effective when we are processing large files .. 

    @Next <!--    -->
    
 */

    /**
  * @NEW_TOPIC <!-- what is node js -->
    node js is a runtime environment that allows us to run javascript on the server side

    @Next <!--  runtime environment  -->
    converting high level code to low level code
    node js uses v8 engine to convert javascript code to machine code
    v8 engine is developed by google and is used in chrome browser
    node js is built on top of v8 engine
 */

/**
  * @NEW_TOPIC <!-- Runtime Environment -->
    provides an environment to run code
    includes services like file system, network, memory management,IO operations, etc.
    
    @Next <!--    -->
    
 */

/**
  * @NEW_TOPIC <!-- What are the 7 main feature of node js  -->
    1. Asynchronous 
    2. Event Driven
    3. Single Threaded
    4. Non-blocking I/O
    5. Cross Platform
    6. Fast Execution
    7. Scalable
    8. Open Source
    9. Rich Ecosystem npm (Node Package Manager)
    10. Real time capabilities .. bi directional communication
    11. V8 Engine

    @Next <!--    -->
    
 */


/**
  * @NEW_TOPIC <!-- Synchronous -->
    Each Task is executed one after another
    If one task takes a long time to complete, it will block the execution of other tasks

    @Next <!--    -->
    
 */

/**
  * @NEW_TOPIC <!-- Multiple thread can create deadlock problem -->

    Asynchronous flow can be achieved bu its single threaded, non-blocking and event driven
    architecture 


    1. in synchronous programming, tasks are executed one after another in a sequential manner
    1. in asynchronous programming, tasks can be executed independently and concurrently

    2. 

    @Next <!--    -->
    
 */

/**
  * @NEW_TOPIC <!-- Event, Event Emitter, Event Queue, Event Loop, Event Driven -->

    Event : Signal that something has happened in a program

    Event Emitter : Create or emit event 

    Event Queue : Emitted events are placed in an event queue, waiting to be processed

    Event Handler : Function that listens for and responds to events

    Event Loop : The event loop picks up event from the event queue and executes them in
            the order they were received, allowing for non-blocking execution

    Event Driven Architecture : It means operations in node are drive or based 
            by events         

    @Next <!--    -->
    
 */

/**
  * @NEW_TOPIC <!-- Main Features and Advantage of node js -->

    1. Asynchronous : Enables handling multiple concurrent requests & non blocking execution of thread.

    2. V8 JS Engine : Built on Google's V8 JS engine, which compiles JS to machine code for fast execution.

    3. Event Driven Arch : handling events and callbacks, allowing for efficient I/O operations.

    4. Cross  Platform : support deployment on various OS 

    5. Suitable for building scalable app. 

    @Next <!--    -->
    
 */

/**
  * @NEW_TOPIC <!-- ---------------------------   35:00 ---------------------- -->


    @Next <!--    -->
    
 */

/**
  * @NEW_TOPIC <!-- NPM is used to manage dependencies for node project -->

    package.json file contains metadata about the project, including its dependencies, scripts, and other configurations.

    @Next <!--    -->
    
 */

/**
  * @NEW_TOPIC <!-- 49:13 Top 5 built in modules -->
    1. fs
    2. path
    3. os
    4. events
    5. http

    @Next <!--    -->
    
 */

/**
  * @NEW_TOPIC <!-- fs module -->

    const fs = require('fs');

    // Read a file asynchronously
    fs.readFile('file.txt', 'utf8', (err, data) => {
      if (err) {

        console.error('Error reading file:', err);
        return;
      }
      console.log('File content:', data);
    });

    // Write to a file asynchronously
    fs.writeFile('output.txt', contentToWrite, (err) => {
      if (err) {
        console.error('Error writing file:', err);
        return;
      }
      console.log('File written successfully');
    });  

    /// 7 main function of fs module
    // 1. fs.readFile() - Read a file asynchronously
    // 2. fs.writeFile() - Write to a file asynchronously
    // 3. fs.appendFile() - Append data to a file asynchronously
    // 4. fs.unlink() - Delete a file asynchronously
    // 5. fs.rename() - Rename a file asynchronously
    // 6. fs.mkdir() - Create a directory asynchronously
    // 7. fs.readdir() - Read the contents of a directory asynchronously
    // 8. fs.stat() - Get file or directory statistics asynchronously
    // 9. fs.watch() - Watch for changes in a file or directory asynchronously
    // 10. fs.exists() - Check if a file or directory exists asynchronously
    // 11. fs.copyFile() - Copy a file asynchronously
    // 12. fs.createReadStream() - Create a readable stream for a file
    // 13. fs.createWriteStream() - Create a writable stream for a file
    // 14. fs.promises - Provides promise-based versions of the fs methods
    // 15. fs.constants - Contains constants used by the fs module
    // 16. fs.access() - Check file or directory permissions asynchronously
    // 17. fs.truncate() - Truncate a file to a specified length asynchronously
    // 18. fs.chmod() - Change file or directory permissions asynchronously
    // 19. fs.chown() - Change file or directory ownership asynchronously
    // 20. fs.realpath() - Get the canonicalized absolute pathname of a file or directory asynchronously
    // 21. fs.symlink() - Create a symbolic link asynchronously
    // 22. fs.readlink() - Read the value of a symbolic link asynchronously
    // 23. fs.lstat() - Get symbolic link statistics asynchronously
    // 24. fs.fstat() - Get file statistics for a file descriptor asynchronously
    // 25. fs.ftruncate() - Truncate a file descriptor to a specified length
    // 26. fs.fchmod() - Change file permissions for a file descriptor asynchronously
    // 27. fs.fchown() - Change file ownership for a file descriptor asynchronously
    // 28. fs.fdatasync() - Synchronize a file descriptor's data to
    // 29. fs.fsync() - Synchronize a file descriptor's data and metadata to disk asynchronously
    

    @Next <!--    -->
    
 */

/**
  * @NEW_TOPIC <!-- Path module -->

    path module provides utilities for working with file and directory paths.
    joining, parsing, formatting, normalizing and manipulating paths. 

    const path = require('path');

    /// joining path segments 
    const fullPath = path.join('/docs', 'notes.txt');

    consolelog('Full Path:', fullPath); // output : /docs/notes.txt


    /// parsing a path
    const parsedPath = path.parse(fullPath);
    console.log('Parsed Path:', parsedPath); // output : object with properties like root, dir, base, ext, name

    /// 5 main function of path module 

    // joining path segments together
    const fullPath = path.join(__dirname, 'folder', 'file.txt');

    // resolving the absolute path
    const absolutePath = path.resolve('folder', 'file.txt');

    // getting the directory name of a path
    const directoryName = path.dirname('/path/to/file.txt');

    // getting the file extension of a path
    const fileExtension = path.extname('/path/to/file.txt');

    @Next <!--    -->
    
 */

/**
  * @NEW_TOPIC <!-- Explain the role of OS module .. name some functions of it  -->

    The os module in node js provides a set of methods for interacting with the operating system.

    const os = require('os');

    os.type(); // Returns the operating system name
    os.platform(); // Returns the platform name (e.g., 'linux', 'darwin
    os.arch(); // Returns the CPU architecture (e.g., 'x64', 'arm')
    os.release(); // Returns the operating system release version
    os.uptime(); // Returns the system uptime in seconds
    os.totalmem(); // Returns the total amount of system memory in bytes
    os.freemem(); // Returns the amount of free system memory in bytes
    os.homedir(); // Returns the home directory of the current user
    os.tmpdir(); // Returns the default directory for temporary files
    os.cpus(); // Returns an array of objects containing information about each CPU core
    os.networkInterfaces(); // Returns an object containing network interfaces and their addresses
    os.hostname(); // Returns the hostname of the operating system
    os.userInfo(); // Returns an object containing information about the current user



    @Next <!--    -->
    
 */

/**
  * @NEW_TOPIC <!-- Explain the role of events module? how to handle events in node -->

    const EventEmitter = require('events');

    const myEmitter = new EventEmitter();

    /// Register an event listener(event name)
    myEmitter.on('eventName', (arg1, arg2) => {
      // when ever event Name is occurred, this callback will be executed
      console.log('An event occurred!');
    });

    /// lets emit that event
    myEmitter.emit('eventName', "arg1", "arg2"); // Output: An event occurred!

    @Next <!--    -->
    
 */

/**
  * @NEW_TOPIC <!-- difference between a function and an event -->

    function is a reusable piece of code that can be called with arguments to perform a specific task.

    event represent an action or occurrence that can be listened to and responded to asynchronously.

    @Next <!--    -->
    
 */

/**
  * @NEW_TOPIC <!--   Advantage of express.... what is the role of http module in node  -->

    1. simplified web development - as lightweight framework
    2. middleware support
    3. flexible routing system 
    4. template engine integration .. 

    @Next <!--    -->
    
 */

/**
  * @NEW_TOPIC <!-- Middleware -->

    middleware in express js is a function aht handles http requests and perform operations and passes control to 
    next middleware .. 

    /// how to implement middleware in express js 

    const express = require('express');
    const app = express();

    const myMiddleware = (req, res, next) => {
      console.log('Middleware executed');
      next(); // Pass control to the next middleware or route handler
    };

    // use middleware globally for all routes. 
    app.use(myMiddleware);

    /// how to use middleware globally for a specific route

    app.use('/api', myMiddleware);

    /// what are the types of middleware in express js >>> 5 types

     1. Application-level middleware - defined at the application level and can be used for all routes
     2. Router-level middleware - defined at the router level and can be used for specific routes
     3. Error-handling middleware - used to handle errors that occur during request processing
     4. Built-in middleware - provided by express js, such as express.json() and express.urlencoded() for parsing request bodies
     5. Third-party middleware - external middleware libraries that can be integrated into an express app

    @Next <!--    -->
    
 */

/**
  * @NEW_TOPIC <!-- specific function in express  -->

    1. app.get() - Handle GET requests
    2. app.post() - Handle POST requests
    3. app.put() - Handle PUT requests
    4. app.delete() - Handle DELETE requests
    5. app.use() - Use middleware functions
    6. app.listen() - Start the server and listen for incoming requests
    7. app.all() - Handle all HTTP methods for a specific route
    8. app.route() - Chain multiple route handlers for a specific path
    9. app.param() - Define middleware for route parameters
    10. app.set() - Set application-level settings
    11. app.get() - Handle GET requests

    @Next <!--    -->
    
 */

/**
  * @NEW_TOPIC <!-- Error Handling Middleware  -->
  * 
    app.use((err, req, res, next) => {
      console.error(err.stack); // Log the error stack trace
      res.status(500).send('Something went wrong!'); // Send a generic error response
    });

    ////////// If you want to handle specific errors, you can do so like this:
    app.use((err, req, res, next) => {
      if (err instanceof SomeSpecificError) {
        res.status(400).send('Specific error occurred!');
      } else {
        next(err); // Pass the error to the next error-handling middleware
      }
    });

  


    @Next <!--    -->
    
 */

/**
  * @NEW_TOPIC <!-- How to serve static files from express js -->

    express.static() middleware is used for serving static files .. 

    @Next <!--    -->
    
 */

/**
  * @NEW_TOPIC <!-- Third party middleware -->

    // use the helmet middleware for setting HTTP security headers

    // use the body-parser middleware for parsing request bodies

    // use the compression middleware for compressing response bodies


    ///// Request Pipeline 
    // series of middleware functions that handle incoming http request and 
    // pass control to the next function . 
    
    @Next <!--    -->
    
 */                                            

/**
  * @NEW_TOPIC <!-- router object & router method -->
    const router = express.Router(); // this is router object 

    router.get('/path', (req, res) => { // thgis is router method


    ////////// What is express.Router() in express js ?
    -> express.Router() is a class in Express js that returns a new router object.
    -> It is used to create modular, mountable route handlers.
    -> It allows you to define routes and middleware for a specific path or group of paths.


    //////// Route Chaining
    router.route('/path', middleware1, middleware2, (req, res) => {})
    
    /////// Route Nesting ..           

    @Next <!--    -->
    
 */

/**
  * @NEW_TOPIC <!-- Template Engines -->

    // process the template .. .. libraries that enable developer to generate dynamic HTML content
    by combining static HTML templates with data .. 

    EJS -> embedded JavaScript .. Handlebars -> Mustache -> Pug -> Nunjucks
     
    @Next <!--    -->
    
 */
////////////////////////////////////////// 2:13:54 ////////////////////////////////////////////////////
/**
  * @NEW_TOPIC <!-- REST & RESTFUL API -->
    REST (Representational State Transfer) is an architectural style for designing networked applications.
    It relies on a stateless, client-server communication model and uses standard HTTP methods (GET
    , POST, PUT, DELETE) to perform operations on resources.
    RESTful API is an API that adheres to the principles of REST, allowing clients to interact with resources
    using standard HTTP methods and URIs. It typically returns data in formats like JSON or XML

    REST -> architectural style for designing networked applications
    RESTful API -> API that adheres to / follows the principles of REST
    -> REST is a set of guidelines for creating APIs that are scalable, stateless, and use standard HTTP methods.


    Transfering data accurately in a network .


    //////// What are HTTP Request and Response structures in UI and REST API 

    //////// What are the top 5 REST guidelines and advantages of them 
    1. Separation of Concerns: REST separates the client and server, allowing them to evolve independently.
    2. Statelessness: Each request from the client to the server must contain all the information needed to understand and process the request, making the server stateless.
    3. Resource-Based: REST focuses on resources, which are identified by URIs. Each resource can be manipulated using standard HTTP methods (GET, POST, PUT, DELETE).
    4. Uniform Interface: REST defines a uniform interface for communication between clients and servers, simplifying the architecture.
    5. Cacheability: Responses from the server can be cached to improve performance and reduce server load. 
    6. Layered System: REST allows for a layered architecture, where intermediaries can be introduced to improve scalability
     and security. MVC 


     //////// REST API vs SOAP API 

     architecture : Architecture style vs protocol
      data format : JSON, XML vs XML only
      communication : Stateless vs Stateful
      performance : Lightweight vs Heavyweight
      flexibility : More flexible vs Less flexible
      security : Uses HTTPS vs Uses WS-Security
      standards : Fewer standards vs More standards
      complexity : Simpler vs More complex
      error handling : Uses HTTP status codes vs Uses SOAP faults
      versioning : Versioning through URL or headers vs Versioning through WSDL
      testing : Easier to test with tools like Postman vs More complex testing with SOAP UI

    
      ////// HTTP Methods : are set of actions that can take on a resource .. 

      ////// Put method vs Patch method ...  Complete update vs Partial update
      ////// Concept of Idempotency in RESTFUL API ..  Performing the same operation multiple times should yield the same 
              result without side effects.
              Non Idempotent operations may produce different results or side effects when repeated. (POST method)

      ////// What is HATEOAS in RESTFUL API .. Hypermedia as the Engine of Application State
      ////// What is CRUD in RESTFUL API .. Create, Read, Update, Delete operations on
      ////// What is JSON in RESTFUL API .. JavaScript Object Notation, a lightweight data interchange format
      ////// What is JSON Schema in RESTFUL API .. A JSON-based format for defining the structure
      ////// What is OpenAPI Specification in RESTFUL API .. A standard for defining RESTful APIs
      ////// What is Swagger in RESTFUL API .. A tool for generating API documentation from OpenAPI
      ////// What is API Gateway in RESTFUL API .. A server that acts as an entry point
      ////// What is API Versioning in RESTFUL API .. Managing changes to an API over time  
      ////// What is API Documentation in RESTFUL API .. A guide that explains how to use an API
      ////// What is API Testing in RESTFUL API .. The process of verifying that an API works as expected
      ////// What is API Security in RESTFUL API .. Measures taken to protect an API from unauthorized access
      ////// What is API Rate Limiting in RESTFUL API .. Controlling the number of requests
      ////// What is API Authentication in RESTFUL API .. Verifying the identity of a user or
      ////// What is API Authorization in RESTFUL API .. Granting permissions to a user or application
      ////// What is API Caching in RESTFUL API .. Storing responses to improve performance
      ////// What is API Throttling in RESTFUL API .. Limiting the rate of requests
      ////// What is API Monitoring in RESTFUL API .. Tracking the performance and usage of an API
      ////// What is API Analytics in RESTFUL API .. Analyzing the usage patterns and performance
      ////// What is API Management in RESTFUL API .. The process of overseeing and controlling an API
      ////// What is API Proxy in RESTFUL API .. A server that acts as an intermediary between
      ////// What is API Mocking in RESTFUL API .. Creating a simulated version of an API
      ////// What is API Gateway in RESTFUL API .. A server that acts as an entry point
      ////// What is API Load Balancing in RESTFUL API .. Distributing incoming requests across multiple
      ////// What is API Scalability in RESTFUL API .. The ability of an API to handle increased load
      ////// What is API Performance in RESTFUL API .. The speed and efficiency of an API
      ////// What is API Reliability in RESTFUL API .. The ability of an API to consistently perform
      ////// What is API Usability in RESTFUL API .. The ease of use and understanding of
      ////// What is API Interoperability in RESTFUL API .. The ability of an API to work with other APIs
      ////// What is API Compatibility in RESTFUL API .. The ability of an API to work with
      ////// What is API Extensibility in RESTFUL API .. The ability of an API to be extended
      ////// What is API Flexibility in RESTFUL API .. The ability of an API to adapt
      ////// What is API Maintainability in RESTFUL API .. The ease of maintaining and updating an API
      ////// What is API Portability in RESTFUL API .. The ability of an API to be
      ////// What is API Standardization in RESTFUL API .. The process of creating standards
      ////// What is API Governance in RESTFUL API .. The process of managing and controlling an API
      ////// What is API Ecosystem in RESTFUL API .. The network of APIs, tools, and services
      ////// What is API Marketplace in RESTFUL API .. A platform for discovering and consuming APIs
      ////// What is API Monetization in RESTFUL API .. The process of generating revenue from an
      API

    @Next <!--    -->
    
 */

/**
  * @NEW_TOPIC <!-- Status codes for restful API -->

    1XX - 100 Continue

    2XX - 200 OK
    201 - 201 Created
    202 - 202 Accepted
    204 - 204 No Content
    208 - 208 Already Reported

    3XX - 300 Multiple Choices
    4XX - 400 Bad Request
    401 - 401 Unauthorized  
    403 - 403 Forbidden
    404 - 404 Not Found
    405 - 405 Method Not Allowed
    406 - 406 Not Acceptable
    408 - 408 Request Timeout
    409 - 409 Conflict
    410 - 410 Gone
    411 - 411 Length Required
    412 - 412 Precondition Failed
    413 - 413 Payload Too Large
    414 - 414 URI Too Long
    415 - 415 Unsupported Media Type
    416 - 416 Range Not Satisfiable
    417 - 417 Expectation Failed
    422 - 422 Unprocessable Entity
    429 - 429 Too Many Requests
    431 - 431 Request Header Fields Too Large
    451 - 451 Unavailable For Legal Reasons

    5XX - 500 Internal Server Error
    501 - 501 Not Implemented
    502 - 502 Bad Gateway
    503 - 503 Service Unavailable
    504 - 504 Gateway Timeout
    505 - 505 HTTP Version Not Supported
    506 - 506 Variant Also Negotiates
    507 - 507 Insufficient Storage
    508 - 508 Loop Detected
    510 - 510 Not Extended
    511 - 511 Network Authentication Required
    520 - 520 Unknown Error
    521 - 521 Web Server Is Down
    522 - 522 Connection Timed Out
    523 - 523 Origin Is Unreachable
    524 - 524 A Timeout Occurred
    525 - 525 SSL Handshake Failed
    526 - 526 Invalid SSL Certificate
    527 - 527 Railgun Error
    530 - 530 Site Is Frozen
    598 - 598 Network Read Timeout Error
    599 - 599 Network Connect Timeout Error
    
    @Next <!--    -->
    
 */

/////////////////////////////////////////////////  2:40:18  REST API - CORS, Serialization, Deserialization , OTHERS    
/**
  * @NEW_TOPIC <!-- What is CORS in Restful APIs -->

    CORS (Cross-Origin Resource Sharing) is a security feature implemented by web browsers to prevent
    malicious websites from making requests to a different domain than the one that served the web page.
    It allows servers to specify which origins are allowed to access their resources by including specific headers in
    the HTTP response. This is particularly important for RESTful APIs, as they are often accessed
    by web applications hosted on different domains.

    - same domain not restricted
    - different domain restricted - can not share resources 
    - different sub-domain restricted
    - request from http but sender is https - restricted
    - if the port number is different, it is considered a different domain


    // Enable CORS in Node.js using the cors middleware
    const express = require('express');
    const cors = require('cors');
    const app = express();    
    app.use(cors()); // Enable CORS for all routes



    @Next <!--    -->
                     
 */

/**
  * @NEW_TOPIC <!-- What are Serialization & Deserialization --> V.IMP
    if we want to pass data restAPI 1 to restAPI 2

    in restAPI 1 .. we convert the data into JSON object  (Serialization)
    in restAPI 2 .. we convert the JSON object into data (Deserialization)


    types of serialization ... 

    1. JSON Serialization: Converting data into JSON format, which is a lightweight data interchange format.
    2. XML Serialization: Converting data into XML format, which is a markup language
    3. Binary Serialization: Converting data into a binary format, which is more compact
    4. Protocol Buffers: A language-agnostic binary serialization format developed by Google
    5. YAML Serialization: Converting data into YAML format, which is a human-readable
    6. CSV Serialization: Converting data into CSV format, which is a simple text
    7. BSON Serialization: A binary representation of JSON-like documents, used by MongoDB
    8. Avro Serialization: A binary serialization format used in Apache Hadoop
    9. MessagePack Serialization: A binary serialization format that is more efficient than JSON
    10. Thrift Serialization: A binary serialization format developed by Facebook for cross-language services
    11. CBOR Serialization: Concise Binary Object Representation, a binary serialization format
    12. FlatBuffers Serialization: A serialization format developed by Google for efficient data interchange
    13. Ice Serialization: A serialization format used by the Ice middleware for distributed applications
    14. Protobuf Serialization: A serialization format developed by Google for efficient data interchange
    16. Parquet Serialization: A columnar storage file format optimized for use with big data processing frameworks


    @Next <!--    -->
    
 */

/**
  * @NEW_TOPIC <!-- Explaining the concept of versioning in RESTFUL APIs -->


    @Next <!--    -->
    
 */

/**
  * @NEW_TOPIC <!-- Authentication And Authorization -->

    5 types of authentication 

    1. Basic Authentication: Uses a username and password encoded in Base64.
    4. API Key Authentication: Uses a unique key to authenticate requests.
    2. Token-Based Authentication: Uses a token (e.g., JWT) to authenticate
    11. Multi-Factor Authentication (MFA): Requires multiple forms of verification, such as a password and a one-time code sent to a mobile device.
    
    3. OAuth: An open standard for access delegation, commonly used for token-based authentication.
    5. Session-Based Authentication: Uses a session ID stored on the server to authenticate requests
    6. Digest Authentication: Uses a hashed version of the password for authentication.
    7. HMAC Authentication: Uses a hash-based message authentication code to verify the integrity and authenticity of the message.
    8. OpenID Connect: An authentication layer built on top of OAuth 2.0.
    9. SAML (Security Assertion Markup Language): An XML-based standard for exchanging authentication and authorization data between parties.
    10. LDAP (Lightweight Directory Access Protocol): A protocol for accessing and managing directory information services.
    12. Certificate-Based Authentication: Uses digital certificates to authenticate users or devices.
    13. Biometric Authentication: Uses unique biological characteristics, such as fingerprints or facial recognition, for authentication.
    14. Single Sign-On (SSO): Allows users to authenticate once and gain access to multiple applications or services.
    15. JSON Web Tokens (JWT): A compact, URL-safe means of representing claims to be transferred between two parties.
    16. OAuth 2.0: An authorization framework that allows third-party applications to obtain limited access to an HTTP service.
    

    @Next <!--    -->
    
 */

/**
  * @NEW_TOPIC <!-- What is the role of Hashing and Salt in securing passwords -->

    we put salt(random string) and hashed password(using hashing algo) together to crate more secure password storage.

    @Next <!--    -->
    
 */

/**
  * @NEW_TOPIC <!-- What is token based and JWT authentication -->
   // JWT token has 3 parts .. headers, payload, signature
    // JWT (JSON Web Token) is a compact, URL-safe means of representing claims to be transferred between two parties.
    // It is used for authentication and information exchange in web applications.
    // JWT is a token-based authentication mechanism that allows users to authenticate and authorize access to resources.
    // JWT consists of three parts: header, payload, and signature.
    // The header contains metadata about the token, such as the algorithm used for signing.
    // The payload contains the claims or data associated with the token, such as user information and
    // expiration time.
    // The signature is used to verify the integrity of the token and ensure that it has not
    // been tampered with. It is created by combining the header and payload, and signing it with a secret key.
    // JWT is commonly used in RESTful APIs for stateless authentication, where the server does not need to store session information.
    // JWT is a compact, URL-safe means of representing claims to be transferred between two parties.
    // It is used for authentication and information exchange in web applications.


    @Next <!--    -->
    
 */

/**
  * @NEW_TOPIC <!-- Error Handling ? how many ways you can do error handling in node js -->

    Error handling is the process of managing errors that occur during the execution of a program or system 

    4 ways to implement error handling in node js 
    |-> 1. Try-Catch Blocks: Used to catch synchronous errors in code execution.
    |-> 2. Promises and .catch(): Used to handle asynchronous errors in promise
    |-> 3. Async/Await with Try-Catch: Used to handle asynchronous errors in async functions. 
            
            Error first call back (Async )
            ========================
            Error first callback is a convention in Node.js where the first argument of a callback function is reserved for an error object.
            If an error occurs, it is passed as the first argument, and the second argument contains the result.
            This convention allows developers to handle errors in a consistent manner across asynchronous operations.
            

    |-> 4. Error Event Listeners: Used to handle errors emitted by event emit
    |-> 5. Error Middleware in Express: Used to handle errors in Express applications.
    |-> 6. Global Error Handlers: Used to catch unhandled errors in the application.
    |-> 7. Custom Error Classes: Used to create custom error types for better error
    |-> 8. Logging Errors: Used to log errors for debugging and monitoring purposes.
     


    @Next <!--    -->
    
 */