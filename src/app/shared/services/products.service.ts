import {Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient, HttpParams} from '@angular/common/http';
import {BehaviorSubject, Observable} from 'rxjs';
import {Product, ProductUpdateTO} from '../models/product.model';
import {ProductPage} from '../models/pagination-model/product-page.model';
import {ProductDetails, ProductDetailUpdateTO, Stock} from '../models/product-details.model';
import {UpdateStock} from '../models/update-stock.model';
import {ProductDetailsPage} from '../models/pagination-model/product-details-page.model';
import {Gender} from '../enums/gender';
import {Order} from '../enums/order.enum';
import {DetailsFiltersRequest} from '../../store/models/details-filters-request';
import {ProductDetailsTOPage} from '../models/pagination-model/product-details-to-page.model';
import {ProductDetailsTO} from '../models/product-details-to.model';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  api: string = environment.NZESPORTES_API + 'products/';
  // tslint:disable-next-line:variable-name
  private _detailsFiltersState = new BehaviorSubject<DetailsFiltersRequest>({
    name: '',
    gender: '',
    category: '',
    size: '',
    color: '',
    brand: '',
    classBy: '',
    subCategory: ''
  });

  constructor(
    private http: HttpClient
  ) {
  }

  create(product: Product): Observable<Product> {
    const params = new HttpParams()
      .set('async', 'true');
    return this.http.post<Product>(this.api, product, {params});
  }

  update(productUpdateTO: ProductUpdateTO): Observable<ProductUpdateTO> {
    const params = new HttpParams()
      .set('async', 'true');
    return this.http.put<ProductUpdateTO>(this.api, productUpdateTO, {params});
  }

  updateProductDetails(productDetailTO: ProductDetailUpdateTO): Observable<ProductDetailUpdateTO> {
    const params = new HttpParams()
      .set('async', 'true');
    return this.http.put<ProductDetailUpdateTO>(this.api + 'details', productDetailTO, {params});
  }

  saveProductDetails(productDetailTO: ProductDetails): Observable<ProductDetails> {
    const params = new HttpParams()
      .set('async', 'true');
    return this.http.post<ProductDetails>(this.api + 'details', productDetailTO, {params});
  }

  getAll(size: number, page: number, category?: string, status?: string, name?: string): Observable<ProductPage> {
    const urlCategory = category ? '&category=' + category : '';
    const urlStatus = status ? '&status=' + status : '';
    const urlName = name ? '&name=' + name : '';
    return this.http.get<ProductPage>(
      this.api + '?async=true&page=' + page.toString() + '&size=' + size.toString()
      + urlCategory + urlStatus + urlName);
  }

  getByCategoryId(idCategory: string, size: number, page: number): Observable<ProductPage> {
    const params = new HttpParams()
      .set('async', 'true')
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<ProductPage>(this.api + 'category/' + idCategory, {params});
  }

  getById(id: string): Observable<Product> {
    const params = new HttpParams()
      .set('async', 'true');
    return this.http.get<Product>(this.api + id, {params});
  }

  delete(id: string): Observable<Product> {
    const params = new HttpParams()
      .set('async', 'true');
    return this.http.delete<Product>(this.api + id, {params});
  }

  getByPurchaseId(purchaseId: string): Observable<ProductDetailsTO[]> {
    return this.http.get<ProductDetailsTO[]>(`${this.api}details/purchase/${purchaseId}`);
  }

  getDetailById(uuid: string): Observable<ProductDetails> {
    const params = new HttpParams()
      .set('async', 'true');
    return this.http.get<ProductDetails>(`${this.api}details/${uuid}`, {params});
  }

  updateCategories(idCategory: string, idProduct: string): Observable<Product> {
    const params = new HttpParams()
      .set('async', 'true');
    return this.http.put<Product>(this.api + idProduct + '/category/' + idCategory, {params});
  }

  updateStock(updateStock: UpdateStock): Observable<Stock> {
    const params = new HttpParams()
      .set('async', 'true');
    return this.http.put<Stock>(this.api + 'details/stock', updateStock, {params});
  }

  getAllDetails(
    size: number,
    page: number,
    name?: string,
    gender?: Gender,
    category?: string,
    productSize?: string, color?: string, brand?: string, order?: Order,  subcategory?: string): Observable<ProductDetailsTOPage> {
    const urlGender = gender ? '&gender=' + gender.toString() : '';
    const urlCategory = category ? '&category=' + category : '';
    const urlSubCategory = subcategory ? '&subcategory=' + subcategory : '';
    const urlProductSize = productSize ? '&productSize=' + productSize : '';
    const urlColor = color ? '&color=' + color : '';
    const urlBrand = brand ? '&brand=' + brand : '';
    const urlOrder = order ? '&order=' + order.toString() : '';
    const urlName = name ? '&name=' + name : '';

    const url = `page=${page.toString()}&size=${size.toString() +
    urlName + urlGender + urlCategory + urlProductSize + urlColor + urlBrand + urlOrder + urlSubCategory}`;

    return this.http.get<ProductDetailsTOPage>(`${this.api}details?${url}`);
  }

  setDetailsFiltersState(
    name?: string,
    gender?: string,
    category?: string, size?: string, color?: string, brand?: string, classBy?: string, subCategory?: string): void {
    const filter: DetailsFiltersRequest = this._detailsFiltersState.getValue();
    filter.name = name ? name : '';
    filter.gender = gender ? gender : '';
    filter.category = category ? category : '';
    filter.size = size ? size : '';
    filter.color = color ? color : '';
    filter.brand = brand ? brand : '';
    filter.classBy = classBy ? classBy : '';
    filter.subCategory = subCategory ? subCategory : '';
    this._detailsFiltersState.next(filter);
  }

  get detailsFiltersState(): DetailsFiltersRequest {
    return this._detailsFiltersState.getValue();
  }

  get detailsFiltersState$(): Observable<DetailsFiltersRequest> {
    return this._detailsFiltersState;
  }
}
