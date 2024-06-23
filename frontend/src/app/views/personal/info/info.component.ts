import {Component, OnInit} from '@angular/core';
import {DeliveryType} from "../../../../types/delivery.type";
import {PaymentType} from "../../../../types/payment.type";
import {FormBuilder, Validators} from "@angular/forms";
import {UserService} from "../../../shared/services/user.service";
import {DefaultResponseType} from "../../../../types/default-response.type";
import {UserInfoType} from "../../../../types/user-info.type";
import {OrderType} from "../../../../types/order.type";
import {HttpErrorResponse} from "@angular/common/http";
import {MatSnackBar} from "@angular/material/snack-bar";

@Component({
  selector: 'app-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.scss']
})
export class InfoComponent implements OnInit {
  protected readonly DeliveryTypes = DeliveryType;
  protected readonly PaymentTypes = PaymentType;

  deliveryType: DeliveryType = DeliveryType.delivery;
  userInfoForm = this.fb.group({
    firstName: [''],
    lastName: [''],
    phone: [''],
    fatherName: [''],
    paymentType: [PaymentType.cashToCourier],
    /*deliveryType: [DeliveryType.delivery],// Если храним переменную внутри*/
    email: ['', Validators.required],
    street: [''],
    house: [''],
    entrance: [''],
    apartment: [''],
  });

  constructor(private fb: FormBuilder, private userService: UserService, private _snackBar: MatSnackBar) {
  }

  ngOnInit(): void {
    this.userService.getUserIndo()
      .subscribe((data: UserInfoType | DefaultResponseType) => {
        if ((data as DefaultResponseType).error !== undefined) {
          const error = (data as DefaultResponseType).message;
          throw new Error(error);
        }

        const userInfo: UserInfoType = data as UserInfoType;
        const paramsToUpdate = {
          firstName: userInfo.firstName ? userInfo.firstName : '',
          lastName: userInfo.lastName ? userInfo.lastName : '',
          phone: userInfo.phone ? userInfo.phone : '',
          fatherName: userInfo.fatherName ? userInfo.fatherName : '',
          paymentType: userInfo.paymentType ? userInfo.paymentType : PaymentType.cashToCourier,
          email: userInfo.email ? userInfo.email : '',
          street: userInfo.street ? userInfo.street : '',
          house: userInfo.house ? userInfo.house : '',
          entrance: userInfo.entrance ? userInfo.entrance : '',
          apartment: userInfo.apartment ? userInfo.apartment : ''
        }
        if (userInfo.deliveryType)this.deliveryType=userInfo.deliveryType;
        this.userInfoForm.setValue(paramsToUpdate);


      });
  }

  changeDeliveryType(deliveryType: DeliveryType) {
    this.deliveryType = deliveryType;
    /*this.userInfoForm.get('deliveryType')?.setValue(deliveryType); //Если храним переменную внутри*/
    this.userInfoForm.markAsDirty();
  }

  updateUserInfo() {
    if (this.userInfoForm.valid) {

      const paramObject: UserInfoType = {
        email: this.userInfoForm.value.email ? this.userInfoForm.value.email : '',
        deliveryType: this.deliveryType,
        paymentType: this.userInfoForm.value.paymentType ? this.userInfoForm.value.paymentType : PaymentType.cashToCourier,
      }

      if (this.userInfoForm.value.firstName) paramObject.firstName = this.userInfoForm.value.firstName;
      if (this.userInfoForm.value.lastName) paramObject.lastName = this.userInfoForm.value.lastName;
      if (this.userInfoForm.value.phone) paramObject.phone = this.userInfoForm.value.phone;
      if (this.userInfoForm.value.fatherName) paramObject.fatherName = this.userInfoForm.value.fatherName;
      if (this.userInfoForm.value.street) paramObject.street = this.userInfoForm.value.street;
      if (this.userInfoForm.value.house) paramObject.house = this.userInfoForm.value.house;
      if (this.userInfoForm.value.entrance) paramObject.entrance = this.userInfoForm.value.entrance;
      if (this.userInfoForm.value.apartment) paramObject.apartment = this.userInfoForm.value.apartment;

      this.userService.updateUserIndo(paramObject)
        .subscribe({
          next: (data: DefaultResponseType) => {
            if (data.error) {
              this._snackBar.open(data.message);
              this._snackBar.open(data.message,);
              throw new Error(data.message);
            }

            this._snackBar.open('Данные успешно сохранены');
            this.userInfoForm.markAsPristine(); //Помечаем форму как чистую
          },
          error: (errorResponse: HttpErrorResponse) => {
            if (errorResponse.error && errorResponse.error.message) {
              //Если есть ошибка - выводим это пользователю
              this._snackBar.open(errorResponse.error.message, 'ok');
            } else {
              this._snackBar.open('Ошибка сохранения');
            }//Если сообщения нет - выводим это
          }//Обработка кода ответа 400 либо 500 например. Если в ответе 200 приходит флаг ошибки - то это обрабатывается в next
        });
    }
  }

}
