import {Component, OnInit} from '@angular/core';
import {ProductService} from "../../../shared/services/product.service";
import {ProductType} from "../../../../types/product.type";
import {CategoryService} from "../../../shared/services/category.service";
import {CategoryWithTypeType} from "../../../../types/category-with-type.type";
import {ActivatedRoute, Router} from "@angular/router";
import {ActiveParamsType} from "../../../../types/active-params.type";
import {ActiveParamsUtil} from "../../../shared/utils/active-params.util";
import {AppliedFilterType} from "../../../../types/applied-filter.type";
import {debounceTime} from "rxjs";
import {CartService} from "../../../shared/services/cart.service";
import {CartType} from "../../../../types/cart.type";
import {FavoriteService} from "../../../shared/services/favorite.service";
import {FavoriteType} from "../../../../types/favorite.type";
import {DefaultResponseType} from "../../../../types/default-response.type";
import {AuthService} from "../../../core/auth/auth.service";

@Component({
  selector: 'app-catalog',
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.scss']
})
export class CatalogComponent implements OnInit {
  products: ProductType[] = [];
  categoriesWithTypes: CategoryWithTypeType[] = [];
  activeParams: ActiveParamsType = {types: []};
  appliedFilters: AppliedFilterType[] = [];
  sortingOpen: boolean = false;
  sortingOptions: { name: string, value: string }[] = [
    {name: 'От А до Я', value: 'az-asc'},
    {name: 'От Я до А', value: 'az-desc'},
    {name: 'По возрастанию цены', value: 'price-asc'},
    {name: 'По убыванию цены', value: 'price-desc'},
  ];
  pages: number[] = [];//Массив для хранения страниц пагинации
  cart: CartType | null = null;
  favoriteProducts: FavoriteType[] | null = null;//null чтоб не проверять длину массива в шаблоне

  constructor(private productService: ProductService,
              private categoryService: CategoryService,
              private cartService: CartService,
              private favoriteService: FavoriteService,
              private activatedRoute: ActivatedRoute,
              private authService: AuthService,
              private router: Router) {
  }

  ngOnInit(): void {
    this.cartService.getCart().subscribe((data: CartType|DefaultResponseType) => {
      if ((data as DefaultResponseType).error !== undefined) {
        const error = (data as DefaultResponseType).message;
        throw new Error(error);
      }
      this.cart = data as CartType; //Получаем содержимое корзины от сервера
      //Далее, в запросе товаров проводим проверку для каждого товара

      if (this.authService.getIsLoggedIn()){
        this.favoriteService.getFavorites()
          .subscribe(
            {
              next: (data: FavoriteType[] | DefaultResponseType) => {
                if ((data as DefaultResponseType).error !== undefined) {
                  const error = (data as DefaultResponseType).message;
                  this.processCatalog();//В любом случае отображаем каталог
                  throw new Error(error);
                }

                this.favoriteProducts = data as FavoriteType[];
                this.processCatalog();
              },
              error: (error) => {
                this.processCatalog();
              }//Если не получили избранное (если пользователь не авторизован)
            });
      }else{
        this.processCatalog();
      }//Если пользователь авторизован - делаем запрос избранного, иначе не делаем!

    });
  }

  removeAppliedFilter(appliedFilter: AppliedFilterType) {
    if (appliedFilter.urlParam === 'heightFrom' || appliedFilter.urlParam === 'heightTo' || appliedFilter.urlParam === 'diameterFrom' || appliedFilter.urlParam === 'diameterTo') {
      delete this.activeParams[appliedFilter.urlParam];
    } else {
      this.activeParams.types = this.activeParams.types.filter(item => item !== appliedFilter.urlParam);
    }
    this.activeParams.page = 1;//Сброс пагинации при изменении фильтра
    this.router.navigate(['/catalog'], {queryParams: this.activeParams});
  }

  toggleSorting() {
    this.sortingOpen = !this.sortingOpen;
  }

