import {Component, HostListener, Input, OnInit} from '@angular/core';
import {AuthService} from "../../../core/auth/auth.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {Router} from "@angular/router";
import {CategoryWithTypeType} from "../../../../types/category-with-type.type";
import {CartService} from "../../services/cart.service";
import {DefaultResponseType} from "../../../../types/default-response.type";
import {ProductService} from "../../services/product.service";
import {ProductType} from "../../../../types/product.type";
import {environment} from "../../../../environments/environment";
import {FormControl} from "@angular/forms";
import {debounceTime} from "rxjs";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  searchField = new FormControl();
  //searchValue: string = '';
  products: ProductType[] = [];
  showedSearch: boolean = false;
  count: number = 0;
  isLoggedIn: boolean = false;
  @Input() categories: CategoryWithTypeType[] = [];
  serverStaticPath: string = environment.serverStaticPath;


  constructor(private authService: AuthService,
              private _snackBar: MatSnackBar,
              private cartService: CartService,
              private productService: ProductService,
              private router: Router) {
    this.isLoggedIn = this.authService.getIsLoggedIn();
  }

  ngOnInit(): void {
    this.searchField.valueChanges
      .pipe(debounceTime(500))//Дебаунсинг
      .subscribe(value => {
        if (value && value.length > 2) {
          this.productService.searchProducts(value)
            .subscribe((data: ProductType[]) => {
              this.products = data;
              this.showedSearch = true;
            });
        } else {
          this.products = [];
          this.showedSearch = false;
        }
      });//Подписка на изменение значения в поле

    this.authService.isLogged$.subscribe((isLoggedIn: boolean) => {
      this.isLoggedIn = isLoggedIn;
    });
    this.cartService.getCartCount()
      .subscribe((data: { count: number } | DefaultResponseType) => {
        if ((data as DefaultResponseType).error !== undefined) {
          const error = (data as DefaultResponseType).message;
          throw new Error(error);
        }
        if ((data as { count: number }) && (data as { count: number }).count) this.count = (data as {
          count: number
        }).count;
      });

    this.cartService.count$.subscribe(count => {
      this.count = count;
    })
  }

  logout(): void {
    this.authService.logout()
      .subscribe({
        next: () => {
          this.doLogout();
        },//Ошибку не обрабатываем т.к. если рефреш устареет, будет ошибка и пользователь не разлогинится
        error: () => {
          this.doLogout();
        }
      })
  }

  doLogout(): void {
    this.authService.removeTokens();
    this.authService.userId = null;
    this._snackBar.open('Вы вышли из системы');
    this.router.navigate(['/']).then();
    this.cartService.count$.next(0);
  }

  // changedSearchValue(newValue: string):void {
  //   this.searchValue = newValue;//Устанавливаем вручную новые данные в переменную т.к. сделали 1-но сторонний датабайндинг
  //   if (this.searchValue && this.searchValue.length > 2) {
  //     this.productService.searchProducts(this.searchValue)
  //       .subscribe((data:ProductType[])=>{
  //         this.products=data;
  //         this.showedSearch=true;
  //       });
  //   }else{
  //     this.products=[];
  //     this.showedSearch=false;
  //   }
  // }

  selectProduct(url: string): void {
    this.router.navigate(['/product/' + url]).then();
    //this.searchValue='';
    this.searchField.setValue('');
    this.products = [];
  }

  changeShowedSearch(showed: boolean): void {
    //Таймаут нужен для того, чтоб при потере фокуса, не сразу скрывалось окно и чтоб Ангулар обрабатывал клик
    setTimeout(() => {
      this.showedSearch = showed;
    }, 100);
  }//Функция для скрытия результатов поиска методом потери фокуса инпута

  @HostListener('document:click', ['$event'])
  click(event: Event) {
    if (this.showedSearch && (event.target as HTMLElement).className.indexOf('search-product') === -1) {
      this.showedSearch = false;
    }
  }
}
