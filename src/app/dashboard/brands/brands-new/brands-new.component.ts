import {Component, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {BrandsService} from '../../shared/services/brands.service';
import {map, take} from 'rxjs/operators';
import {ActivatedRoute, ActivatedRouteSnapshot, Router} from '@angular/router';
import {SwalComponent} from '@sweetalert2/ngx-sweetalert2';
import {Brand} from '../../shared/models/brand.model';
import {ErrorWarning} from '../../../shared/models/error-warning.model';

@Component({
  selector: 'app-brands-new',
  templateUrl: './brands-new.component.html',
  styleUrls: ['./brands-new.component.scss']
})
export class BrandsNewComponent implements OnInit {
  @ViewChild('success')
  public readonly dialogSuccess!: SwalComponent;
  @ViewChild('error')
  public readonly dialogError!: SwalComponent;

  public formBrand: FormGroup = new FormGroup({});
  public brand: Brand | undefined;

  constructor(
    private formBuilder: FormBuilder,
    private brandService: BrandsService,
    private router: Router,
    private route: ActivatedRoute
  ) {
  }

  ngOnInit(): void {
    this.createForm();
    if (this.router.url.includes('marcas/marca')) {
      this.route.params.pipe(
        map(p => p.id)
      ).subscribe(id => {
        this.brandService.getById(id)
          .pipe(take(1))
          .subscribe(b => {
            this.brand = b;
            this.createForm();
          }, (error: ErrorWarning) => {
            this.dialogError.confirmButtonText = error.action;
            this.dialogError.title = error.title;
            this.dialogError.text = error.message;
            this.dialogError.fire();
          });
      });
    }
  }

  private createForm(): void {
    this.formBrand = this.formBuilder.group({
      id: new FormControl(this.brand?.id ? this.brand.id : null),
      name: new FormControl(this.brand?.name ? this.brand.name : '', Validators.required),
    });
  }

  cssError(field: any): any {
    return {
      'is-invalid': field.invalid && field.touched
    };
  }

  save(): void {
    if (this.brand?.id) {
      this.brandService.update(this.formBrand.value)
        .pipe(take(1))
        .subscribe(r => {
          this.dialogSuccess.fire();
        }, (error: ErrorWarning) => {
          this.setErrorDialog(error);
          this.dialogError.fire();
        });
    } else {
      this.brandService.create(this.formBrand.value)
        .pipe(take(1))
        .subscribe(() => {
          this.dialogSuccess.fire();
        }, (error) => {
          this.setErrorDialog(error);
          this.dialogError.fire();
        });
    }

  }

  redirect(): void {
    this.router.navigateByUrl('/painel/marcas');
  }

  setErrorDialog(error: ErrorWarning): void {
    this.dialogError.confirmButtonText = error.action;
    this.dialogError.title = error.title;
    this.dialogError.text = error.message;
  }


}
