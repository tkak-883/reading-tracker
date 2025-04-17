declare module 'svix' {
    export class Webhook {
      constructor(secret: string);
      verify(payload: string, headers: Record<string, string>): any;
    }
  }