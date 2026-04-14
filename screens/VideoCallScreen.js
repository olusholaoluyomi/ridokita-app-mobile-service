import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput, Alert } from 'react-native';
import { RTCView, RTCPeerConnection, RTCIceCandidate, RTCSessionDescription, mediaDevices } from 'react-native-webrtc';
import io from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import * as DocumentPicker from 'expo-document-picker';
import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';
import { useAuth } from '../contexts/AuthContext';

import { API_URL, SOCKET_URL } from '../config';
const socket = io(SOCKET_URL);

export default function VideoCallScreen({ route, navigation }) {
  const { appointmentId } = route.params;
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const peerConnection = useRef(null);
  const { user } = useAuth(); // Assuming useAuth is available

  useEffect(() => {
    initWebRTC();
    socket.emit('join-room', appointmentId, user.id);

    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('receive-message', handleMessage);

    return () => {
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('receive-message');
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnection.current) {
        peerConnection.current.close();
      }
    };
  }, []);

  const initWebRTC = async () => {
    const cameraPermission = await Camera.requestCameraPermissionsAsync();
    const audioPermission = await Audio.requestPermissionsAsync();

    if (cameraPermission.status !== 'granted' || audioPermission.status !== 'granted') {
      Alert.alert('Permissions needed', 'Camera and microphone permissions are required for video calls');
      return;
    }

    const stream = await mediaDevices.getUserMedia({ video: true, audio: true });
    setLocalStream(stream);

    peerConnection.current = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    stream.getTracks().forEach(track => {
      peerConnection.current.addTrack(track, stream);
    });

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', { target: 'other', candidate: event.candidate });
      }
    };

    peerConnection.current.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    // Create offer if doctor
    if (user.role === 'doctor') {
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      socket.emit('offer', { target: 'patient', sdp: offer });
    }
  };

  const handleOffer = async (data) => {
    await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
    const answer = await peerConnection.current.createAnswer();
    await peerConnection.current.setLocalDescription(answer);
    socket.emit('answer', { target: data.target, sdp: answer });
  };

  const handleAnswer = async (data) => {
    await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
  };

  const handleIceCandidate = async (data) => {
    await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate));
  };

  const handleMessage = (data) => {
    setMessages(prev => [...prev, data]);
  };

  const sendMessage = () => {
    socket.emit('send-message', { roomId: appointmentId, message, sender: user.name });
    setMessage('');
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        // Upload file
        const formData = new FormData();
        formData.append('file', {
          uri: result.uri,
          name: result.name,
          type: result.mimeType,
        });
        const token = await SecureStore.getItemAsync('token');
        const uploadResponse = await fetch(`${API_URL}/api/files/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const uploadData = await uploadResponse.json();
        socket.emit('send-message', { roomId: appointmentId, message: `File: ${result.name}`, fileUrl: uploadData.url, sender: user.name });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.videoContainer}>
        {localStream && <RTCView streamURL={localStream.toURL()} style={styles.video} />}
        {remoteStream && <RTCView streamURL={remoteStream.toURL()} style={styles.video} />}
      </View>
      <View style={styles.chatContainer}>
        <FlatList
          data={messages}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={[styles.messageBubble, item.sender === user.name ? styles.myMessage : styles.otherMessage]}>
              <Text style={styles.sender}>{item.sender}</Text>
              <Text style={styles.messageText}>{item.message}</Text>
              {item.fileUrl && <Text style={styles.fileText}>📎 File attached</Text>}
            </View>
          )}
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Type message"
          />
          <TouchableOpacity onPress={sendMessage}>
            <Text style={styles.sendButton}>Send</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={pickDocument}>
            <Text style={styles.attachButton}>📎</Text>
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity style={styles.endButton} onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>End Call</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  videoContainer: { flex: 1, flexDirection: 'row' },
  video: { flex: 1 },
  chatContainer: { flex: 1, padding: 10 },
  messageBubble: { padding: 10, marginVertical: 5, borderRadius: 10, maxWidth: '80%' },
  myMessage: { backgroundColor: '#007bff', alignSelf: 'flex-end' },
  otherMessage: { backgroundColor: '#e9ecef', alignSelf: 'flex-start' },
  sender: { fontWeight: 'bold' },
  messageText: {},
  fileText: { fontStyle: 'italic', color: '#666' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  input: { flex: 1, borderWidth: 1, padding: 5, borderRadius: 5 },
  sendButton: { marginLeft: 10, color: '#007bff', fontWeight: 'bold' },
  attachButton: { marginLeft: 10, fontSize: 20 },
  endButton: { backgroundColor: '#dc3545', padding: 15, alignItems: 'center' },
  buttonText: { color: '#fff' },
});