# @ori-serve/sip-sdk

[![npm package](https://img.shields.io/badge/npm-@ori--serve/dialer--sdk-blue.svg)](https://www.npmjs.com/package/@ori-serve/dialer-sdk)

Browser SDK for ORI SIP/WebRTC agent communication — handles JsSIP internally.

## Installation

\`\`\`bash
npm install @ori-serve/sip-sdk
\`\`\`

## Quick Start

\`\`\`typescript
import OriSipSDK from '@ori-serve/sip-sdk';

// 1. Initialize the SDK
const sdk = new OriSipSDK({
    baseURL: 'https://api.yourdomain.com'
});

// 2. Setup Event Listeners
sdk.on('registered', () => {
    console.log('Successfully registered with SIP server');
});

sdk.on('incomingCall', (event) => {
    console.log('Incoming call from:', event.caller);
    // Answer the call with audio only
    event.answer({ mediaConstraints: { audio: true, video: false } });
});

sdk.on('callConnected', () => {
    console.log('Call established');
});

sdk.on('callEnded', (event) => {
    console.log('Call ended:', event.cause);
});

// 3. Connect and Register
async function setupSip() {
    try {
        await sdk.connect('agent_username', 'agent_password');
    } catch (error) {
        console.error('Failed to connect:', error);
    }
}

setupSip();

// 4. Make an Outbound Call
function makeCall() {
    sdk.call('sip:target@domain.com', { audio: true, video: false });
}

// 5. Call Controls
// sdk.mute();
// sdk.unmute();
// sdk.hold();
// sdk.unhold();
// sdk.hangup();
\`\`\`

## Events

The SDK emits the following events:
- \`registered\`: Triggered when the SIP client successfully registers.
- \`registrationFailed\`: Triggered if the registration process fails.
- \`unregistered\`: Triggered when the client is unregistered.
- \`incomingCall\`: Triggered when there is an incoming call. Provides an event object with \`caller\`, \`answer()\` and \`reject()\` functions.
- \`callConnected\`: Triggered when a call (inbound or outbound) is confirmed and established.
- \`callEnded\`: Triggered when the active call ends.
- \`callFailed\`: Triggered if the call fails to establish.

## License
MIT
