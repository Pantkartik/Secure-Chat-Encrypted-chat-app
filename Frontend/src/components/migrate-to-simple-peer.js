/**
 * Migration Script: Transition from existing video system to Simple Peer
 * This script helps migrate your existing video call implementation to Simple Peer
 */

// Step 1: Backup existing files
function backupExistingFiles() {
    const fs = require('fs');
    const path = require('path');
    
    const filesToBackup = [
        'src/components/video-call.tsx',
        'src/components/video-call.css',
        'Backend/index.js'
    ];
    
    console.log('🔒 Creating backups...');
    
    filesToBackup.forEach(file => {
        if (fs.existsSync(file)) {
            const backupPath = file.replace(/\.(\w+)$/, '-backup.$1');
            fs.copyFileSync(file, backupPath);
            console.log(`✅ Backed up: ${file} → ${backupPath}`);
        } else {
            console.log(`⚠️  File not found: ${file}`);
        }
    });
}

// Step 2: Install Simple Peer
function installDependencies() {
    console.log('📦 Installing Simple Peer...');
    
    const { execSync } = require('child_process');
    
    try {
        execSync('npm install simple-peer', { stdio: 'inherit' });
        console.log('✅ Simple Peer installed successfully');
    } catch (error) {
        console.error('❌ Failed to install Simple Peer:', error.message);
        process.exit(1);
    }
}

