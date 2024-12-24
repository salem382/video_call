import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { SignalRService } from '../signalr.service';


@Component({
  selector: 'app-video-call',
  standalone: true, // Add this line
  template: `
    <video #localVideo autoplay playsinline></video>
    <video #remoteVideo autoplay playsinline></video>
    <button (click)="startCall()">Start Call</button>
  `,
  styles: [],
})
export class VideoCallComponent implements OnInit {
  @ViewChild('localVideo') localVideo!: ElementRef;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef;
  peerConnection!: RTCPeerConnection;

  constructor(private signalRService: SignalRService) {}

  async ngOnInit() {
    await this.signalRService.startConnection();
    await this.signalRService.setupLocalStream();
    this.localVideo.nativeElement.srcObject = this.signalRService.localStream;
  }

  async startCall() {
    if (!this.signalRService.localStream) {
      console.error('Local stream is not available');
      return;  // Exit the function if localStream is undefined
    }
    console.log('Local stream available:', this.signalRService.localStream);
  
    // Proceed with setting up the peer connection and adding tracks
    const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
    this.peerConnection = new RTCPeerConnection(config);
    console.log('Peer connection created:', this.peerConnection);
  
    this.signalRService.localStream.getTracks().forEach((track) => {
      console.log('Adding track:', track);
      this.peerConnection.addTrack(track, this.signalRService.localStream);
    });
  
    this.peerConnection.ontrack = (event) => {
      console.log('Track received:', event);
      this.signalRService.remoteStream = event.streams[0];
      this.remoteVideo.nativeElement.srcObject = this.signalRService.remoteStream;
    };
  
    const offer = await this.peerConnection.createOffer();
    console.log('Offer created:', offer);
    await this.peerConnection.setLocalDescription(offer);
    console.log('Offer set as local description:', offer);
  
      this.signalRService.sendSignal('0976311d-ae0d-43e6-8933-7510c317b1ab', offer);
      console.log("Offer sent");
 
  }
  
  
}
