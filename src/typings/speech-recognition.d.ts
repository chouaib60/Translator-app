// Simple declarations to allow using the Cordova speech recognition plugin without TS errors
interface SpeechRecognitionPlugin {
  hasPermission: (success: (granted: boolean) => void, fail?: (err: any) => void) => void;
  requestPermission?: (success?: () => void, fail?: (err: any) => void) => void;
  startListening?: (onResult: (matches: string[]) => void, onError?: (err: any) => void, options?: any) => void;
  stopListening?: () => void;
}

interface Window {
  plugins?: {
    speechRecognition?: SpeechRecognitionPlugin;
  };
  SpeechRecognition?: any;
}

declare var SpeechRecognition: any;
export {};
