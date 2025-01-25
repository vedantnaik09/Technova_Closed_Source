// src/modules/talkinghead.d.ts

declare module '../modules/talkinghead.mjs' {
    export class TalkingHead {
      constructor(
        element: HTMLElement,
        options: {
          ttsEndpoint: string;
          ttsApikey: string;
          lipsyncModules: string[];
          cameraView: string;
        }
      );
      
      showAvatar(
        config: {
          url: string;
          body: string;
          avatarMood: string;
          ttsLang: string;
          ttsVoice: string;
          lipsyncLang: string;
        },
        onProgress?: (event: ProgressEvent) => void
      ): Promise<void>;
  
      speakText(text: string): void;
    }
  }