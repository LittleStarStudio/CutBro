export {};

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?:   (result: unknown) => void;
          onClose?:   () => void;
        }
      ) => void;
      embed: (
        token: string,
        options: {
          embedId: string;
          onSuccess?: (result: unknown) => void;
          onError?:   (result: unknown) => void;
          onClose?:   () => void;
        }
      ) => void;
    };
  }
}
