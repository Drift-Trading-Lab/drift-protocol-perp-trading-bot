export class PriceSeries {
  private readonly values: number[] = [];
  constructor(private readonly max: number) {}
  push(v: number): void {
    this.values.push(v);
    if (this.values.length > this.max) this.values.shift();
  }
  closes(): number[] { return [...this.values]; }
  zScore(): number {
    if (this.values.length < 3) return 0;
    const mean = this.values.reduce((s, x) => s + x, 0) / this.values.length;
    const sd = Math.sqrt(this.values.reduce((s, x) => s + (x - mean) ** 2, 0) / this.values.length) || 1e-9;
    return (this.values[this.values.length - 1]! - mean) / sd;
  }
}
