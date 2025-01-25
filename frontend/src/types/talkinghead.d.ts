declare module 'talkinghead' {
    export class TalkingHead {
      constructor(element: HTMLElement, config: {
        ttsEndpoint: string;
        ttsApikey: string;
        lipsyncModules: string[];
        cameraView: string;
      });
  
      showAvatar(config: {
        url: string;
        body: string;
        avatarMood: string;
        ttsLang: string;
        ttsVoice: string;
        lipsyncLang: string;
      }, progressCallback?: (ev: ProgressEvent) => void): Promise<void>;
      
      speakText(text: string): void;
      start(): void;
      stop(): void;
    }
  }