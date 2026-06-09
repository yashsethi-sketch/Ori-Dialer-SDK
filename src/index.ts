import axios, { AxiosInstance } from 'axios';
import { SipClient } from './core/SipClient';
import type { OriSipConfig, SipEventType, ApiResponse, ConnectData } from './types';

export class OriSipSDK {
    private axiosInstance: AxiosInstance;
    private sipClient: SipClient;

    constructor(config: OriSipConfig) {
        this.axiosInstance = axios.create({
            baseURL: config.baseURL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'oriserve_sdk',
            },
        });

        this.addInterceptors(this.axiosInstance);
        this.sipClient = new SipClient();
    }

    async connect(username: string, password?: string): Promise<void> {
        if (!username) throw new Error('Username is required');
        
        const res = await this.axiosInstance.post<ApiResponse<ConnectData>>(`/api/endpoints/${username}/connect`, { password });
        const { sipCredentials } = res.data.data;
        
        await this.sipClient.register(sipCredentials);
    }

    async disconnect(username: string): Promise<void> {
        if (!username) throw new Error('Username is required');
        
        this.sipClient.stop();
        await this.axiosInstance.post<ApiResponse<void>>(`/api/endpoints/${username}/disconnect`);
    }

    call(target: string, mediaConstraints?: MediaStreamConstraints): void {
        this.sipClient.call(target, mediaConstraints);
    }

    hangup(): void { this.sipClient.hangup(); }
    mute(): void { this.sipClient.mute(); }
    unmute(): void { this.sipClient.unmute(); }
    hold(): void { this.sipClient.hold(); }
    unhold(): void { this.sipClient.unhold(); }

    on(event: SipEventType, handler: (...args: any[]) => void): void {
        this.sipClient.on(event, handler);
    }

    off(event: SipEventType, handler: (...args: any[]) => void): void {
        this.sipClient.off(event, handler);
    }

    private addInterceptors(instance: AxiosInstance): void {
        instance.interceptors.response.use(
            (res) => {
                if (res.data && typeof res.data === 'object' && res.data.success === false) {
                    const error = new Error(res.data.message || 'Request failed') as any;
                    error.status = res.data.status;
                    throw error;
                }
                return res;
            },
            (error) => {
                if (axios.isAxiosError(error)) {
                    if (error.response) {
                        const errorData = error.response.data as any;
                        const apiError = new Error(errorData?.message || error.message || 'API request failed') as any;
                        apiError.status = error.response.status;
                        apiError.code = errorData?.code;
                        throw apiError;
                    }

                    if (error.request || error.message === 'Network Error') {
                        const networkError = new Error('Network error: No response received') as any;
                        networkError.code = 'NETWORK_ERROR';
                        throw networkError;
                    }
                }

                throw error instanceof Error ? error : new Error('Unknown error occurred');
            }
        );
    }
}

export default OriSipSDK;
export * from './types';
export * from './core/SipClient';
