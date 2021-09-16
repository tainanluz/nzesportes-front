import {Component, OnInit, ViewChild} from '@angular/core';
import {OwlOptions} from 'ngx-owl-carousel-o';
import {CartService} from '../../services/cart.service';
import {Store} from '@ngrx/store';
import {ProductsService} from '../../../shared/services/products.service';
import {Observable} from 'rxjs';
import {ActivatedRoute, Params} from '@angular/router';
import {Product} from '../../../shared/models/product.model';
import {ProductDetails, Stock} from '../../../shared/models/product-details.model';
import {take} from 'rxjs/operators';
import * as fromStore from '../../redux/cart/cart.reducer';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {Shipping} from '../../../shared/models/shipping.model';
import {BetterSendService} from '../../../shared/services/better-send.service';
import {ShippingResult} from '../../../shared/models/shipping-result.model';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';

export interface ImageSlide {
  id: number;
  fullImage: string;
  thumb: string;
  fullImageSafe: SafeResourceUrl;
  thumbSafe: SafeResourceUrl;
}

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit {

  private id = '';

  // @ts-ignore
  productDetails: ProductDetails;
  // @ts-ignore
  product: Product;

  images: string[] | undefined;

  @ViewChild('stock')
  public readonly selectedStock!: any;

  sizeMax = 1;
  startValue = 1;

  avaliacao = 3.8;
  positionImage = 0;

  shippingResult: ShippingResult[] = [];
  notShipResult = false;
  errorShipResult = false;

  dynamicSlides: ImageSlide[] = [];

  customOptions: OwlOptions = {
    loop: true,
    margin: 0,
    autoplay: false,
    autoplaySpeed: 700,
    mouseDrag: true,
    touchDrag: true,
    pullDrag: false,
    dots: false,
    navSpeed: 700,
    navText: ['<i class="fas fa-chevron-left"></i>', '<i class="fas fa-chevron-right"></i>'],
    responsive: {
      0: {
        items: 3
      },
      400: {
        items: 3
      },
      740: {
        items: 3
      },
      940: {
        items: 3
      }
    },
    nav: true
  };

  public formStock: FormGroup = new FormGroup({});
  public formShipping: FormGroup = new FormGroup({});

  noStock = false;

  constructor(
    private cartService: CartService,
    private productsService: ProductsService,
    private activatedRoute: ActivatedRoute,
    private store: Store<fromStore.ProductState>,
    private formBuilder: FormBuilder,
    private betterSendService: BetterSendService,
    private sanitizer: DomSanitizer
  ) {
  }

  ngOnInit(): void {
    this.createForm();
    const params: Observable<Params> = this.activatedRoute.params;
    params.subscribe(urlParams => {
      this.id = urlParams.url;
      if (this.id) {
        this.productsService.getDetailById(this.id)
          .subscribe(response => {
              this.productDetails = response;
              this.setImages();
              const productJson = localStorage.getItem('product');
              if (productJson) {
                this.product = JSON.parse(productJson);
              } else {
                this.productsService.getById(this.productDetails.productId)
                  .pipe(take(1))
                  .subscribe(p => {
                    this.product = p;
                  }, error => console.log(error));
              }
            },
            error => {
              console.log(error);
            });
      }
    });
  }

  setImages(): void {
    this.dynamicSlides = [];
    this.productDetails.images.split(';').forEach((image, i) => {
      this.dynamicSlides.push({
        id: i,
        fullImage: image,
        thumb: image,
        fullImageSafe: this.sanitizer.bypassSecurityTrustResourceUrl(image),
        thumbSafe: this.sanitizer.bypassSecurityTrustResourceUrl(image)
      });
    });
  }

  private createForm(): void {
    this.formStock = this.formBuilder.group({
      stocksize: new FormControl(null, Validators.required),
    });

    this.formShipping = this.formBuilder.group({
      shipping: new FormControl(null, Validators.compose([
        Validators.required,
        Validators.pattern('^[0-9]{8}$')
      ])),
    });
  }

  get validateFields(): any {
    return this.formStock.controls;
  }

  cssError(field: any): any {
    return {
      'is-invalid': field.invalid && field.touched
    };
  }

  changeImage(index: number): void {
    this.positionImage = index;
  }

  changeMax(index: number): void {
    this.sizeMax = this.productDetails.stock[index].quantity;
    this.startValue = 1;
  }

  addToCart(productDetail: ProductDetails, stockIndex: number): void {
    if (this.formStock.valid) {
      const stockCart = this.productDetails.stock[stockIndex];
      const cartItem = this.cartService.getProductsCart().find(item => item.id === stockCart.id);
      if (cartItem) {
        const sumQuantity = cartItem.quantity + 1;
        if (sumQuantity > stockCart.quantity) {
          this.noStock = true;
        } else {
          this.noStock = false;
          this.sendToCart(productDetail, stockCart);
        }
      } else {
        this.sendToCart(productDetail, stockCart);
      }
    } else {
      this.verifyValidation(this.formStock);
    }

  }

  verifyValidation(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((item, i) => {
      const controle = formGroup.get(item);
      // @ts-ignore
      controle.markAllAsTouched();
      if (controle instanceof FormGroup) {
        this.verifyValidation(controle);
      }
    });
  }

  sendToCart(productDetail: ProductDetails, stockCart: Stock): void {
    const itemCart = {
      id: stockCart.id,
      productDetails: productDetail,
      productId: this.product.id,
      model: this.product.model,
      quantity: this.startValue,
      stock: stockCart,
      total: productDetail.price * this.startValue
    };
    this.cartService.addToCart(itemCart);
  }

  calculateShipping(): void {
    if (this.formShipping.valid) {
      // @ts-ignore
      const cep = this.formShipping.get('shipping').value;
      const shipping: Shipping = {
        from: {
          postal_code: '02078030'
        },
        to: {
          postal_code: cep
        },
        products: [
          {
            id: this.product.id,
            width: 11,
            height: 17,
            length: 11,
            weight: 0.3,
            insurance_value: 10.1,
            quantity: 1
          }
        ]
      };
      this.betterSendService.calculateShipping(shipping)
        .pipe(take(1))
        .subscribe(r => {
          console.log(r);
          this.shippingResult = r.filter(ship => !ship.error);
          if (this.shippingResult.length === 0) {
            this.notShipResult = true;
          } else {
            this.notShipResult = false;
          }
          this.errorShipResult = false;
        }, () => {
          this.errorShipResult = true;
        });
    } else {
      this.verifyValidation(this.formShipping);
    }

  }

  isMobile(): any {
    const userAgent = window.navigator.userAgent.toLocaleLowerCase();
    return userAgent.includes('iphone') || userAgent.includes('android');
  }

}
