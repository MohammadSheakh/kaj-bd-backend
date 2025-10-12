import {CompressionTypes, Kafka, logLevel, Producer} from 'kafkajs'
import fs from 'fs';
import path from 'path';
import { Message } from '../../modules/chatting.module/message/message.model';
import { Conversation } from '../../modules/chatting.module/conversation/conversation.model';

const kafka = new Kafka({
    // brokers: ['host:port']
    brokers: ['kafka:9092'], //172.26.89.58:9092
    // sasl: {
    //     mechanism: 'plain',
    //     username: 'your-username',
    //     password: 'your-password'
    // },
    // maxRequestSize: 369295617, // 10485760, // 10 MB
    socketTimeout: 30000,
    
    // ssl: {
    //     rejectUnauthorized: false,
    //     // ca: [Buffer.from('-----BEGIN CERTIFICATE-----\nYOUR_CERTIFICATE_HERE\n-----END CERTIFICATE-----')]
    //     // ca:[fs.readFileSync(path.resolve('./ca.pem', 'utf-8'))]
    //     // we need to keep ca.pem file in server level .. not inside source 
    // },
    // Add debug logging
    logLevel: logLevel.INFO, // Change to DEBUG for more verbose logging
    retry: {
        initialRetryTime: 100,
        retries: 8
    },

})

// lets create producer and consumers..
/*******************
  
    const producer = kafka.producer()
    const consumer = kafka.consumer({ groupId: 'test-group' })

*******************/

let producer : null | Producer = null;

// i don't want to create producer every time .. i want to cache this 
export async function createProducer (){
    if (producer) return producer;
    const _producer = kafka.producer({
  // Add these limits
  maxRequestSize: 10485760, // 10 MB // 1048576, // 1MB
  compression: CompressionTypes.GZIP,
  
  // Batch settings
  batchSize: 16384,
  lingerMs: 10,
}) // make a local producer
    await _producer.connect()
    producer = _producer;
    return producer
}

// we produce message inside socket service .. 


export async function produceMessage(message : object) {
    const producer = await createProducer()
    // with the help of this producer we can produce message .. 
    await producer.send({
        topic: 'SuplifyMessages', // in which topic we want to publish this message
        messages: [
            { key: `message-${Date.now()}`, value: JSON.stringify(message) }
        ]
    })

    return true ; // which means message is set 
}

//---------------------------------
//  we have to start this consumer in server.ts 
//---------------------------------
export async function startMessageConsumer(){

    console.log("Consumer is runnning ... 🔰🚥🚦🎯📈 ")

    const consumer = kafka.consumer({
        groupId: 'default',

        // Add these consumer configurations
        maxBytes: 419430400, // 400MB
        fetchMaxBytes: 419430400,
        fetchMaxWaitMs: 1000

     }) // we need to pass a groupId
    await consumer.connect()

    await consumer.subscribe({topic: 'SuplifyMessages', fromBeginning: true})

    await consumer.run({
        autoCommit: true, // auto commit the offset
        // autoCommitInterval: 5 // after every 5 seconds lets commit
        eachMessage: async ({ topic, partition, message, pause }) => {
            
            if(!message.value) return; // if message is empty then return

            console.log(`New  message received: as string >> ${message.value.toString()}`)
            // {"conversationId":"68b1a98a8466b931f264aff9",
            //     "text":"brandNewMsg2",
            //     "timestamp":"2025-08-29T15:30:40.056Z",
            //     "senderId":"68ad4950152bc026f1035755"}
            
            // let put our message into database .. 
            try{
            
            // TODO Must : need to Add type    
            const msg = JSON.parse(message.value.toString())
            // await saveMessageToDatabase(msg)

            const newMessage = await Message.create(msg);

            const updatedConversation = await Conversation.findByIdAndUpdate(newMessage.conversationId, {
             lastMessage: newMessage._id,
            });

            }catch(err){
                // if some error happen .. lets log that and pause .. 
                console.error(`Error processing message ${message.value.toString()}:`, err)
                pause()

                setTimeout(() => {
                    consumer.resume([{topic: 'SuplifyMessages'}])
                }, 60 * 1000)
            }

        }
    })
}


/************
async function produceMessage(key:string , message: string){
    const producer = await createProducer()
    // with the help of this producer we can produce message .. 
    ******** GPT Code
    producer.send({
        topic: 'test-topic',
        messages: [
            { key, value: message }
        ]
    })
    *************** *

    // we want to return clouser function
    return () => {

    }
}

********* */


// export default kafka
export { kafka }

/***************

 to install kafka in ubuntu .. 



 * ************** */