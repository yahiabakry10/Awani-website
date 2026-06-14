export interface Product {
  readonly id: number;
  readonly name: string;
  readonly category: string;
  readonly price: number;
  readonly image: string;
  readonly description?: string;
  readonly dimensions?: string;
  readonly usage?: string;
  readonly gallery?: string[];
}

export interface CartItem {
  readonly product: Product;
  readonly quantity: number;
}