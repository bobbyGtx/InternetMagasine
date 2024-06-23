import { Directive } from '@angular/core';
import {AbstractControl, NG_VALIDATORS, ValidationErrors, Validator} from "@angular/forms";

//Директива подключена к SharedModule, который создали после создания директивы
//ng g d shared/directives/password-repeat --skip-tests
//ng g m shared  (удалили подключение директивы из Аппмодуля, и подключили её в SharedModule. Его подключили в UserModule)
//Подом добавляем в этом файле providers
@Directive({
  selector: '[passwordRepeat]',
  providers: [{provide:NG_VALIDATORS,useExisting:PasswordRepeatDirective,multi:true}]
})
export class PasswordRepeatDirective implements Validator{

  validate(control: AbstractControl): ValidationErrors | null {
    const password=control.get('password');
    const passwordRepeat=control.get('passwordRepeat');
    if (password?.value !== passwordRepeat?.value) {
      passwordRepeat?.setErrors({passwordRepeat:true});
      return {passwordRepeat:true};
    }
    return null;
  }
}
