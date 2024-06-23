import {Component, Input, OnInit} from '@angular/core';
import {CategoryWithTypeType} from "../../../../types/category-with-type.type";
import {ActivatedRoute, Router} from "@angular/router";
import {ActiveParamsType} from "../../../../types/active-params.type";
import {ActiveParamsUtil} from "../../utils/active-params.util";

@Component({
  selector: 'category-filter',
  templateUrl: './category-filter.component.html',
  styleUrls: ['./category-filter.component.scss']
})
export class CategoryFilterComponent implements OnInit {
  @Input() categoryWithTypes: CategoryWithTypeType | null = null;
  @Input() type: string | null = null;
  open: boolean = false;
  activeParams: ActiveParamsType = {types: []};

  from: number | null = null;
  to: number | null = null;

  get title(): string {
    if (this.categoryWithTypes) {
      return this.categoryWithTypes.name;
    } else {
      if (this.type) {
        if (this.type === 'height') return 'Высота';
        if (this.type === 'diameter') return 'Диаметр';
        return this.type;
      }
      return '';
    }
  }


  constructor(private router: Router, private activatedRoute: ActivatedRoute) {
  }

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe(params => {
      this.activeParams =ActiveParamsUtil.processParams(params);

      if (this.type) { //Проверяем какой тип компонента, и в зависимости от этого вносим данные в элемент для отображения. Если мы загружаем страницу по ссылке с QueryParams
        if (this.type === "height") {
          this.open = (this.activeParams.heightFrom || this.activeParams.heightTo) ? true : this.open; //Если любой из параметров есть - то окрываем окно.Тернарник для того, чтоб окно не закрывалось само при очистке фильтров
          this.from = this.activeParams.heightFrom ? +this.activeParams.heightFrom : null;
          this.to = this.activeParams.heightTo ? +this.activeParams.heightTo : null;
        }//Если компонент с шириной - то заполняем его и открываем если есть что-то
        if (this.type === "diameter") {
          this.open = (this.activeParams.diameterFrom || this.activeParams.diameterTo) ? true : this.open; //Если любой из параметров есть - то окрываем окно
          this.from = this.activeParams.diameterFrom ? +this.activeParams.diameterFrom : null;
          this.to = this.activeParams.diameterTo ? +this.activeParams.diameterTo : null;
        }//Если компонент с диаметром - то заполняем его и открываем если есть что-то
      } else { //Если тип не установлен - то мы работаем с категориями
        this.activeParams.types = Array.isArray(params['types']) ? params['types'] : [params['types']];//Присваиваем в массив те типы которые есть в url в виде массива
        //В HTML -> [checked]="activeParams.types.includes(type.url)" Если есть в массиве type.url присвоенный элементу - то он выбирается
        if (this.categoryWithTypes && this.categoryWithTypes.types && this.categoryWithTypes.types.length > 0) {
          //some - проходимся по каждому элементу массива (по чекбоксу), если хотябы 1 ретурн будет true - функция останавливается.
          if (this.categoryWithTypes.types.some(cattype => this.activeParams.types.find(item => cattype.url === item))){//Сравниваем 2 массива. Если есть хоть 1 тип из этого компоненты в url - то разварачиваем компонент
          this.open = true;
          }
        }
      }
    });
  }

  toggle(): void {
    this.open = !this.open;
  }

  updateFilterParam(url: string, checked: boolean): void {
    if (this.activeParams.types && this.activeParams.types.length > 0) {
      const existingTypeInParams = this.activeParams.types.find(item => item === url);
      if (existingTypeInParams && !checked) {
        this.activeParams.types = this.activeParams.types.filter(item => item !== url);//Удаляем элемент === url
      } else if (!existingTypeInParams && checked) {
        //this.activeParams.types.push(url); метод пуш тут глючит
        this.activeParams.types = [...this.activeParams.types, url];//Присваиваем в массив новый массив с новым элементом
      }
    } else if (checked) {
      this.activeParams.types = [url];
    }

    this.activeParams.page=1;//Сброс пагинации при изменении фильтра
    this.router.navigate(['/catalog'], {
      queryParams: this.activeParams
    });
  }

  updateFilterParamFromTo(param: string, value: string) {
    if (param === 'heightTo' || param === 'heightFrom' || param === 'diameterTo' || param === 'diameterFrom') {
      if (this.activeParams[param] && !value) {
        delete this.activeParams[param]
      } else {
        this.activeParams[param] = value;
      }
      this.activeParams.page=1;//Сброс пагинации при изменении фильтра
      this.router.navigate(['/catalog'], {
        queryParams: this.activeParams
      });
    }
  }
}
