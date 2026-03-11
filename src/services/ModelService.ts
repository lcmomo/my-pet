export class ModelService {
  static base =
    "https://raw.githubusercontent.com/iCharlesZ/vscode-live2d-models/master/model-library/";

  /** 200+ 模型名称列表 */
  static models: Record<string, string> = {
    'bilibili-22': 'https://raw.githubusercontent.com/iCharlesZ/vscode-live2d-models/master/model-library/bilibili-22/index.json',
    'epsilon': 'https://raw.githubusercontent.com/iCharlesZ/vscode-live2d-models/master/model-library/epsilon/epsilon.model.json',
    'haru02': 'https://raw.githubusercontent.com/iCharlesZ/vscode-live2d-models/master/model-library/haru02/haru02.model.json',
    'shizuku-48': 'https://raw.githubusercontent.com/iCharlesZ/vscode-live2d-models/master/model-library/shizuku-48/index.json'
  }

  static getModelNames(): string[] {
    return Object.keys(this.models) || [];
  }

  static getAllModels(): Record<string, string> {
    return this.models;
  }

  static getUrl(name: string): string {
    return this.models[name] || this.getRandom();
  }

  static getRandom(): string {
    const keys = Object.keys(this.models);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return this.models[randomKey];
  }

  static getByName(name: string): string {
    const foundKey = Object.keys(this.models).find(
      (key) => key.toLowerCase() === name.toLowerCase()
    );
    return foundKey ? this.models[foundKey] : this.getRandom();
  }
}
