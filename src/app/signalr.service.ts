import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';

@Injectable({
  providedIn: 'root',
})
export class SignalRService {
  private hubConnection!: signalR.HubConnection;
  localStream!: MediaStream;
  remoteStream!: MediaStream;
  peerConnection!: RTCPeerConnection; // Add peerConnection here


  async startConnection() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://taskflutter.runasp.net/videocallhub?userId=0976311d-ae0d-43e6-8933-7510c317b1ab')
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on('ReceiveSignal', (signal: any) => {
      this.handleSignal(signal);
    });

    await this.hubConnection.start();
    console.log('SignalR connected');
  }

  async setupLocalStream() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true,
      });
      console.log('Local stream initialized:', this.localStream);
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  }

  sendSignal(userId: string, signal: any) {
    // this.hubConnection.invoke('SendSignal', userId, JSON.stringify(signal));
    this.hubConnection.invoke('SendSignal', userId, JSON.stringify(signal))
    .catch(err => console.error('Error sending signal:', err));
  }

  // When receiving a signal (offer, answer, or ICE candidate)
    async handleOffer(offerSignal: any) {
      const offer = new RTCSessionDescription(offerSignal);
      await this.peerConnection.setRemoteDescription(offer);
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      // Send the answer back to the caller
      this.sendSignal('0976311d-ae0d-43e6-8933-7510c317b1ab', { type: 'answer', sdp: answer });
    }

    // When receiving an answer
    async handleAnswer(answerSignal: any) {
      const answer = new RTCSessionDescription(answerSignal);
      await this.peerConnection.setRemoteDescription(answer);
    }

    // When receiving an ICE candidate
    handleIceCandidate(candidate: RTCIceCandidate) {
      this.peerConnection.addIceCandidate(candidate);
    }


  handleSignal(signal: any) {
    // Process WebRTC signal
    const parsedSignal = JSON.parse(signal);

    // Assuming the signal includes type and other details to determine if it's an offer, answer, or ICE candidate
    if (parsedSignal.type === 'offer') {
      // Handle offer signal
      this.handleOffer(parsedSignal);
    } else if (parsedSignal.type === 'answer') {
      // Handle answer signal
      this.handleAnswer(parsedSignal);
    } else if (parsedSignal.type === 'iceCandidate') {
      // Handle ICE candidate
      this.handleIceCandidate(parsedSignal);
    }
  }

}


