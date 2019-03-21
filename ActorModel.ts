/**
 * 
 */

//@ts-ignore
declare global {
    interface RecipientMessageType { }
}

type ValidRecipientName = keyof RecipientMessageType;

export interface BasicMessage {
    recipient: ValidRecipientName | null;
}


interface ActorContract<T> {
    cache: {};
    channel: BroadcastChannel;

    init(): void;
    onMessage(message: T): Promise<T>;
    messageCallback(message: BasicMessage, recipient: string): void;
}

export abstract class Actor<T extends BasicMessage> {
    cache: any = {};

    init() { };
    abstract async onMessage(message: T): Promise<T>;

    protected messageCallback(message: T, recipient: string): void {
        const bcc = new BroadcastChannel(recipient);
        bcc.postMessage(message);
        bcc.close();
    }
}



export function hookup<ActorName extends ValidRecipientName>(
    recipientName: ActorName,
    actor: ActorContract<RecipientMessageType[ActorName]>
): void {
    actor.init();
    actor.channel = new BroadcastChannel(recipientName);

    actor.channel.onmessage = (event) => {
        if (event.data.getCachedResponse === true) {
            event.data.isReturn = true;
            actor.messageCallback(actor.cache as BasicMessage, event.data.recipient);
        }
        else {
            actor.onMessage(event as RecipientMessageType[ActorName]).then((response: BasicMessage) => {
                //@ts-ignore
                response.isReturn = true;
                actor.messageCallback(response, response.recipient || actor.channel.name);
            })
        }
    }
}


export type actorHandler<ActorName extends ValidRecipientName> = {
    handle: (cb: (event: BasicMessage) => void) => { dispose: () => void },
    send: (message: RecipientMessageType[ActorName]) => void,
    query: (message: RecipientMessageType[ActorName], cb: (event: BasicMessage) => void) => void,
 }

export function lookup<ActorName extends ValidRecipientName>(
    recipientName: ActorName
): actorHandler<ActorName> {
    return {
        handle: (cb: (event: BasicMessage) => void) => {
            const privateChannelName = newGuid();
            const privateBcc = new BroadcastChannel(privateChannelName);
            const bcc = new BroadcastChannel(recipientName);
            const message = {
                recipient: privateChannelName,
                getCachedResponse: true,
            };
            privateBcc.onmessage = (event: any) => {
                if (event.data.isReturn === true) {
                    privateBcc.close();
                    cb(event.data);
                }
            };
            bcc.postMessage(message);
            bcc.onmessage = (event: any) => {
                if (event.data.isReturn === true) {
                    cb(event.data);
                }
            };
            return {
                dispose: () => bcc.close(),
            };
        },
        send: (message: RecipientMessageType[ActorName]) => {
            const bcc = new BroadcastChannel(recipientName);
            bcc.postMessage(message);
            bcc.close();
        },
        query(message: RecipientMessageType[ActorName], cb: (event: any) => void) {
            const privateChannelName = newGuid();
            const privateBcc = new BroadcastChannel(privateChannelName);
            const bcc = new BroadcastChannel(recipientName);

            privateBcc.onmessage = (event: any) => {
                if (event.data.isReturn === true) {
                    privateBcc.close();
                    cb(event.data);
                }
            };

            //@ts-ignore
            message.recipient = privateChannelName;
            bcc.postMessage(message);
        },
    }
}




function newGuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}