import { Injectable } from '@angular/core';
import {Observable} from "rxjs";
import {environment} from "../../../environments/environment";
import {HttpClient} from "@angular/common/http";
import {DefaultResponseType} from "../../../types/default-response.type";
import {UserInfoType} from "../../../types/user-info.type";

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient) { }

  updateUserIndo(params:UserInfoType):Observable<DefaultResponseType>{
    return this.http.post<DefaultResponseType>(environment.api+'user',params);
  }

  getUserIndo():Observable<UserInfoType|DefaultResponseType>{
    return this.http.get<UserInfoType|DefaultResponseType>(environment.api+'user');
  }

}
