import slugify from 'slugify';

export class SlugifyUtil {
  static generate(text: string): string {
    return slugify(text, {
      lower: true,
      strict: true,
      locale: 'vi',
      remove: /[*+~.()'"!:@]/g,
    });
  }

  static generateUnique(text: string, suffix?: string): string {
    const baseSlug = this.generate(text);
    if (suffix) {
      return `${baseSlug}-${suffix}`;
    }
    return `${baseSlug}-${Date.now()}`;
  }
}
