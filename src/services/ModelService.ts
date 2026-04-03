export class ModelService {
  static base =
    "http://localhost:3200/model-library";

  /** 200+ 模型名称列表 */
  static models: Record<string, string> = {
    'bilibili-22': `${ModelService.base}/bilibili-22/index.json`,
    'bilibili-33': `${ModelService.base}/bilibili-33/index.json`,
    'chiaki_kitty': `${ModelService.base}/chiaki_kitty/chiaki_kitty.model.json`,
    'chitose': `${ModelService.base}/chitose/chitose.model.json`,
    'date_16': `${ModelService.base}/date_16/date_16.model.json`,
    'hallo_16': `${ModelService.base}/hallo_16/hallo_16.model.json`,
    'haru01': `${ModelService.base}/haru01/haru01.model.json`,
    'haru02': `${ModelService.base}/haru02/haru02.model.json`,
    'haruto': `${ModelService.base}/haruto/haruto.model.json`,
    'hibiki': `${ModelService.base}/hibiki/hibiki.model.json`,
    'hijiki': `${ModelService.base}/hijiki/hijiki.model.json`,
    'index': `${ModelService.base}/index/index.model.json`,
    'izumi': `${ModelService.base}/izumi/izumi.model.json`,
    'jin': `${ModelService.base}/jin/jin.model.json`,
    'kanzaki': `${ModelService.base}/kanzaki/kanzaki.model.json`,
    'kesshouban': `${ModelService.base}/kesshouban/model.json`,
    'koharu': `${ModelService.base}/koharu/koharu.model.json` ,
    'kuroko': `${ModelService.base}/kuroko/kuroko.model.json`,
    'len': `${ModelService.base}/len/len.model.json`,
    'len_impact': `${ModelService.base}/len_impact/len_impact.model.json`,
    'len_space': `${ModelService.base}/len_space/len_space.model.json`,
    'len_swim': `${ModelService.base}/len_swim/len_swim.model.json`,
    'mikoto': `${ModelService.base}/mikoto/mikoto.model.json`,
    'miku': `${ModelService.base}/miku/miku.model.json`,
    'murakumo': `${ModelService.base}/murakumo/index.json`,
    'ni-j': `${ModelService.base}/ni-j/ni-j.model.json`,
    'nico': `${ModelService.base}/nico/nico.model.json`,
    'nietzsche': `${ModelService.base}/nietzsche/nietzsche.model.json`,
    'nipsilon': `${ModelService.base}/nipsilon/nipsilon.model.json`,
    'nito': `${ModelService.base}/nito/nito.model.json`,
    'potion-Maker-Pio': `${ModelService.base}/potion-Maker-Pio/index.json`,
    'potion-Maker-Tia': `${ModelService.base}/potion-Maker-Tia/index.json`,
    'ryoufuku': `${ModelService.base}/ryoufuku/ryoufuku.model.json`,
    'saten': `${ModelService.base}/saten/saten.model.json`,
    'seifuku': `${ModelService.base}/seifuku/seifuku.model.json`,
    'shifuku': `${ModelService.base}/shifuku/shifuku.model.json`,
    'shifuku2': `${ModelService.base}/shifuku2/shifuku2.model.json`,
    'shizuku-48': `${ModelService.base}/shizuku-48/index.json`,
    'shizuku-pajama': `${ModelService.base}/shizuku-pajama/index.json`,
    'stl': `${ModelService.base}/stl/stl.model.json`,
    'tororo': `${ModelService.base}/tororo/tororo.model.json`,
    'touma': `${ModelService.base}/touma/touma.model.json`,
    'tsumiki': `${ModelService.base}/tsumiki/tsumiki.model.json`,
    'uiharu': `${ModelService.base}/uiharu/uiharu.model.json`,
    'unitychan': `${ModelService.base}/unitychan/unitychan.model.json`,
    'wanko': `${ModelService.base}/wanko/wanko.model.json`,
    'wed_16': `${ModelService.base}/wed_16/wed_16.model.json`,
    'z16': `${ModelService.base}/z16/z16.model.json`,
    // Girls Frontline
    'HK416-1-normal': `${ModelService.base}/girls-frontline/HK416-1/normal/model.json`,
    'HK416-1-destroy': `${ModelService.base}/girls-frontline/HK416-1/destroy/model.json`,
    'HK416-2-normal': `${ModelService.base}/girls-frontline/HK416-2/normal/model.json`,
    'HK416-2-destroy': `${ModelService.base}/girls-frontline/HK416-2/destroy/model.json`,
    'UMP45-1-normal': `${ModelService.base}/girls-frontline/UMP45-1/normal/model.json`,
    'UMP45-1-destroy': `${ModelService.base}/girls-frontline/UMP45-1/destroy/model.json`,
    'UMP45-2-normal': `${ModelService.base}/girls-frontline/UMP45-2/normal/model.json`,
    'UMP45-2-destroy': `${ModelService.base}/girls-frontline/UMP45-2/destroy/model.json`,
    'UMP45-3-normal': `${ModelService.base}/girls-frontline/UMP45-3/normal/model.json`,
    'UMP45-3-destroy': `${ModelService.base}/girls-frontline/UMP45-3/destroy/model.json`,
    'M4A1-1-normal': `${ModelService.base}/girls-frontline/M4A1-1/normal/model.json`,
    'M4A1-1-destroy': `${ModelService.base}/girls-frontline/M4A1-1/destroy/model.json`,
    'M4A1-2-normal': `${ModelService.base}/girls-frontline/M4A1-2/normal/model.json`,
    'M4A1-2-destroy': `${ModelService.base}/girls-frontline/M4A1-2/destroy/model.json`,
    'M4-SOPMOD-II-1-normal': `${ModelService.base}/girls-frontline/M4-SOPMOD-II-1/normal/model.json`,
    'M4-SOPMOD-II-1-destroy': `${ModelService.base}/girls-frontline/M4-SOPMOD-II-1/destroy/model.json`,
    'M4-SOPMOD-II-2-normal': `${ModelService.base}/girls-frontline/M4-SOPMOD-II-2/normal/model.json`,
    'M4-SOPMOD-II-2-destroy': `${ModelService.base}/girls-frontline/M4-SOPMOD-II-2/destroy/model.json`,
    'WA2000-1-normal': `${ModelService.base}/girls-frontline/WA2000-1/normal/model.json`,
    'WA2000-1-destroy': `${ModelService.base}/girls-frontline/WA2000-1/destroy/model.json`,
    'WA2000-2-normal': `${ModelService.base}/girls-frontline/WA2000-2/normal/model.json`,
    'WA2000-2-destroy': `${ModelService.base}/girls-frontline/WA2000-2/destroy/model.json`,
    'WA2000-3-normal': `${ModelService.base}/girls-frontline/WA2000-3/normal/model.json`,
    'WA2000-3-destroy': `${ModelService.base}/girls-frontline/WA2000-3/destroy/model.json`,
    'Kar98k-normal': `${ModelService.base}/girls-frontline/Kar98k/normal/model.json`,
    'G11-normal': `${ModelService.base}/girls-frontline/G11/normal/model.json`,
    'G11-destroy': `${ModelService.base}/girls-frontline/G11/destroy/model.json`,
    'UMP9-normal': `${ModelService.base}/girls-frontline/UMP9/normal/model.json`,
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
