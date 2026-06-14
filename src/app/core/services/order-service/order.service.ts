import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

/**
 * Data Transfer Object (DTO) for order placement.
 * Defines the strict structure required by the backend script.
 */
export interface OrderData {
  name: string;
  email: string;
  phone: string;
  address: string;
  location?: string;
  paymentMethod: string;
  total: number;
  items: string;
  screenshot?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly http = inject(HttpClient);
  
  /**
   * BACKEND INTEGRATION:
   * This endpoint points to a Google Apps Script Web App. 
   * It acts as a serverless function that appends order data to a Google Sheet.
   */
  private readonly GOOGLE_SCRIPT_URL =
    'https://script.google.com/macros/s/AKfycbxtekaFhqtUpwBpW5hucTO0FwduSnAGMJqSwGfklPOlJ5OeqgvLQMI5gG6lDmhUtuzP/exec';

  /**
   * Dispatches the order data to the external processing script.
   * 
   * Note on Implementation: We use 'JSON.stringify' and 'responseType: text'
   * to accommodate the specific CORS and redirect behavior of Google Apps Script.
   */
  placeOrder(order: OrderData): Observable<string> {
    return this.http.post(this.GOOGLE_SCRIPT_URL, JSON.stringify(order), {
      responseType: 'text',
    });
  }
}
