import {Component, OnInit, ViewChild} from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {Category} from '../../../shared/models/category.model';
import {TypeCategorie, TypeCategorieList} from '../../../shared/enums/type-categorie';
import {SwalComponent} from '@sweetalert2/ngx-sweetalert2';
import {ActivatedRoute, Router} from '@angular/router';
import {CategoriesService} from '../../../shared/services/categories.service';
import {map, take} from 'rxjs/operators';
import {ErrorWarning} from '../../../shared/models/error-warning.model';
import {ProductsService} from '../../../shared/services/products.service';
import {Product} from '../../../shared/models/product.model';
import {PaginationService} from '../../../shared/services/pagination.service';
import {ProductPage} from '../../../shared/models/pagination-model/product-page.model';
import {Observable, zip} from 'rxjs';

@Component({
  selector: 'app-categories-new',
  templateUrl: './categories-new.component.html',
  styleUrls: ['./categories-new.component.scss']
})
export class CategoriesNewComponent implements OnInit {
  @ViewChild('success')
  public readonly dialogSuccess!: SwalComponent;
  @ViewChild('error')
  public readonly dialogError!: SwalComponent;

  public formCategorie: FormGroup = new FormGroup({});
  public formCategorieList: FormGroup = new FormGroup({});
  public formProductFilter: FormGroup = new FormGroup({});
  public categorie!: Category;
  public typeCategorieList = TypeCategorieList;
  hasError!: boolean;

  public products!: Product[];
  content: ProductPage | undefined;
  filteredProducts: Product[] = [];
  page = 0;


