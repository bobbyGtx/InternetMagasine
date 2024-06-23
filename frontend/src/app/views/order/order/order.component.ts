import {Component, ElementRef, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {CartService} from "../../../shared/services/cart.service";
import {CartType} from "../../../../types/cart.type";
import {DefaultResponseType} from "../../../../types/default-response.type";
import {MatSnackBar} from "@angular/material/snack-bar";
import {Router} from "@angular/router";
import {DeliveryType} from "../../../../types/delivery.type";
import {FormBuilder, Validators} from "@angular/forms";
import {PaymentType} from "../../../../types/payment.type";
import {MatDialog, MatDialogRef} from "@angular/material/dialog";
import {OrderService} from "../../../shared/services/order.service";
import {OrderType} from "../../../../types/order.type";
import {HttpErrorResponse} from "@angular/common/http";
import {UserService} from "../../../shared/services/user.service";
import {UserInfoType} from "../../../../types/user-info.type";
import {AuthService} from "../../../core/auth/auth.service";

@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.scss']
})
export class OrderComponent implements OnInit {
  protected readonly DeliveryTypes = DeliveryType; // Для того, чтоб в темплейте работал enum DeliveryType
  protected readonly PaymentTypes = PaymentType;// Для того, чтоб в темплейте работал enum PaymentType
  cart: CartType | null = null;
  deliveryPrice: number = 10;
  deliveryType: DeliveryType = DeliveryType.delivery;
  totalAmount: number = 0;
  totalCount: number = 0;

  orderForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    phone: ['', Validators.required],
    fatherName: [''],
    paymentType: [PaymentType.cashToCourier, Validators.required],
    email: ['', [Validators.required, Validators.email]],
    street: [''],
    house: [''],
    entrance: [''],
    apartment: [''],
    comment: ['']
  });

  @ViewChild('popup') popup!: TemplateRef<ElementRef>;//Для попапа
  dialogRef: MatDialogRef<any> | null = null;//Переменная для закрытия диалога

  constructor(private cartService: CartService,
              private orderService: OrderService,
              private userService: UserService,
              private authService: AuthService,
              private _snackBar: MatSnackBar,
              private router: Router,
              private dialog: MatDialog,
              private fb: FormBuilder) {
  }

  ngOnInit(): void {
    this.cartService.getCart()
      .subscribe((data: CartType | DefaultResponseType) => {
        if ((data as DefaultResponseType).error !== undefined) {
          const error = (data as DefaultResponseType).message;
          throw new Error(error);
        }
        this.cart = data as CartType;
        if (!this.cart || (this.cart && this.cart.items.length === 0)) {
          this._snackBar.open('Корзина пустая!');
          this.router.navigate(['/']);
          return;
        }
        this.calculateTotal();
      });

    if (this.authService.getIsLoggedIn()) {
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
            apartment: userInfo.apartment ? userInfo.apartment : '',
            comment: ''
          }
          if (userInfo.deliveryType) this.deliveryType = userInfo.deliveryType;
          this.orderForm.setValue(paramsToUpdate);


        });
    }
    this.updateDeliveryTypeValidation();
  }

  calculateTotal() {
    this.totalAmount = 0;
    this.totalCount = 0;
    if (this.cart) {
      this.cart.items.forEach(item => {
        this.totalAmount += item.quantity * item.product.price;
        this.totalCount += item.quantity;
      })
    }
  }

  changeDeliveryType(deliveryType: DeliveryType) {
    this.deliveryType = deliveryType;
    this.updateDeliveryTypeValidation();
  }

  updateDeliveryTypeValidation(): void {
    if (this.deliveryType === DeliveryType.delivery) {
      this.orderForm.get('street')?.setValidators(Validators.required);
      this.orderForm.get('house')?.setValidators(Validators.required);
    } else {
      this.orderForm.get('street')?.removeValidators(Validators.required);
      this.orderForm.get('house')?.removeValidators(Validators.required);
      this.orderForm.get('street')?.setValue('');
      this.orderForm.get('house')?.setValue('');
      this.orderForm.get('entrance')?.setValue('');
      this.orderForm.get('apartment')?.setValue('');
    }
    this.orderForm.get('street')?.updateValueAndValidity();
    this.orderForm.get('house')?.updateValueAndValidity();
  }

  createOrder() {
    if (this.orderForm.valid && this.orderForm.value.firstName && this.orderForm.value.lastName && this.orderForm.value.fatherName && this.orderForm.value.phone && this.orderForm.value.paymentType && this.orderForm.value.email) {
      //Так как нам нельзя передавать на бэкэнд пустые строки - формируем объект с данными вручную.
      const paramsObject: OrderType = {
        deliveryType: this.deliveryType,
        firstName: this.orderForm.value.firstName,
        lastName: this.orderForm.value.lastName,
        fatherName: this.orderForm.value.fatherName,
        phone: this.orderForm.value.phone,
        paymentType: this.orderForm.value.paymentType,
        email: this.orderForm.value.email,
      }//Создание объекта с обязательными полями
      if (this.deliveryType === DeliveryType.delivery) {
        if (this.orderForm.value.street) paramsObject.street = this.orderForm.value.street;
        if (this.orderForm.value.house) paramsObject.house = this.orderForm.value.house;
        if (this.orderForm.value.entrance) paramsObject.entrance = this.orderForm.value.entrance;
        if (this.orderForm.value.apartment) paramsObject.apartment = this.orderForm.value.apartment;
      }//Если доставка курьером - то добавляем заполненные поля

      if (this.orderForm.value.comment) paramsObject.comment = this.orderForm.value.comment;

      this.orderService.createOrder(paramsObject)
        .subscribe({
          next: (data: OrderType | DefaultResponseType) => {
            if ((data as DefaultResponseType).error !== undefined) {
              const error = (data as DefaultResponseType).message;
              throw new Error(error);
            }

            this.dialogRef = this.dialog.open(this.popup);
            this.dialogRef.backdropClick().subscribe(() => this.router.navigate(['/']));//Если пользователь кликнет мимо диалога и он закроется - переводим его так же на главную страницу
            this.cartService.setCount(0);
          },
          error: (errorResponse: HttpErrorResponse) => {
            if (errorResponse.error && errorResponse.error.message) {
              this._snackBar.open(errorResponse.error.message);
            } else {
              this._snackBar.open('Ошибка заказа!');
            }
          }
        });
    } else {
      this.orderForm.markAllAsTouched();
      this._snackBar.open('Заполните необходимые поля');
    }
  }

  closePopup() {
    this.dialogRef?.close();
    this.router.navigate(['/']);
  }

}