  sort(value: string) {
    if (this.activeParams.sort === value) {
      this.activeParams.sort = undefined;
    } else {
      this.activeParams.sort = value; //Добавляем сортировку в параметры
    }
    this.router.navigate(['/catalog'], {queryParams: this.activeParams}); //переводим пользователя на страницу для добавления в url фильтра и для обновления запроса
  }

  openPage(page: number): void {
    this.activeParams.page = page;
    this.router.navigate(['/catalog'], {queryParams: this.activeParams}); //переводим пользователя на страницу для добавления в url фильтра и для обновления запроса
  }

  openPrevPage() {
    if (this.activeParams.page && this.activeParams.page > 1) {
      this.openPage(--this.activeParams.page);
    }
  }

  openNextPage() {
    if (this.activeParams.page && this.activeParams.page < this.pages.length) {
      this.openPage(++this.activeParams.page);
    }
  }


  processCatalog() {
    this.categoryService.getCategoriesWithTypes()
      .subscribe(data => {
        this.categoriesWithTypes = data;
        //После получения списка категорий начинаем формировать выбранные фильтры
        this.activatedRoute.queryParams
          .pipe(debounceTime(500))//Дебаунсинг
          .subscribe(params => {
            this.activeParams = ActiveParamsUtil.processParams(params);
            this.appliedFilters = [];
            this.activeParams.types.forEach(url => {
              for (let i = 0; i < this.categoriesWithTypes.length; i++) {
                const foundType = this.categoriesWithTypes[i].types.find(type => type.url === url);
                if (foundType) {
                  this.appliedFilters.push({
                    name: foundType.name,
                    urlParam: foundType.url
                  });
                }
              }
            });//Считываем параметры типов и заносим в переменную

            //Далее обрабатываем параметры диаметра и высоты
            if (this.activeParams.heightFrom) {
              this.appliedFilters.push({
                name: 'Высота: от ' + this.activeParams.heightFrom + ' см',
                urlParam: 'heightFrom'
              });
            }
            if (this.activeParams.heightTo) {
              this.appliedFilters.push({
                name: 'Высота: до ' + this.activeParams.heightTo + ' см',
                urlParam: 'heightTo'
              });
            }
            if (this.activeParams.diameterFrom) {
              this.appliedFilters.push({
                name: 'Диаметр: от ' + this.activeParams.diameterFrom + ' см',
                urlParam: 'diameterFrom'
              });
            }
            if (this.activeParams.diameterTo) {
              this.appliedFilters.push({
                name: 'Диаметр: до ' + this.activeParams.diameterTo + ' см',
                urlParam: 'diameterTo'
              });
            }

            //Запрос на получение каталога после обработки фильтров и сортировок
            this.productService.getProducts(this.activeParams)
              .subscribe(data => {
                this.pages = [];
                for (let i = 1; i <= data.pages; i++) {
                  this.pages.push(i);
                }

                if (this.cart && this.cart.items.length > 0) {//Синхронизация корзины с товарами
                  this.products = data.items.map((product: ProductType) => {
                    if (this.cart) {
                      const productInCart = this.cart.items.find(item => item.product.id === product.id); //Ищем товар в карзине
                      if (productInCart) product.countInCart = productInCart.quantity;//Если нашли - добавляем к его записи кол-во
                      //Потом product.countInCart передаем в карточку через @Input
                    }
                    return product; //Возвращаем измененный массив
                  });
                } else {
                  this.products = data.items;
                }

                //Обработка избранного, если оно есть
                if (this.favoriteProducts){
                  this.products = this.products.map(product=>{
                    const productInFavorite=this.favoriteProducts?.find(item=>item.id===product.id);
                    if (productInFavorite)product.isInFavorite=true;
                    return product;
                  });
                }
              });
          }); //Подписка на изменение Query params
      });
  }//Запросыф на формирование каталога. Вынесли из-за избранного. Код должен выполняться и в случае получения избранного и в случае если пользователь не авторизован
}
