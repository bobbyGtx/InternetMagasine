import { Injectable } from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree} from '@angular/router';
import { Observable } from 'rxjs';
import {Location} from "@angular/common";
import {AuthService} from "./auth.service";


@Injectable({
  providedIn: 'root'
})
export class AuthForwardGuard implements CanActivate {
  constructor( private authService: AuthService,private location: Location) { }
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (this.authService.getIsLoggedIn()){
      this.location.back();//Переводим на предыдущую страницу если пользователь залогинен
      return false;
    }
    return true;//Если не залогинен - разрешаем переход на страницы модуля UserModule
  }

}
