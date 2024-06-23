import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {AuthService} from "../../../core/auth/auth.service";
import {DefaultResponseType} from "../../../../types/default-response.type";
import {LoginResponseType} from "../../../../types/login-response.type";
import {HttpErrorResponse} from "@angular/common/http";
import {MatSnackBar} from "@angular/material/snack-bar";
import {Router} from "@angular/router";
import {CartService} from "../../../shared/services/cart.service";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  loginForm=this.fb.group({
    email:['',[Validators.email, Validators.required]],
    password:['',[Validators.required]],
    rememberMe:[false],
  });

  constructor(private fb: FormBuilder,
              private authService:AuthService,
              private _snackBar: MatSnackBar,
              private cartService: CartService,
              private router:Router) { }

  ngOnInit(): void {
  }

  login():void{
    if (this.loginForm.valid && this.loginForm.value.email && this.loginForm.value.password){
      this.authService.login(this.loginForm.value.email,this.loginForm.value.password,!!this.loginForm.value.rememberMe)
        .subscribe({
          next:(data:DefaultResponseType|LoginResponseType)=>{
            let error=null;
            if ((data as DefaultResponseType).error!==undefined){
              error=(data as DefaultResponseType).message;
            }

            const loginResponse:LoginResponseType = data as LoginResponseType;
            if (!loginResponse.accessToken ||!loginResponse.refreshToken || !loginResponse.userId){
              error='Ошибка авторизации';//С сервера пришли не корректные данные
            }
            if (error){
              this._snackBar.open(error);
              throw new Error(error);
            }//Если ошибка есть - выводим её и завершаем функцию

            this.authService.setTokens(loginResponse.accessToken, loginResponse.refreshToken);
            this.authService.userId=loginResponse.userId; //Если сюда присвоим null - то из localstorage userId удалится
            this._snackBar.open('Вы успешно авторизовались');
            this.router.navigate(['/']);
            this.cartService.getCartCount().subscribe();
          },
          error:(errorResponse:HttpErrorResponse)=>{
            if (errorResponse.error && errorResponse.error.message){
              //Если есть ошибка - выводим это пользователю
              this._snackBar.open(errorResponse.error.message);
            }else{
              this._snackBar.open('Ошибка авторизации');
            }//Если сообщения нет - выводим это
          }//Обработка кода ответа 400 либо 500 например. Если в ответе 200 приходит флаг ошибки - то это обрабатывается в next
        })
    }
  }

}
