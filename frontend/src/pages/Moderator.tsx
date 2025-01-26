import React, { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { firestore, firebase } from "../lib/firebase";
import toast from "react-hot-toast";
import { FaMicrophoneAltSlash, FaVideoSlash, FaMicrophone, FaVideo, FaCamera, FaCopy, FaPhoneSlash } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import NameDialog from "../components/meeting/NameDialog";
import RealTimeTranscript from "../components/meeting/RealTimeTranscript";
import TalkingAvatar from "../components/TalkingAvatar";

type OfferAnswerPair = {
  offer: {
    sdp: string | null;
    type: RTCSdpType;
  } | null;
  answer: {
    sdp: string | null;
    type: RTCSdpType;
  } | null;
};
const Moderator = () => {
  const [myId, setMyID] = useState<string | null>(null);

  return <Suspense fallback={<div>Loading...</div>}>{myId ? <PageContent myId={myId} /> : <NameDialog setMyId={setMyID} />}</Suspense>;
};

const PageContent: React.FC<{ myId: string }> = ({ myId }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isClient, setIsClient] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [callId, setCallId] = useState<string>();
  const webcamButtonRef = useRef<HTMLButtonElement>(null);
  const callButtonRef = useRef<HTMLButtonElement>(null);
  const callInputRef = useRef<HTMLInputElement>(null);
  const answerButtonRef = useRef<HTMLButtonElement>(null);
  const hangupButtonRef = useRef<HTMLButtonElement>(null);
  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const [pcs, setPcs] = useState<RTCPeerConnection[]>([]);
  const [myIndex, setMyIndex] = useState<number>();
  const [remoteVideoRefs, setRemoteVideoRefs] = useState<(React.RefObject<HTMLVideoElement> | null)[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<(MediaStream | null)[]>([]);
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [nameList, setNameList] = useState<string[]>();
  const [stream, setStream] = useState<MediaStream | null>(null);
  let localStream: MediaStream | null;
  const [beforeCall, setBeforeCall] = useState(0);
  const [afterCall, setAfterCall] = useState(0);
  const [callLeft, setCallLeft] = useState(0);

  const generateShortId = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 5; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };
  const servers = {
    iceServers: [
      {
        urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
      },
    ],
    iceCandidatePoolSize: 10,
  };

  const handleCallButtonClick = async () => {
    setInCall(true);
    if (hangupButtonRef.current) hangupButtonRef.current.disabled = false;
    const shortId = generateShortId();
    const callDoc = firestore.collection("calls").doc(shortId);
    let indexOfOtherConnectedCandidates = callDoc.collection("otherCandidates").doc(`indexOfConnectedCandidates`);
    const screenshotDoc = callDoc.collection("screenshotSignal").doc("screenshotSignalDocument");

    await setCallId(shortId);
    navigate(`${location.pathname}?id=${callDoc.id}`);

    await indexOfOtherConnectedCandidates.set({ indexOfCurrentUsers: [1] });
    if (callInputRef.current) {
      callInputRef.current.value = callDoc.id;
    }
    await callDoc.set({
      connectedUsers: 1,
      screenSharer: -1,
      loading: false,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(), // Timestamp added here
    });
    await screenshotDoc.set({ screenshotSignal: 1 });

    const myIndex = 1;
    setMyIndex(myIndex);
    let pc: RTCPeerConnection;

    indexOfOtherConnectedCandidates.onSnapshot(async (doc) => {
      if (doc.exists) {
        //Check for any newly addded users
        if (
          doc.data()?.indexOfCurrentUsers[doc.data()?.indexOfCurrentUsers.length - 1] != myIndex &&
          doc.data()?.indexOfCurrentUsers[doc.data()?.indexOfCurrentUsers.length - 1] &&
          doc.data()?.indexOfCurrentUsers[doc.data()?.indexOfCurrentUsers.length - 1] > myIndex
        ) {
          const newAddedUser = doc.data()?.indexOfCurrentUsers[doc.data()?.indexOfCurrentUsers.length - 1];
          let signalDoc = callDoc.collection("signal").doc(`signal${newAddedUser}${myIndex}`);
          console.log(`${newAddedUser} added`);
          console.log(`${myIndex} myIndex`);
          await signalDoc.set({
            userAdded: `${newAddedUser} added`,
            signal: 0,
          });
          let offerAnswerPairs: firebase.firestore.DocumentReference<firebase.firestore.DocumentData>;
          let offerCandidatesCollection: firebase.firestore.CollectionReference<firebase.firestore.DocumentData>;
          let answerCandidatesCollection: firebase.firestore.CollectionReference<firebase.firestore.DocumentData>;
          let candidateNameDoc: firebase.firestore.DocumentReference<firebase.firestore.DocumentData>;
          signalDoc.onSnapshot(async (doc) => {
            if (doc.exists) {
              const data = doc.data();
              const signal = data?.signal;
              if (signal === 0) {
                pc = new RTCPeerConnection(servers);
                candidateNameDoc = callDoc.collection("otherCandidates").doc(`candidate${newAddedUser}${myIndex}`);
                candidateNameDoc.set({ myName: myId, joiner: "" });
                await localStream?.getTracks().forEach((track) => {
                  pc.addTrack(track, localStream as MediaStream);
                });

                let onTrackExecuted = false;

                pc.ontrack = async (event) => {
                  if (!onTrackExecuted) {
                    onTrackExecuted = true;
                    const remoteStream = new MediaStream();
                    await event.streams[0].getTracks().forEach((track) => {
                      remoteStream.addTrack(track);
                    });
                    console.log("Remote stream reflected");
                    await setRemoteStreams((prevStreams) => [...prevStreams, remoteStream]);
                    const candidateDocData = await candidateNameDoc.get();
                    if (candidateDocData.exists) {
                      const joinerName = candidateDocData?.data()?.joiner;
                      console.log(joinerName);
                      setNameList((prevNameList = []) => [...(prevNameList || []), joinerName]);
                    }
                  }
                };

                offerCandidatesCollection = callDoc.collection("otherCandidates").doc(`candidate${newAddedUser}${myIndex}`).collection("offerCandidates");
                answerCandidatesCollection = callDoc.collection("otherCandidates").doc(`candidate${newAddedUser}${myIndex}`).collection("answerCandidates");
                pc.onicecandidate = async (event) => {
                  event.candidate && (await offerCandidatesCollection.add(event.candidate.toJSON()));
                };
                offerAnswerPairs = callDoc.collection("otherCandidates").doc(`offerAnswerPairs${newAddedUser}${myIndex}`);

                pc.onicecandidate = async (event) => {
                  event.candidate && (await offerCandidatesCollection.add(event.candidate.toJSON()));
                };

                const offerDescription = await pc.createOffer();
                await pc.setLocalDescription(offerDescription);

                let offer = {
                  sdp: offerDescription.sdp as string,
                  type: offerDescription.type,
                };

                let offerAnswerPair: OfferAnswerPair = {
                  offer: offer,
                  answer: null,
                };

                const currentPairs: OfferAnswerPair[] = (await offerAnswerPairs.get()).data()?.offerAnswerPairs || [];

                await currentPairs.push(offerAnswerPair);
                console.log(currentPairs);
                await offerAnswerPairs.set({
                  offerAnswerPairs: currentPairs,
                });
                await signalDoc.set({ signal: 1 });
              } else if (signal == 2) {
                const answerDescription = new RTCSessionDescription((await offerAnswerPairs.get()).data()?.offerAnswerPairs[0].answer);
                console.log("Data on receiver is ", (await offerAnswerPairs.get()).data()?.offerAnswerPairs[0].answer);
                await pc.setRemoteDescription(answerDescription);

                await answerCandidatesCollection.onSnapshot(
                  async (snapshot) => {
                    await snapshot.docChanges().forEach(async (change) => {
                      if (change.type === "added") {
                        const candidateData = change.doc.data();
                        const candidate = new RTCIceCandidate(candidateData);
                        await pc
                          .addIceCandidate(candidate)
                          .then(() => {
                            console.log("Ice candidate added successfully");
                          })
                          .catch((error) => {
                            console.error("Error adding ice candidate:", error);
                          });
                      }
                    });
                  },
                  (error) => {
                    console.error("Error getting candidate collection:", error);
                  }
                );
                setPcs((prevPcs) => [...prevPcs, pc]);
                await signalDoc.update({ signal: 3 });
              }
            }
          });
        }
      } else {
        console.log("No such document!");
      }
    });
  };

  const handleAnswerButtonClick = async () => {
    setInCall(true);
    if (hangupButtonRef.current) hangupButtonRef.current.disabled = false;

    let callId;
    const searchParams = new URLSearchParams(location.search);
    const idFromParams = searchParams.get("id");

    if (idFromParams) {
      callId = idFromParams;
      setCallId(idFromParams);
      navigate(`${location.pathname}?id=${idFromParams}`);
    } else if (callInputRef.current) {
      callId = callInputRef.current.value;
      setCallId(callInputRef.current.value);
      navigate(`${location.pathname}?id=${callInputRef.current.value}`);
    }
    const callDocHost = firestore.collection("calls").doc(callId);
    const lengthUsers = (await callDocHost.get()).data()?.connectedUsers;
    let indexOfOtherConnectedCandidates = callDocHost.collection("otherCandidates").doc(`indexOfConnectedCandidates`);

    const myIndex = lengthUsers + 1;
    setMyIndex(lengthUsers);
    await callDocHost.update({ connectedUsers: myIndex });

    indexOfOtherConnectedCandidates.update({
      indexOfCurrentUsers: firebase.firestore.FieldValue.arrayUnion(myIndex),
    });

    let pc: RTCPeerConnection;

    indexOfOtherConnectedCandidates.onSnapshot(async (doc) => {
      if (doc.exists) {
        //Check for any newly addded users
        if (
          doc.data()?.indexOfCurrentUsers[doc.data()?.indexOfCurrentUsers.length - 1] != myIndex &&
          doc.data()?.indexOfCurrentUsers[doc.data()?.indexOfCurrentUsers.length - 1] &&
          doc.data()?.indexOfCurrentUsers[doc.data()?.indexOfCurrentUsers.length - 1] > myIndex
        ) {
          setAfterCall((prev) => prev + 1);
          console.log("After Call:", afterCall);
          const newAddedUser = doc.data()?.indexOfCurrentUsers[doc.data()?.indexOfCurrentUsers.length - 1];
          let signalDoc = callDocHost.collection("signal").doc(`signal${newAddedUser}${myIndex}`);
          console.log(`${newAddedUser} added`);
          console.log(`${myIndex} myIndex`);
          await signalDoc.set({
            userAdded: `${newAddedUser} added`,
            signal: 0,
          });
          let offerAnswerPairs: firebase.firestore.DocumentReference<firebase.firestore.DocumentData>;
          let offerCandidatesCollection: firebase.firestore.CollectionReference<firebase.firestore.DocumentData>;
          let answerCandidatesCollection: firebase.firestore.CollectionReference<firebase.firestore.DocumentData>;
          let candidateNameDoc: firebase.firestore.DocumentReference<firebase.firestore.DocumentData>;
          signalDoc.onSnapshot(async (doc) => {
            if (doc.exists) {
              const data = doc.data();
              const signal = data?.signal;
              if (signal === 0) {
                pc = new RTCPeerConnection(servers);
                candidateNameDoc = callDocHost.collection("otherCandidates").doc(`candidate${newAddedUser}${myIndex}`);
                await localStream?.getTracks().forEach((track) => {
                  pc.addTrack(track, localStream as MediaStream);
                });

                let onTrackExecuted = false;

                pc.ontrack = async (event) => {
                  if (!onTrackExecuted) {
                    onTrackExecuted = true;
                    const remoteStream = new MediaStream();
                    await event.streams[0].getTracks().forEach((track) => {
                      remoteStream.addTrack(track);
                    });
                    console.log("Remote stream reflected");
                    await setRemoteStreams((prevStreams) => [...prevStreams, remoteStream]);
                    const candidateDocData = await candidateNameDoc.get();
                    if (candidateDocData.exists) {
                      const joinerName = candidateDocData?.data()?.joiner;
                      console.log(joinerName);
                      setNameList((prevNameList = []) => [...(prevNameList || []), joinerName]);
                    }
                  }
                };

                offerCandidatesCollection = callDocHost.collection("otherCandidates").doc(`candidate${newAddedUser}${myIndex}`).collection("offerCandidates");
                answerCandidatesCollection = callDocHost.collection("otherCandidates").doc(`candidate${newAddedUser}${myIndex}`).collection("answerCandidates");
                candidateNameDoc.set({ myName: myId, joiner: "" });
                pc.onicecandidate = async (event) => {
                  event.candidate && (await offerCandidatesCollection.add(event.candidate.toJSON()));
                };
                offerAnswerPairs = callDocHost.collection("otherCandidates").doc(`offerAnswerPairs${newAddedUser}${myIndex}`);

                pc.onicecandidate = async (event) => {
                  event.candidate && (await offerCandidatesCollection.add(event.candidate.toJSON()));
                };

                const offerDescription = await pc.createOffer();
                await pc.setLocalDescription(offerDescription);

                let offer = {
                  sdp: offerDescription.sdp as string,
                  type: offerDescription.type,
                };

                let offerAnswerPair: OfferAnswerPair = {
                  offer: offer,
                  answer: null,
                };

                const currentPairs: OfferAnswerPair[] = (await offerAnswerPairs.get()).data()?.offerAnswerPairs || [];

                await currentPairs.push(offerAnswerPair);
                console.log(currentPairs);
                await offerAnswerPairs.set({
                  offerAnswerPairs: currentPairs,
                });
                await signalDoc.set({ signal: 1 });
              } else if (signal == 2) {
                const answerDescription = new RTCSessionDescription((await offerAnswerPairs.get()).data()?.offerAnswerPairs[0].answer);
                console.log("Data on receiver is ", (await offerAnswerPairs.get()).data()?.offerAnswerPairs[0].answer);
                await pc.setRemoteDescription(answerDescription);

                await answerCandidatesCollection.onSnapshot(
                  async (snapshot) => {
                    await snapshot.docChanges().forEach(async (change) => {
                      if (change.type === "added") {
                        const candidateData = change.doc.data();
                        const candidate = new RTCIceCandidate(candidateData);
                        await pc
                          .addIceCandidate(candidate)
                          .then(() => {
                            console.log("Ice candidate added successfully");
                          })
                          .catch((error) => {
                            console.error("Error adding ice candidate:", error);
                          });
                      }
                    });
                  },
                  (error) => {
                    console.error("Error getting candidate collection:", error);
                  }
                );
                setPcs((prevPcs) => [...prevPcs, pc]);
                await signalDoc.update({ signal: 3 });
              }
            }
          });
        }
      } else {
        console.log("No such document!");
      }
    });
    const indexUsers = (await indexOfOtherConnectedCandidates.get()).data()?.indexOfCurrentUsers;
    await indexUsers.forEach(async (existingCaller: number) => {
      console.log(`User Index: ${existingCaller}`);
      let signalDoc = callDocHost.collection("signal").doc(`signal${myIndex}${existingCaller}`);
      let offerAnswerPairs: firebase.firestore.DocumentReference<firebase.firestore.DocumentData>;
      let offerCandidatesCollection = callDocHost.collection("otherCandidates").doc(`candidate${myIndex}${existingCaller}`).collection("offerCandidates");
      let candidateNameDoc = callDocHost.collection("otherCandidates").doc(`candidate${myIndex}${existingCaller}`);
      let pc: RTCPeerConnection;

      signalDoc.onSnapshot(async (doc) => {
        if (doc.exists) {
          const data = doc.data();
          const signal = data?.signal;

          if (signal === 1) {
            pc = new RTCPeerConnection(servers);
            offerAnswerPairs = callDocHost.collection("otherCandidates").doc(`offerAnswerPairs${myIndex}${existingCaller}`);
            console.log(`pair is ${myIndex}${existingCaller}`);
            candidateNameDoc.update({ joiner: "Moderator" });

            await localStream?.getTracks().forEach((track) => {
              pc.addTrack(track, localStream as MediaStream);
            });

            let onTrackExecuted = false;

            pc.ontrack = async (event) => {
              if (!onTrackExecuted) {
                setBeforeCall((prev) => prev + 1);
                onTrackExecuted = true;
                const remoteStream = new MediaStream();
                await event.streams[0].getTracks().forEach((track) => {
                  remoteStream.addTrack(track);
                });
                console.log("Remote stream reflected");
                await setRemoteStreams((prevStreams) => [...prevStreams, remoteStream]);
                const candidateDocData = await candidateNameDoc.get();
                if (candidateDocData.exists) {
                  const existingName = candidateDocData?.data()?.myName;
                  console.log(existingName);
                  setNameList((prevNameList = []) => [...(prevNameList || []), existingName]);
                }
              }
            };

            const answerCandidatesCollection = callDocHost
              .collection("otherCandidates")
              .doc(`candidate${myIndex}${existingCaller}`)
              .collection("answerCandidates");
            if (pc)
              pc.onicecandidate = async (event) => {
                event.candidate && (await answerCandidatesCollection.add(event.candidate.toJSON()));
              };

            const offerDescription = new RTCSessionDescription((await offerAnswerPairs.get()).data()?.offerAnswerPairs[0].offer);
            console.log("offer is ", (await offerAnswerPairs.get()).data()?.offerAnswerPairs);
            await pc.setRemoteDescription(offerDescription);

            const answerDescription = await pc.createAnswer();
            await pc.setLocalDescription(answerDescription);

            const answer = {
              sdp: answerDescription.sdp,
              type: answerDescription.type,
            };

            const currentPair = (await offerAnswerPairs.get()).data()?.offerAnswerPairs[0];
            console.log("Current pair is ", currentPair);
            currentPair.answer = answer;

            await offerAnswerPairs.update({
              offerAnswerPairs: [currentPair],
            });

            await signalDoc.update({ signal: 2 });
          } else if (signal === 3) {
            console.log("Before Call:", beforeCall);
            console.log("The remote description after setting it is ", pc);
            await offerCandidatesCollection.get().then(async (snapshot) => {
              await snapshot.docs.forEach(async (doc) => {
                const candidateData = doc.data();
                const candidate = new RTCIceCandidate(candidateData);
                await pc
                  .addIceCandidate(candidate)
                  .then(() => {
                    console.log("Ice candidate added successfully");
                  })
                  .catch((error) => {
                    console.error("Error adding ice candidate:", error);
                  });
              });
            });

            await offerCandidatesCollection.onSnapshot(
              async (snapshot) => {
                await snapshot.docChanges().forEach(async (change) => {
                  if (change.type === "added") {
                    const candidateData = change.doc.data();
                    const candidate = new RTCIceCandidate(candidateData);
                    await pc
                      .addIceCandidate(candidate)
                      .then(() => {
                        console.log("Ice candidate added successfully");
                      })
                      .catch((error) => {
                        console.error("Error adding ice candidate:", error);
                      });
                  }
                });
              },
              (error) => {
                console.error("Error listening for offerCandidates changes:", error);
              }
            );
            setPcs((prevPcs) => [...prevPcs, pc]);
            await signalDoc.update({ signal: 4 });
          }
        }
      });
    });

    if (answerButtonRef.current) answerButtonRef.current.disabled = true;
  };

  const hangup = async () => {
    console.log("The current pcs are: ", pcs);
    console.log(myIndex);
    const callDoc = firestore.collection("calls").doc(callId);
    let hangupDoc = callDoc.collection("hangup").doc(`hangups`);
    await hangupDoc.set({ hangup: myIndex });

    pcs.forEach((pc) => {
      pc.close();
    });
    setRemoteStreams([]);
    setRemoteVideoRefs([]);
    setPcs([]);
  };

  useEffect(() => {
    const callDoc = firestore.collection("calls").doc(callId);
    let hangupCollection = callDoc.collection("hangup");
    hangupCollection.onSnapshot(
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          console.log(change.doc.data().hangup);
          let hangedUpUser = change.doc.data().hangup;
          if (hangedUpUser > myIndex!) {
            setRemoteVideoRefs((prevRefs) => {
              const newRefs = [...prevRefs];
              newRefs[hangedUpUser - 1] = null;
              return newRefs;
            });
            setRemoteStreams((prevRefs) => {
              const newRefs = [...prevRefs];
              newRefs[hangedUpUser - 1] = null;
              return newRefs;
            });
          }
          if (hangedUpUser < myIndex!) {
            setRemoteVideoRefs((prevRefs) => {
              const newRefs = [...prevRefs];
              newRefs[hangedUpUser] = null;
              return newRefs;
            });
            setRemoteStreams((prevRefs) => {
              const newRefs = [...prevRefs];
              newRefs[hangedUpUser] = null;
              return newRefs;
            });
          }
        });
      },
      (error) => {
        console.error("Error listening for changes: ", error);
      }
    );
  }, [callId, myIndex]);

  const handleIceConnectionStateChange = useCallback(
    (pc: RTCPeerConnection, index: number) => {
      if (pc.connectionState === "disconnected") {
        console.log(`PC at index ${index} has connectionState as disconnected`);

        setRemoteVideoRefs((prevRefs) => {
          const newRefs = [...prevRefs];
          newRefs[index] = null;
          return newRefs;
        });

        setRemoteStreams((prevRefs) => {
          const newRefs = [...prevRefs];
          newRefs[index] = null;
          return newRefs;
        });

        setCallLeft((prev) => prev + 1);

        if (index <= beforeCall) {
          setBeforeCall((prev) => {
            const updatedBeforeCall = prev - 1;
            console.log("Updated beforeCall:", updatedBeforeCall);
            return updatedBeforeCall;
          });
        } else {
          setAfterCall((prev) => prev - 1);
        }

        console.log("Caller left, new callLeft:", callLeft + 1);
      }
    },
    [beforeCall, callLeft]
  );

  useEffect(() => {
    const listeners = new Map();

    pcs.forEach((pc, index) => {
      const listener = (event: Event) => {
        handleIceConnectionStateChange(event.currentTarget as RTCPeerConnection, index);
      };
      listeners.set(pc, listener);
      pc.addEventListener("connectionstatechange", listener);
    });

    return () => {
      listeners.forEach((listener, pc) => {
        pc.removeEventListener("connectionstatechange", listener);
      });
    };
  }, [pcs, handleIceConnectionStateChange]);

  useEffect(() => {
    const newRemoteVideoRefs = remoteStreams.map(() => React.createRef<HTMLVideoElement>());
    setRemoteVideoRefs(newRemoteVideoRefs as (React.RefObject<HTMLVideoElement> | null)[]);

    console.log(remoteStreams);
  }, [remoteStreams]);

  useEffect(() => {
    remoteVideoRefs.forEach(async (ref, index) => {
      if (ref?.current && remoteStreams[index]) {
        ref.current.srcObject = remoteStreams[index];
      }
    });
  }, [remoteVideoRefs, remoteStreams]);

  const hasEffectRun = useRef(false);

  useEffect(() => {
    const initWebcam = async () => {
      const startWebcam = async () => {
        try {
          localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          await setStream(localStream);
          if (webcamVideoRef.current && localStream) {
            webcamVideoRef.current.srcObject = localStream;
          }
        } catch (error) {
          console.error("Error accessing webcam:", error);
        }
        if (callButtonRef.current) callButtonRef.current.disabled = false;
        if (answerButtonRef.current) answerButtonRef.current.disabled = false;
        if (webcamButtonRef.current) webcamButtonRef.current.disabled = true;
      };
      if (!hasEffectRun.current) {
        hasEffectRun.current = true;
        startWebcam();
        const searchParams = new URLSearchParams(location.search);
        const id = searchParams.get("id");
        if (id) {
          setCallId(id);
          if (callInputRef.current) {
            callInputRef.current.value = id;
          }
          handleAnswerButtonClick();
        } else {
          handleCallButtonClick();
        }

        setIsClient(true); // Indicate that the client is set up
      }
    };

    initWebcam(); // Run the initialization
  }, []);

  // Additional useEffect to ensure the webcam stream is correctly assigned

  const startProcess = async () =>{
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/audios/process/:${callId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send signal");
      }

      const data = await response.json();
      console.log("Form data send signal:", data);
    } catch (error) {
      console.error("Error sending signal:", error);
    }
  }

  const copyLink = () => {
    const currentUrl = new URL(window.location.href);
    if (currentUrl.pathname === "/transcript") {
      currentUrl.pathname = "/meet";
    }

    navigator.clipboard
      .writeText(currentUrl.toString())
      .then(() => {
        toast.success("Link copied");
      })
      .catch((error) => {
        console.error("Failed to copy link: ", error);
      });
  };

  const handleMicToggle = async () => {
    setMicEnabled(!micEnabled);
    console.log(stream);
    if (stream) {
      const audioTrack = stream.getTracks().find((track) => track.kind === "audio");
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
    if (localStream) {
      console.log("Local stream is ", localStream);
      const audioTrack = localStream.getTracks().find((track) => track.kind === "audio");
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  };


  const toggleMicFromComponent = (active: boolean) => {
    if (micEnabled && !active) {
      setMicEnabled(!micEnabled);
      console.log(stream);
      if (stream) {
        const audioTrack = stream.getTracks().find((track) => track.kind === "audio");
        if (audioTrack) {
          audioTrack.enabled = !audioTrack.enabled;
        }
      }
      if (localStream) {
        console.log("Local stream is ", localStream);
        const audioTrack = localStream.getTracks().find((track) => track.kind === "audio");
        if (audioTrack) {
          audioTrack.enabled = !audioTrack.enabled;
        }
      }
    }
    if (!micEnabled && active) {
      console.log("Mic setting to active");
      setMicEnabled(!micEnabled);
      console.log(stream);
      if (stream) {
        const audioTrack = stream.getTracks().find((track) => track.kind === "audio");
        if (audioTrack) {
          audioTrack.enabled = !audioTrack.enabled;
        }
      }
      if (localStream) {
        console.log("Local stream is ", localStream);
        const audioTrack = localStream.getTracks().find((track) => track.kind === "audio");
        if (audioTrack) {
          audioTrack.enabled = !audioTrack.enabled;
        }
      }
    }
  };

  const handleVideoToggle = async () => {
    setVideoEnabled(!videoEnabled);
    if (!videoEnabled) {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (webcamVideoRef.current) {
          webcamVideoRef.current.srcObject = newStream;
        }
        await stream?.removeTrack(stream.getVideoTracks()[0]);
        await stream?.addTrack(newStream.getVideoTracks()[0]);
        pcs.forEach((pc) => {
          const sender = pc.getSenders().find((sender) => sender.track?.kind === "video");
          sender!.replaceTrack(newStream.getVideoTracks()[0]!);
        });
        console.log("Stream tracks after enabling is ", stream?.getVideoTracks());
      } catch (error) {
        console.error("Error re-enabling video:", error);
      }
    } else {
      if (stream) {
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.stop();
        }
        console.log("Stream tracks after disabling is ", stream?.getVideoTracks());

        // Create a new MediaStream with a "camera disabled" image
        const canvas = document.createElement("canvas");
        canvas.width = 640; // Set canvas width
        canvas.height = 480; // Set canvas height
        const context = canvas.getContext("2d");
        const image = new Image();
        image.src = "/camera_disabled.png"; // Path to the "camera disabled" image
        image.onload = () => {
          context!.drawImage(image, 0, 0, canvas.width, canvas.height);
          const stream = canvas.captureStream();
          if (webcamVideoRef.current) {
            webcamVideoRef.current.srcObject = stream;
          }

          pcs.forEach((pc) => {
            const sender = pc.getSenders().find((sender) => sender.track?.kind === "video");
            sender?.replaceTrack(stream.getVideoTracks()[0]);
          });

          console.log("Replaced video feed with camera disabled image.");
        };
      }
    }
  };

  useEffect(() => {
    console.log("PCs are ", pcs);
    console.log("Names are ", nameList);
  }, [pcs, nameList]);

  return (
    <div className="mx-auto p-5 w-full text-black bg-gradient-to-b from-indigo-600/10 to-transparent">
      <h2 className="text-2xl font-semibold my-4 text-white">Meet - {callId}</h2>
      <div className="flex mx-auto sticky gap-4 bg-zinc-900 border border-gray-800 w-fit p-2 px-5 rounded-xl max-md:flex-col">
        <div className="flex mx-auto justify-center gap-2">
          {/* Mic Toggle */}
          <button onClick={handleMicToggle} className={`p-3 rounded-full ${micEnabled ? "bg-green-500" : "bg-red-500"} text-white`}>
            {micEnabled ? <FaMicrophone size={15} /> : <FaMicrophoneAltSlash size={15} />}
          </button>

          {/* Video Toggle */}
          <button onClick={handleVideoToggle} className={`p-3 rounded-full ${videoEnabled ? "bg-green-500" : "bg-red-500"} text-white`}>
            {videoEnabled ? <FaVideo size={15} /> : <FaVideoSlash size={15} />}
          </button>

          <button
            disabled={!inCall}
            onClick={copyLink}
            className="p-3 rounded-full disabled:cursor-not-allowed px-2 py-1 disabled:bg-green-400 bg-green-500 text-white"
          >
            <div className={`${inCall ? "" : "cursor-not-allowed"} px-2 py-1 text-white rounded-md`} title="Copy Link">
              <FaCopy size={15} />
            </div>
          </button>
          <button
            disabled={!inCall}
            // onClick={takeScreenshot}
            className="p-3 rounded-full disabled:cursor-not-allowed px-2 py-1 disabled:bg-green-400 bg-green-500 text-white"
          >
            <div className={`${inCall ? "" : "cursor-not-allowed"} px-2 py-1 text-white rounded-md `} title="Take Screenshot">
              <FaCamera size={15} />
            </div>
          </button>

          {/* Hangup */}
          <button
            ref={hangupButtonRef}
            disabled={!inCall}
            onClick={hangup}
            className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaPhoneSlash size={15} />
          </button>
        </div>
        <RealTimeTranscript roomId={callId!} userId={myId} manager={true} />
        <button onClick={startProcess} className="rounded-xl bg-blue-600 p-2">
          Start Processing Audio 
        </button>
      </div>

      <div className={`flex mx-auto my-5 justify-center w-full gap-2 flex-wrap`}>
        <div
          className={`pt-2 rounded-lg shadow-md max-w-[33%] min-w-[500px] max-sm:w-full max-sm:min-w-[300px] max-md:min-w-[450px] border-gray-800 border text-blue-400`}
        >
          <h3 className="text-xl font-medium mb-2 mx-auto w-full text-center">You</h3>
          {isClient && (
            <video
              id="webcamVideo"
              ref={webcamVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-[500px] aspect-video mx-auto rounded-b-md bg-[#202124]`}
            ></video>
          )}
          {!isClient && <div className="max-sm:w-[90%] max-lg:w-full w-[500px] aspect-video mx-auto rounded-md bg-[#202124] "></div>}
        </div>

        {remoteVideoRefs.map((_, index) => (
          <div
            key={index}
            className={`pt-2 rounded-lg shadow-md max-w-[33%] min-w-[500px] max-sm:w-full max-sm:min-w-[300px] max-md:min-w-[450px] border-gray-800 border text-blue-400 ${
              remoteStreams[index] ? "" : "hidden"
            }`}
          >
            {nameList && nameList[index] ? (
              <h3 className="text-xl font-medium mb-2 mx-auto w-full text-center">{nameList[index]}</h3>
            ) : (
              <h3 className="text-xl font-medium mb-2">Remote Stream</h3>
            )}
            {isClient && <video ref={remoteVideoRefs[index]} autoPlay playsInline className="w-[500px] aspect-video mx-auto rounded-b-md bg-[#202124]"></video>}
            {!isClient && <div className="max-sm:w-[90%] max-lg:w-full w-[500px] aspect-video mx-auto rounded-md bg-[#202124] "></div>}
          </div>
        ))}
      </div>
      <div
        className={`pt-2 rounded-lg shadow-md max-w-[33%] min-w-[500px] max-sm:w-full max-sm:min-w-[300px] max-md:min-w-[450px] border-gray-800 border text-blue-400 mx-auto`}
      >
        <h3 className="text-xl font-medium mb-2 mx-auto w-full text-center">Your AI Assistant</h3>
        <TalkingAvatar toggleMicFromComponent={toggleMicFromComponent} />
      </div>
    </div>
  );
};

export default Moderator;
