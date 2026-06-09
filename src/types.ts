export interface OriSipConfig {
    baseURL: string;
}

export interface ApiResponse<T = any> {
    status: number;
    success: boolean;
    data: T;
    message: string;
}

export interface SipCredentials {
    uri: string;
    wsServer: string;
    username: string;
    password: string;
}

export interface ConnectData {
    username: string;
    queueName: string;
    sipCredentials: SipCredentials;
}

export type SipEventType =
    | 'registered'
    | 'registrationFailed'
    | 'unregistered'
    | 'incomingCall'
    | 'callConnected'
    | 'callEnded'
    | 'callFailed';

export interface IncomingCallEvent {
    caller: string;
    answer: (options?: { mediaConstraints?: MediaStreamConstraints }) => void;
    reject: () => void;
}

export interface CallEndedEvent {
    cause: string;
}

export interface CallFailedEvent {
    cause: string;
}
