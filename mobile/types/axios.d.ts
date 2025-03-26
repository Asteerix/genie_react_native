// Declaration file to extend Axios types with our custom properties
import 'axios';

declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: number;
      [key: string]: any;
    };
  }
}