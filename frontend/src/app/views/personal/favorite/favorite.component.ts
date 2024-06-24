import {Component, OnInit} from '@angular/core';
import {FavoriteService} from "../../../shared/services/favorite.service";
import {FavoriteType} from "../../../../types/favorite.type";
import {DefaultResponseType} from "../../../../types/default-response.type";
import {environment} from "../../../../environments/environment";
import {CartService} from "../../../shared/services/cart.service";
import {CartType} from "../../../../types/cart.type";

@Component({
  selector: 'app-favorite',
  templateUrl: './favorite.component.html',
  styleUrls: ['./favorite.component.scss']
})
export class FavoriteComponent implements OnInit {
  serverStaticPath: string = environment.serverStaticPath;
  products: FavoriteType[] = [];
  cart:CartType|null=null;

  constructor(private favoriteService: FavoriteService, private cartService: CartService) {}

  ngOnInit(): void {
    this.favoriteService.getFavorites()
      .subscribe((data: FavoriteType[] | DefaultResponseType) => {
        if ((data as DefaultResponseType).error !== undefined) {
          const error = (data as DefaultResponseType).message;
          throw new Error(error);
        }
        this.products = data as FavoriteType[];

        this.cartService.getCart()
          .subscribe((data: CartType|DefaultResponseType) => {
            if ((data as DefaultResponseType).error !== undefined) {
              const error = (data as DefaultResponseType).message;
              throw new Error(error);
            }
            this.cart = data as CartType;

            if (this.cart && this.cart.items.length > 0) {
              this.products.map((item:FavoriteType)=>{
                const cartProductIndex:number|undefined=this.cart?.items.findIndex(cartItem=>cartItem.product.id === item.id);
                if (cartProductIndex !==undefined && cartProductIndex > -1) {item.inCart=this.cart?.items[cartProductIndex].quantity}
                return item;
              })
            }

          });
      });
  }

  removeFromFavorites(id: string) {
    this.favoriteService.removeFavorite(id)
      .subscribe((data: DefaultResponseType) => {
        if (data.error) {
          throw new Error(data.message);
        }//Если пришла ошибка - то завершаем функцию

        this.products = this.products.filter((item: FavoriteType) => item.id !== id);
      });
  }

  addToCart(product:FavoriteType){
    this.cartService.updateCart(product.id,1)
      .subscribe((data:CartType|DefaultResponseType)=>{
        if ((data as DefaultResponseType).error !== undefined) {
          const error = (data as DefaultResponseType).message;
          throw new Error(error);
        }
        product.inCart=1;
      });
  }
  removeFromCart(product:FavoriteType){
    this.cartService.updateCart(product.id,0)
      .subscribe((data:CartType|DefaultResponseType)=>{
        if ((data as DefaultResponseType).error !== undefined) {
          const error = (data as DefaultResponseType).message;
          throw new Error(error);
        }
        product.inCart=0;
      });
  }

  updateCount(product:FavoriteType,value:number){
    //Запрос на изменение данных в корзине при нажатии на +/- в счетчике
      if (value>0 && product.inCart && product.inCart!==value) {
      this.cartService.updateCart(product.id,value)
        .subscribe((data:CartType|DefaultResponseType)=>{
          if ((data as DefaultResponseType).error !== undefined) {
            const error = (data as DefaultResponseType).message;
            throw new Error(error);
          }
          console.log(value,'Запрос прошел');
          product.inCart=value;
        });
      }else{
        product.inCart=1;
      }
  }
}
