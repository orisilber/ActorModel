# ActorModel
Created a simple implementation of an actor model in typescript using the js BroadcastChannel API, allowing for easier communication between web workers

# Implementation
First create the actor class
```typescript
declare global { 
  interface RecipientMessageType {
    "MyActor": MyMessage;
  }
}

class MyMessage implements BasicMessage {
  recipient: BasicMessageRecipient;
  message: any;
}

export class MyActor extends Actor<MyMessage> {
  init() { }

  onMessage(message: MyMessage) {
    console.log(message)
    return new Promise<MyMessage>(resolve => {
      resolve({
        recipient: "SELF",
        message: 'hello',
      });
    })
  }
}
```
Then we will call the hookup function
```typescript
hookup("MyActor", new MyActor());
```
Lastly we will call the lookup function and use the ActorHanlder methods
```typescript
const actorHandler = lookup("MyActor");

actorHandler.handle((event) => {console.log(event)});
actorHandler.send({recipient: "SELF", message: null});
```

