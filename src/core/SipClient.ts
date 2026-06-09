import { UA, WebSocketInterface } from 'jssip';
import type { RTCSession } from 'jssip/lib/RTCSession';
import type { SipCredentials, SipEventType, IncomingCallEvent } from '../types';

type EventHandler = (...args: any[]) => void;

export class SipClient {
    private ua: UA | null = null;
    private currentSession: RTCSession | null = null;
    private listeners: Map<SipEventType, EventHandler[]> = new Map();

    on(event: SipEventType, handler: EventHandler): void {
        const handlers = this.listeners.get(event) ?? [];
        this.listeners.set(event, [...handlers, handler]);
    }

    off(event: SipEventType, handler: EventHandler): void {
        const handlers = this.listeners.get(event) ?? [];
        this.listeners.set(event, handlers.filter(h => h !== handler));
    }

    private emit(event: SipEventType, ...args: any[]): void {
        this.listeners.get(event)?.forEach(h => h(...args));
    }

    register(credentials: SipCredentials): Promise<void> {
        return new Promise((resolve, reject) => {
            const socket = new WebSocketInterface(credentials.wsServer);

            this.ua = new UA({
                sockets: [socket],
                uri: credentials.uri,
                password: credentials.password,
                register: true
            });

            this.ua.on('registered', () => {
                this.emit('registered');
                resolve();
            });

            this.ua.on('registrationFailed', (e: any) => {
                this.emit('registrationFailed', e);
                reject(new Error(`SIP registration failed: ${e.cause}`));
            });

            this.ua.on('unregistered', () => {
                this.emit('unregistered');
            });

            this.ua.on('newRTCSession', ({ session, originator, request }: any) => {
                this.currentSession = session as RTCSession;

                if (originator === 'remote') {
                    const incoming: IncomingCallEvent = {
                        caller: request.from?.uri?.user ?? 'unknown',
                        answer: (options) => {
                            this.currentSession?.answer({
                                mediaConstraints: options?.mediaConstraints ?? { audio: true, video: false }
                            });
                        },
                        reject: () => this.currentSession?.terminate()
                    };
                    this.emit('incomingCall', incoming);
                }

                this.currentSession.on('confirmed', () => this.emit('callConnected'));
                this.currentSession.on('ended', (e: any) => this.emit('callEnded', { cause: e.cause }));
                this.currentSession.on('failed', (e: any) => this.emit('callFailed', { cause: e.cause }));
            });

            this.ua.start();
        });
    }

    call(target: string, mediaConstraints: MediaStreamConstraints = { audio: true, video: false }): void {
        if (!this.ua) throw new Error('SIP client not connected. Call connect() first.');

        this.ua.call(target, {
            mediaConstraints,
            rtcOfferConstraints: { offerToReceiveAudio: true, offerToReceiveVideo: false }
        });
    }

    hangup(): void {
        this.currentSession?.terminate();
        this.currentSession = null;
    }

    mute(): void { this.currentSession?.mute(); }
    unmute(): void { this.currentSession?.unmute(); }
    hold(): void { this.currentSession?.hold(); }
    unhold(): void { this.currentSession?.unhold(); }

    stop(): void {
        this.ua?.stop();
        this.ua = null;
        this.currentSession = null;
    }
}
