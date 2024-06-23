import { Component, OnInit } from '@angular/core';
import {FormBuilder, Validators} from "@angular/forms";
import {AuthService} from "../../../core/auth/auth.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {Router} from "@angular/router";
import {DefaultResponseType} from "../../../../types/default-response.type";
import {LoginResponseType} from "../../../../types/login-response.type";
import {HttpErrorResponse} from "@angular/common/http";

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {
  signupForm=this.fb.group({
    email:['',[Validators.email, Validators.required]],
    password:['',[Validators.required,Validators.pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/)]],
    passwordRepeat:['',[Validators.required,Validators.pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/)]],
    agree:[false,[Validators.requiredTrue]],
  });
  constructor(private fb: FormBuilder,
              private authService:AuthService,
              private _snackBar: MatSnackBar,
              private router:Router) { }

  ngOnInit(): void {
  }

  signUp(){
    if (this.signupForm.valid && this.signupForm.value.email && this.signupForm.value.password && this.signupForm.value.passwordRepeat && this.signupForm.value.agree){
      this.authService.signup(this.signupForm.value.email, this.signupForm.value.password, this.signupForm.value.passwordRepeat)
        .subscribe({
          next: (data:DefaultResponseType|LoginResponseType) => {
            let error=null;
            if ((data as DefaultResponseType).error!==undefined){
              error=(data as DefaultResponseType).message;
            }

            const loginResponse:LoginResponseType = data as LoginResponseType;
            if (!loginResponse.accessToken ||!loginResponse.refreshToken || !loginResponse.userId){
              error='Ошибка регистрации';//С сервера пришли не корректные данные
            }
            if (error){
              this._snackBar.open(error);
              throw new Error(error);
            }//Если ошибка есть - выводим её и завершаем функцию

            this.authService.setTokens(loginResponse.accessToken, loginResponse.refreshToken);
            this.authService.userId=loginResponse.userId; //Если сюда присвоим null - то из localstorage userId удалится
            this._snackBar.open('Вы успешно зарегистрировались');
            this.router.navigate(['/']);
          },
          error: (errorResponse:HttpErrorResponse) => {
            if (errorResponse.error && errorResponse.error.message){
              //Если есть ошибка - выводим это пользователю
              this._snackBar.open(errorResponse.error.message);
            }else{
              this._snackBar.open('Ошибка регистрации');
            }//Если сообщения нет - выводим это
          }
        })
    }
  }
}