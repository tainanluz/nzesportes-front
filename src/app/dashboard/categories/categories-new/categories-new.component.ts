import {Component, OnInit, ViewChild} from '@angular/core';

@Component({
  selector: 'app-categories-new',
  templateUrl: './categories-new.component.html',
  styleUrls: ['./categories-new.component.scss']
})
export class CategoriesNewComponent implements OnInit {
  constructor() {
  }

  ngOnInit(): void {
  }

  removeProduct(id: any): void {
    console.log('remove', id);
  }

}
