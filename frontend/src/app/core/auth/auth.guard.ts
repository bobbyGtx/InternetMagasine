import { Injectable } from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import { Observable } from 'rxjs';
import {AuthService} from "./auth.service";
import {MatSnackBar} from "@angular/material/snack-bar";

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private _snackBar: MatSnackBar, private router: Router) { }
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const isLoggedIn:boolean=this.authService.getIsLoggedIn();
    if (isLoggedIn){
      return true;//Если залогинен - то вернем true и разрешим переход
    }else{
      this._snackBar.open("Для доступа необходимо авторизоваться!");
      this.router.navigate(['/login']);
      return false;
    }
  }

}
