export interface IElectronAPI {
  executePHP(code: string): Promise<string>;
}
