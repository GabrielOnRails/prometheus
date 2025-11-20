/**
 * Interface base para transporters de microservices
 */
export interface Transporter {
  listen(callback: (data: any) => Promise<any>): Promise<void>;
  send(pattern: string | object, data: any): Promise<any>;
  emit(pattern: string | object, data: any): Promise<void>;
  close(): Promise<void>;
}

export interface TransporterOptions {
  host?: string;
  port?: number;
  [key: string]: any;
}