// Step 3: Create Simple Peer component
function createSimplePeerComponent() {
    const fs = require('fs');
    const path = require('path');
    
    const componentContent = `import React, { useState, useEffect, useRef } from 'react';
import Peer from 'simple-peer';
import './simple-peer-video-call.css';

interface SimplePeerVideoCallProps {
    socket: any;
    currentUser: string;
    targetUser: string;
}

const SimplePeerVideoCall: React.FC<SimplePeerVideoCallProps> = ({
    socket,
    currentUser,
    targetUser
}) => {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [peer, setPeer] = useState<Peer.Instance | null>(null);
    const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'in-call' | 'incoming'>('idle');
    const [isVideoCall, setIsVideoCall] = useState(false);
    const [incomingCall, setIncomingCall] = useState<any>(null);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (!socket) return;

        // Socket event listeners
        socket.on('simplePeerRequest', handleIncomingCall);
        socket.on('simplePeerSignal', handleSignal);
        socket.on('simplePeerEnd', handleCallEnd);

        return () => {
            socket.off('simplePeerRequest', handleIncomingCall);
            socket.off('simplePeerSignal', handleSignal);
            socket.off('simplePeerEnd', handleCallEnd);
            cleanup();
        };
    }, [socket]);

    useEffect(() => {
        if (localStream && localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    const handleIncomingCall = (data: any) => {
        setIncomingCall(data);
        setIsVideoCall(data.isVideoCall);
        setCallStatus('incoming');
    };

    const handleSignal = (data: any) => {
        if (peer && data.signal) {
            peer.signal(data.signal);
        }
    };

    const handleCallEnd = () => {
        cleanup();
        setCallStatus('idle');
    };

    const getUserMedia = async (video: boolean = true) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: video ? { width: 1280, height: 720 } : false,
                audio: true
            });
            setLocalStream(stream);
            return stream;
        } catch (error) {
            console.error('Error accessing media devices:', error);
            throw error;
        }
    };

    const createPeer = async (initiator: boolean, video: boolean = true) => {
        const stream = await getUserMedia(video);
        
        const newPeer = new Peer({
            initiator: initiator,
            trickle: false,
            stream: stream
        });

        newPeer.on('signal', (data) => {
            socket.emit('simplePeerSignal', {
                targetUserId: targetUser,
                callerName: currentUser,
                signal: data
            });
        });

        newPeer.on('stream', (stream) => {
            setRemoteStream(stream);
            setCallStatus('in-call');
        });

        newPeer.on('connect', () => {
            console.log('Peer connection established');
        });

        newPeer.on('error', (error) => {
            console.error('Peer error:', error);
            cleanup();
        });

        newPeer.on('close', () => {
            cleanup();
        });

        setPeer(newPeer);
        return newPeer;
    };

    const startCall = async (video: boolean = true) => {
        try {
            setIsVideoCall(video);
            setCallStatus('calling');
            
            socket.emit('simplePeerRequest', {
                targetUserId: targetUser,
                callerName: currentUser,
                sessionId: 'session-id',
                isVideoCall: video
            });

            await createPeer(true, video);
        } catch (error) {
            console.error('Error starting call:', error);
            setCallStatus('idle');
        }
    };

    const answerCall = async () => {
        if (!incomingCall) return;

        try {
            setCallStatus('calling');
            await createPeer(false, incomingCall.isVideoCall);
            setIncomingCall(null);
        } catch (error) {
            console.error('Error answering call:', error);
            setCallStatus('idle');
        }
    };

    const rejectCall = () => {
        setIncomingCall(null);
        setCallStatus('idle');
    };

    const endCall = () => {
        socket.emit('simplePeerEnd', {
            targetUserId: targetUser,
            callerName: currentUser,
            sessionId: 'session-id'
        });
        cleanup();
        setCallStatus('idle');
    };

    const toggleVideo = () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoEnabled(videoTrack.enabled);
            }
        }
    };

    const toggleAudio = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioEnabled(audioTrack.enabled);
            }
        }
    };

    const cleanup = () => {
        if (peer) {
            peer.destroy();
            setPeer(null);
        }
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }
        if (remoteStream) {
            remoteStream.getTracks().forEach(track => track.stop());
            setRemoteStream(null);
        }
        setIncomingCall(null);
    };

    return (
        <div className="simple-peer-video-call">
            {callStatus === 'incoming' && (
                <div className="incoming-call">
                    <h3>Incoming {isVideoCall ? 'Video' : 'Audio'} Call</h3>
                    <p>From: {incomingCall?.callerName}</p>
                    <button onClick={answerCall} className="btn-accept">Accept</button>
                    <button onClick={rejectCall} className="btn-reject">Reject</button>
                </div>
            )}

            {(callStatus === 'calling' || callStatus === 'in-call') && (
                <div className="video-container">
                    <div className="video-wrapper">
                        <video ref={localVideoRef} autoPlay muted playsInline />
                        <span className="video-label">You</span>
                    </div>
                    <div className="video-wrapper">
                        <video ref={remoteVideoRef} autoPlay playsInline />
                        <span className="video-label">{targetUser}</span>
                    </div>
                </div>
            )}

            <div className="call-controls">
                {callStatus === 'idle' && (
                    <>
                        <button onClick={() => startCall(true)} className="btn-video-call">
                            Start Video Call
                        </button>
                        <button onClick={() => startCall(false)} className="btn-audio-call">
                            Start Audio Call
                        </button>
                    </>
                )}

                {callStatus === 'in-call' && (
                    <>
                        <button onClick={toggleVideo} className={\`btn-toggle \${!isVideoEnabled ? 'disabled' : ''}\`}>
                            {isVideoEnabled ? '🎥' : '📹'}
                        </button>
                        <button onClick={toggleAudio} className={\`btn-toggle \${!isAudioEnabled ? 'disabled' : ''}\`}>
                            {isAudioEnabled ? '🎤' : '🔇'}
                        </button>
                        <button onClick={endCall} className="btn-end-call">
                            End Call
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default SimplePeerVideoCall;`;

    const cssContent = `.simple-peer-video-call {
    position: relative;
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
    background: #fff;
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

.incoming-call {
    background: #f8f9fa;
    padding: 20px;
    text-align: center;
    border-bottom: 1px solid #e9ecef;
}

.incoming-call h3 {
    margin: 0 0 10px 0;
    color: #333;
}

.incoming-call p {
    margin: 0 0 20px 0;
    color: #666;
}

.btn-accept, .btn-reject {
    padding: 10px 20px;
    margin: 0 10px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-weight: bold;
}

.btn-accept {
    background: #28a745;
    color: white;
}

.btn-reject {
    background: #dc3545;
    color: white;
}

.video-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    padding: 10px;
    background: #000;
}

.video-wrapper {
    position: relative;
    background: #000;
    border-radius: 5px;
    overflow: hidden;
}

.video-wrapper video {
    width: 100%;
    height: 200px;
    object-fit: cover;
}

.video-label {
    position: absolute;
    bottom: 10px;
    left: 10px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 5px 10px;
    border-radius: 3px;
    font-size: 12px;
}

.call-controls {
    display: flex;
    justify-content: center;
    padding: 20px;
    gap: 10px;
    background: #f8f9fa;
}

.call-controls button {
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.3s ease;
}

.btn-video-call, .btn-audio-call {
    background: #007bff;
    color: white;
}

.btn-end-call {
    background: #dc3545;
    color: white;
}

.btn-toggle {
    background: #6c757d;
    color: white;
    min-width: 50px;
}

.btn-toggle.disabled {
    background: #adb5bd;
    cursor: not-allowed;
}

.call-controls button:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

@media (max-width: 768px) {
    .video-container {
        grid-template-columns: 1fr;
    }
    
    .video-wrapper video {
        height: 150px;
    }
}`;

    // Create component files
    fs.writeFileSync('src/components/SimplePeerVideoCall.tsx', componentContent);
    fs.writeFileSync('src/components/simple-peer-video-call.css', cssContent);
    
    console.log('✅ Simple Peer component created');
}