  searchProduct = '';

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private categorieService: CategoriesService,
    private route: ActivatedRoute,
    private productsService: ProductsService,
    public paginationService: PaginationService
  ) {
    this.createFormCategorieList();
  }

  ngOnInit(): void {
    this.createForm();
    this.createFormProducts();
    if (this.router.url.includes('categorias/categoria')) {
      this.route.params.pipe(
        map(p => p.id)
      ).subscribe(id => {
        this.categorieService.getById(id)
          .pipe(take(1))
          .subscribe(c => {
            this.categorie = c;
            this.getProductsByCategory(10, 0);
            this.createForm();
          }, () => {
            this.hasError = true;
          });
      });
    }
  }

  removeTypeCategorie(i: number): void {
    this.type.removeAt(i);
  }

  removeProduct(id: string): void {
    this.productsService.updateCategories(this.categorie.id, id)
      .pipe(
        take(1)
      )
      .subscribe(() => {
        this.page = 0;
        this.getProductsByCategory(10, this.page);
      }, () => {
        this.hasError = true;
      });
  }

  private createForm(): void {
    this.formCategorie = this.formBuilder.group({
      id: new FormControl(this.categorie?.id ? this.categorie.id : null),
      name: new FormControl(this.categorie?.name ? this.categorie.name : '', Validators.required),
      status: new FormControl(this.categorie?.status ? this.categorie.status : false),
      type: this.formBuilder.array(this.categorie?.type ? this.categorie.type : [], Validators.required)
    });
  }

  private createFormCategorieList(): void {
    this.formCategorieList = this.formBuilder.group({
      typelist: this.formBuilder.array([])
    });
    this.initTypeList();
  }

  loadCategorieOnList(): void {
    this.typeList.clear();
    this.typeCategorieList.forEach(t => {
      const hasType = this.type.controls.find(t1 => t1.value === t);
      this.typeList.push(this.createTypeListForm(hasType ? true : false, t));
    });
  }

  initTypeList(): void {
    this.typeCategorieList.forEach(t => {
      this.typeList.push(this.createTypeListForm(false, t));
    });
  }

  get typeList(): FormArray {
    return this.formCategorieList.get('typelist') as FormArray;
  }

  private createTypeListForm(checked: boolean, typeCategorie: TypeCategorie): FormGroup {
    return new FormGroup({
        checked: new FormControl(checked),
        type: new FormControl(typeCategorie, Validators.required),
      }
    );
  }

  get type(): FormArray {
    return this.formCategorie.get('type') as FormArray;
  }

  addTypeListCategorie(): void {
    this.type.clear();
    this.typeList.controls.forEach(t => {
      if (t.value.checked) {
        this.type.push(this.formBuilder.control(t.value.type));
      }
    });
  }

  get validateFields(): any {
    return this.formCategorie.controls;
  }

  redirect(): void {
    this.router.navigateByUrl('/painel/categorias');
  }

  save(): void {
    const category = this.formCategorie.value;
    category.name = category.name.toLowerCase();
    const request = this.categorie ?
      this.categorieService.update(category) :
      this.categorieService.create(category);
    request
      .pipe(take(1))
      .subscribe(() => {
        this.dialogSuccess.title = 'Categoria salva com sucesso!';
        this.dialogSuccess.fire();
      }, error => {
        this.setErrorDialog(error);
        this.dialogError.fire().then(r => {
          if (r.isConfirmed) {
            this.save();
          }
        });
      });
  }


  setErrorDialog(error: ErrorWarning): void {
    this.dialogError.confirmButtonText = error.action;
    this.dialogError.title = error.title;
    this.dialogError.text = error.message;
  }

  delete(): void {
    this.categorieService.delete(this.categorie?.id)
      .pipe(take(1))
      .subscribe(() => {
        this.dialogSuccess.title = 'Categoria excluída com sucesso!';
        this.dialogSuccess.fire();
      }, error => {
        this.setErrorDialog(error);
        this.dialogError.fire().then(r => {
          if (r.isConfirmed) {
            this.delete();
          }
        });
      });
  }

  getProductsByCategory(size: number, page: number): void {
    this.productsService.getByCategoryId(this.categorie.id, size, page)
      .pipe(take(1))
      .subscribe(products => {
        this.products = products.content;
        this.content = products;
        this.paginationService.getPageRange(this.content.totalElements);
      }, () => {
        this.hasError = true;
      });
  }

  getAllProducts(): void {
    this.productsService.getAll(300, 0)
      .pipe(take(1))
      .subscribe(r => {
        // @ts-ignore
        this.filteredProducts = r.content.filter(p => {
          const hasCategory = p.category.find(c => c.name === this.categorie.name);
          if (!hasCategory) {
            return p;
          }
        });
        this.productFilterFormArray.clear();
        this.filteredProducts
          .forEach(p => this.productFilterFormArray.push(this.createProductFilterForm(false, p)));
      }, () => {
        this.hasError = true;
      });
  }


  updateIndex(index: number): void {
    this.getProductsByCategory(10, index);
    this.paginationService.page = index;
  }

  filterProductsList(): AbstractControl[] {
    if (!this.searchProduct) {
      return this.productFilterFormArray.controls;
    }
    return this.productFilterFormArray
      .controls.filter(p => p.value.model.toLowerCase().includes(this.searchProduct));
  }

  private createFormProducts(): void {
    this.formProductFilter = this.formBuilder.group({
        products: this.formBuilder.array([]),
      }
    );
  }

  private createProductFilterForm(checked: boolean, product: Product): FormGroup {
    return new FormGroup({
        checked: new FormControl(checked),
        id: new FormControl(product.id, Validators.required),
        model: new FormControl(product.model, Validators.required),
      }
    );
  }

  get productFilterFormArray(): FormArray {
    return this.formProductFilter.get('products') as FormArray;
  }

  addProductsCategory(): void {
    const requests: Observable<Product>[] = [];
    this.productFilterFormArray.controls.forEach(form => {
      if (form.value.checked) {
        requests.push(
          this.productsService.updateCategories(this.categorie.id, form.value.id)
        );
      }
    });
    zip(
      ...requests
    ).pipe(take(1))
      .subscribe(() => {
        this.page = 0;
        this.getProductsByCategory(10, this.page);
      }, () => {
        this.hasError = true;
      });

  }

}