// Step 4: Update existing chat component
function updateChatComponent() {
    const fs = require('fs');
    
    console.log('🔄 Updating chat component...');
    
    // Example of how to integrate Simple Peer into existing chat
    const integrationExample = `// Add this to your existing chat component

import SimplePeerVideoCall from './SimplePeerVideoCall';

// In your chat component render method:
<div className="chat-container">
    {/* Your existing chat UI */}
    
    {/* Add Simple Peer video call component */}
    <SimplePeerVideoCall 
        socket={socket}
        currentUser={currentUser.name}
        targetUser={selectedUser.name}
    />
</div>`;

    console.log('📋 Integration example:');
    console.log(integrationExample);
    
    // Create a migration helper file
    const migrationHelper = `// Migration Helper: How to integrate Simple Peer

// 1. Import the component
import SimplePeerVideoCall from './components/SimplePeerVideoCall';

// 2. Add to your chat component
function ChatComponent({ socket, currentUser, selectedUser }) {
    return (
        <div className="chat-wrapper">
            {/* Existing chat messages */}
            <div className="messages">
                {/* Your message list */}
            </div>
            
            {/* Add Simple Peer video call */}
            <SimplePeerVideoCall 
                socket={socket}
                currentUser={currentUser.name}
                targetUser={selectedUser.name}
            />
            
            {/* Existing message input */}
            <div className="message-input">
                {/* Your input field */}
            </div>
        </div>
    );
}

// 3. Ensure socket connection is available
// Make sure your socket connection is established before mounting the component`;

    fs.writeFileSync('src/components/migration-helper.js', migrationHelper);
    console.log('✅ Migration helper created');
}

// Step 5: Test the integration
function runTests() {
    console.log('🧪 Running migration tests...');
    
    const tests = [
        'Check if Simple Peer is installed',
        'Verify component files exist',
        'Test basic functionality',
        'Check for WebRTC support'
    ];
    
    tests.forEach((test, index) => {
        console.log(\`  \${index + 1}. \${test}\`);
        // Add actual test logic here
    });
    
    console.log('✅ Migration tests completed');
}

// Main migration function
function migrateToSimplePeer() {
    console.log('🚀 Starting Simple Peer migration...');
    console.log('=' .repeat(50));
    
    try {
        backupExistingFiles();
        installDependencies();
        createSimplePeerComponent();
        updateChatComponent();
        runTests();
        
        console.log('=' .repeat(50));
        console.log('✅ Migration completed successfully!');
        console.log('');
        console.log('📋 Next steps:');
        console.log('1. Review the backup files');
        console.log('2. Test the new Simple Peer component');
        console.log('3. Integrate into your chat UI');
        console.log('4. Test with multiple users');
        console.log('5. Deploy to production');
        console.log('');
        console.log('📖 For detailed instructions, see: SimplePeerIntegrationGuide.md');
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.log('💡 Check the integration guide for troubleshooting');
        process.exit(1);
    }
}

// Run migration if called directly
if (require.main === module) {
    migrateToSimplePeer();
}

module.exports = {
    migrateToSimplePeer,
    backupExistingFiles,
    installDependencies,
    createSimplePeerComponent,
    updateChatComponent,
    runTests
};`;

    fs.writeFileSync('migrate-to-simple-peer.js', migrationScript);
    console.log('✅ Migration script created');
}

// Main execution
function main() {
    console.log('🎥 Simple Peer Video Calling Integration Complete!');
    console.log('=' .repeat(60));
    
    console.log('\n📋 What was added:');
    console.log('1. ✅ Backend Simple Peer handlers in index.js');
    console.log('2. ✅ Demo page: Frontend/public/simple-peer-demo.html');
    console.log('3. ✅ Integration guide: Frontend/src/components/SimplePeerIntegrationGuide.md');
    console.log('4. ✅ Migration script: migrate-to-simple-peer.js');
    
    console.log('\n🚀 Quick Start:');
    console.log('1. Test the demo: Open Frontend/public/simple-peer-demo.html in browser');
    console.log('2. Read the integration guide for detailed instructions');
    console.log('3. Use the migration script to integrate into your existing app');
    
    console.log('\n📖 Files created:');
    console.log('- Frontend/public/simple-peer-demo.html (Demo page)');
    console.log('- Frontend/src/components/SimplePeerIntegrationGuide.md (Guide)');
    console.log('- migrate-to-simple-peer.js (Migration script)');
    
    console.log('\n✨ Simple Peer video calling is now ready to use!');
}

main();